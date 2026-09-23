alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '';

with names as (
  select
    id,
    btrim(coalesce(full_name, '')) as display_name
  from public.profiles
)
update public.profiles p
set
  first_name = left(
    case
      when names.display_name = '' then ''
      when strpos(names.display_name, ' ') = 0 then names.display_name
      else substr(names.display_name, 1, strpos(names.display_name, ' ') - 1)
    end,
    60
  ),
  last_name = left(
    case
      when strpos(names.display_name, ' ') = 0 then ''
      else btrim(substr(names.display_name, strpos(names.display_name, ' ') + 1))
    end,
    60
  )
from names
where p.id = names.id
  and p.first_name = ''
  and p.last_name = '';

alter table public.profiles
  drop constraint if exists profiles_first_name_length_check,
  drop constraint if exists profiles_last_name_length_check;

alter table public.profiles
  add constraint profiles_first_name_length_check
    check (char_length(first_name) <= 60),
  add constraint profiles_last_name_length_check
    check (char_length(last_name) <= 60);

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
  select id into strict default_plan from public.plans where is_default and is_active;

  normalized_username := lower(nullif(btrim(coalesce(new.raw_user_meta_data->>'username','')), ''));
  if normalized_username is not null and normalized_username !~ '^[a-z0-9_]{3,30}$' then
    normalized_username := null;
  end if;

  given_name := left(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), 60);
  family_name := left(btrim(coalesce(new.raw_user_meta_data->>'last_name', '')), 60);
  legacy_full_name := btrim(coalesce(new.raw_user_meta_data->>'full_name', ''));

  if given_name = '' and family_name = '' and legacy_full_name <> '' then
    if strpos(legacy_full_name, ' ') = 0 then
      given_name := left(legacy_full_name, 60);
    else
      given_name := left(substr(legacy_full_name, 1, strpos(legacy_full_name, ' ') - 1), 60);
      family_name := left(btrim(substr(legacy_full_name, strpos(legacy_full_name, ' ') + 1)), 60);
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
    case when new.raw_user_meta_data->>'language' = 'fa' then 'fa' else 'en' end
  );

  verification_hash := nullif(new.raw_user_meta_data->>'verification_watch_hash','');
  if verification_hash is not null and verification_hash ~ '^[a-f0-9]{64}$' then
    insert into private.signup_verification_watches(user_id, token_hash)
    values(new.id, verification_hash)
    on conflict (user_id) do update
      set token_hash = excluded.token_hash,
          expires_at = now() + interval '24 hours';
  end if;

  insert into public.accounts(owner_user_id) values(new.id) returning id into account;
  insert into public.subscriptions(account_id,plan_id) values(account,default_plan);
  return new;
end $$;
