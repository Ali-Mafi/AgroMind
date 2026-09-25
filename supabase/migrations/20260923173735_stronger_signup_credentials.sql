-- New usernames must be at least 6 characters.
-- Keep the existing database column constraint at 3 characters so the
-- grandfathered admin account can continue to use its current username.

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_username is null
      or lower(btrim(p_username)) !~ '^[a-z0-9_]{6,30}$'
      then false
    else not exists (
      select 1
      from public.profiles p
      where lower(p.username) = lower(btrim(p_username))
    )
  end;
$$;

create or replace function public.change_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
begin
  if not private.is_verified() then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  normalized := lower(btrim(coalesce(p_username, '')));
  if normalized !~ '^[a-z0-9_]{6,30}$' then
    raise exception using errcode = '22023', message = 'INVALID_USERNAME';
  end if;

  if not exists (
    select 1
    from auth.mfa_factors
    where user_id = auth.uid()
      and factor_type = 'totp'
      and status = 'verified'
  ) then
    raise exception using errcode = 'P0001', message = 'MFA_REQUIRED';
  end if;

  if coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception using errcode = 'P0001', message = 'MFA_CHALLENGE_REQUIRED';
  end if;

  begin
    update public.profiles
      set username = normalized
      where id = auth.uid();
  exception
    when unique_violation then
      raise exception using errcode = '23505', message = 'USERNAME_TAKEN';
  end;

  if not found then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  return normalized;
end $$;

revoke all on function public.change_username(text) from public, anon;
grant execute on function public.change_username(text) to authenticated;

create or replace function private.bootstrap_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account uuid;
  default_plan uuid;
  normalized_username text;
  verification_hash text;
  given_name text;
  family_name text;
  legacy_full_name text;
  display_name text;
begin
  select id
    into strict default_plan
    from public.plans
    where is_default and is_active;

  normalized_username :=
    lower(nullif(btrim(coalesce(new.raw_user_meta_data->>'username','')), ''));

  if normalized_username is not null
    and normalized_username !~ '^[a-z0-9_]{6,30}$'
  then
    raise exception using errcode = '22023', message = 'INVALID_USERNAME';
  end if;

  given_name :=
    left(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), 60);
  family_name :=
    left(btrim(coalesce(new.raw_user_meta_data->>'last_name', '')), 60);
  legacy_full_name :=
    btrim(coalesce(new.raw_user_meta_data->>'full_name', ''));

  if given_name = '' and family_name = '' and legacy_full_name <> '' then
    if strpos(legacy_full_name, ' ') = 0 then
      given_name := left(legacy_full_name, 60);
    else
      given_name :=
        left(substr(legacy_full_name, 1, strpos(legacy_full_name, ' ') - 1), 60);
      family_name :=
        left(btrim(substr(legacy_full_name, strpos(legacy_full_name, ' ') + 1)), 60);
    end if;
  end if;

  display_name := left(
    btrim(concat_ws(' ', nullif(given_name, ''), nullif(family_name, ''))),
    120
  );

  insert into public.profiles(
    id,
    username,
    first_name,
    last_name,
    full_name,
    language
  )
  values(
    new.id,
    normalized_username,
    given_name,
    family_name,
    display_name,
    case
      when new.raw_user_meta_data->>'language' = 'fa' then 'fa'
      else 'en'
    end
  );

  verification_hash :=
    nullif(new.raw_user_meta_data->>'verification_watch_hash','');

  if verification_hash is not null
    and verification_hash ~ '^[a-f0-9]{64}$'
  then
    insert into private.signup_verification_watches(user_id, token_hash)
    values(new.id, verification_hash)
    on conflict (user_id) do update
      set token_hash = excluded.token_hash,
          expires_at = now() + interval '24 hours';
  end if;

  insert into public.accounts(owner_user_id)
  values(new.id)
  returning id into account;

  insert into public.subscriptions(account_id, plan_id)
  values(account, default_plan);

  return new;
end $$;
