alter table public.profiles add column if not exists username text;

alter table public.profiles drop constraint if exists profiles_username_format_check;
alter table public.profiles add constraint profiles_username_format_check
  check (username is null or (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$'));

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_username is null or lower(btrim(p_username)) !~ '^[a-z0-9_]{3,30}$' then false
    else not exists (
      select 1 from public.profiles p
      where lower(p.username) = lower(btrim(p_username))
    )
  end;
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

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
begin
  select id into strict default_plan from public.plans where is_default and is_active;
  normalized_username := lower(nullif(btrim(coalesce(new.raw_user_meta_data->>'username','')), ''));
  if normalized_username is not null and normalized_username !~ '^[a-z0-9_]{3,30}$' then
    normalized_username := null;
  end if;
  insert into public.profiles(id,username,full_name,language)
  values(
    new.id,
    normalized_username,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),120),
    case when new.raw_user_meta_data->>'language' = 'fa' then 'fa' else 'en' end
  );
  insert into public.accounts(owner_user_id) values(new.id) returning id into account;
  insert into public.subscriptions(account_id,plan_id) values(account,default_plan);
  return new;
end $$;

update public.profiles
set onboarding_step = least(onboarding_step, 3)
where onboarding_completed = false;

create or replace function public.complete_onboarding()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.farms where account_id = private.current_account_id()) then raise exception 'FIRST_FARM_REQUIRED'; end if;
  update public.profiles
    set onboarding_completed = true, onboarding_step = 3
    where id = auth.uid() and country_code is not null;
  if not found then raise exception 'PROFILE_INCOMPLETE'; end if;
end $$;
