-- Personal accounts provide a stable ownership boundary for future memberships.
-- This migration is additive. No existing auth users or local data are deleted.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://')),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  language text not null default 'en' check (language in ('en', 'fa')),
  timezone text not null default 'UTC' check (char_length(timezone) <= 100),
  onboarding_step smallint not null default 0 check (onboarding_step between 0 and 5),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  kind text not null default 'personal' check (kind = 'personal'),
  farm_count integer not null default 0 check (farm_count >= 0),
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index plans_one_default on public.plans (is_default) where is_default;

create table public.plan_entitlements (
  plan_id uuid not null references public.plans(id) on delete cascade,
  key text not null,
  value jsonb not null,
  primary key (plan_id, key),
  check (
    (key in ('max_farms', 'max_sensors', 'max_team_members', 'ai_requests_per_month')
      and jsonb_typeof(value) = 'number' and value::text ~ '^[0-9]+$')
    or (key in ('advanced_irrigation', 'automation_access', 'advanced_analytics') and jsonb_typeof(value) = 'boolean')
  )
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in ('active', 'trialing', 'paused', 'expired', 'canceled')),
  source text not null default 'default',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

-- Versioned, lossless documents preserve every current Farm / Schedule field.
-- Relational ownership, foreign keys, limits and validation remain in Postgres.
create function private.valid_farm(d jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare p jsonb;
begin
  if jsonb_typeof(d) <> 'object' or not (d ?& array['id','name','location','area','type']) then return false; end if;
  if jsonb_typeof(d->'id') <> 'string' or (d->>'id') !~ '^[A-Za-z0-9_-]{1,128}$'
    or jsonb_typeof(d->'name') <> 'string' or char_length(btrim(d->>'name')) not between 1 and 120
    or jsonb_typeof(d->'location') <> 'string' or char_length(d->>'location') > 500
    or jsonb_typeof(d->'area') <> 'number' or (d->>'area')::numeric < 0
    or (d->>'area')::numeric > 1000000000000 or jsonb_typeof(d->'type') <> 'string' or d->>'type' not in ('farm','garden') then return false; end if;
  if d ? 'coordinates' then
    if jsonb_typeof(d->'coordinates') <> 'object' or not ((d->'coordinates') ?& array['latitude','longitude'])
      or jsonb_typeof(d#>'{coordinates,latitude}') <> 'number' or jsonb_typeof(d#>'{coordinates,longitude}') <> 'number'
      or (d#>>'{coordinates,latitude}')::numeric not between -90 and 90
      or (d#>>'{coordinates,longitude}')::numeric not between -180 and 180 then return false; end if;
  end if;
  if d ? 'irrigationType' and (jsonb_typeof(d->'irrigationType') <> 'string' or d->>'irrigationType' not in ('flood','drip','sprinkler','other')) then return false; end if;
  if d ? 'crop' then
    if jsonb_typeof(d->'crop') <> 'object' or not ((d->'crop') ?& array['id','name'])
      or jsonb_typeof(d#>'{crop,id}') <> 'string' or char_length(d#>>'{crop,id}') not between 1 and 128
      or jsonb_typeof(d#>'{crop,name}') <> 'string' or char_length(d#>>'{crop,name}') not between 1 and 120 then return false; end if;
  end if;
  if d ? 'plants' then
    if jsonb_typeof(d->'plants') <> 'array' or jsonb_array_length(d->'plants') > 1000 then return false; end if;
    for p in select value from jsonb_array_elements(d->'plants') loop
      if jsonb_typeof(p) <> 'object' or not (p ?& array['id','name','quantity','spacing','age'])
        or jsonb_typeof(p->'id') <> 'string' or char_length(p->>'id') not between 1 and 128
        or jsonb_typeof(p->'name') <> 'string' or char_length(p->>'name') not between 1 and 120
        or jsonb_typeof(p->'quantity') <> 'number' or (p->>'quantity')::numeric < 0
        or jsonb_typeof(p->'spacing') <> 'number' or (p->>'spacing')::numeric < 0
        or jsonb_typeof(p->'age') <> 'number' or (p->>'age')::numeric < 0 then return false; end if;
    end loop;
  end if;
  return octet_length(d::text) <= 262144;
exception when others then return false;
end $$;

create function private.valid_schedule(d jsonb) returns boolean
language plpgsql stable set search_path = '' as $$
begin
  if jsonb_typeof(d) <> 'object' or not (d ?& array['date','time','duration']) then return false; end if;
  if jsonb_typeof(d->'date') <> 'string' or (d->>'date') !~ '^\d{4}-\d{2}-\d{2}$'
    or to_char((d->>'date')::date, 'YYYY-MM-DD') <> d->>'date'
    or jsonb_typeof(d->'time') <> 'string' or (d->>'time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or jsonb_typeof(d->'duration') <> 'number' or (d->>'duration')::numeric not between 1 and 1440 then return false; end if;
  if d ? 'id' and (jsonb_typeof(d->'id') <> 'string' or char_length(d->>'id') not between 1 and 128) then return false; end if;
  if d ? 'revision' and (jsonb_typeof(d->'revision') <> 'number' or (d->>'revision') !~ '^[1-9][0-9]*$') then return false; end if;
  if d ? 'timeZone' and not exists (select 1 from pg_catalog.pg_timezone_names where name = d->>'timeZone') then return false; end if;
  if d ? 'createdAt' then if jsonb_typeof(d->'createdAt') <> 'string' then return false; end if; perform (d->>'createdAt')::timestamptz; end if;
  if d ? 'updatedAt' then if jsonb_typeof(d->'updatedAt') <> 'string' then return false; end if; perform (d->>'updatedAt')::timestamptz; end if;
  return octet_length(d::text) <= 8192;
exception when others then return false;
end $$;

create table public.farms (
  account_id uuid not null references public.accounts(id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, id),
  check (private.valid_farm(data) and data->>'id' = id)
);
create table public.irrigation_schedules (
  account_id uuid not null,
  farm_id text not null,
  data jsonb not null check (private.valid_schedule(data)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, farm_id),
  foreign key (account_id, farm_id) references public.farms(account_id, id) on delete cascade
);
create table public.legacy_imports (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  fingerprint text not null,
  snapshot jsonb not null,
  selected_ids jsonb not null,
  imported_farms integer not null,
  imported_schedules integer not null,
  created_at timestamptz not null default now()
);

create function private.current_account_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.accounts where owner_user_id = (select auth.uid())
$$;
create function private.account_entitlements(target uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  from public.subscriptions s join public.plans p on p.id = s.plan_id
  join public.plan_entitlements e on e.plan_id = p.id
  where s.account_id = target and s.status in ('active','trialing') and p.is_active
    and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
$$;
create function public.get_entitlements() returns jsonb
language sql stable security definer set search_path = '' as $$
  select private.account_entitlements(private.current_account_id())
$$;

-- AFTER INSERT is intentional: ON CONFLICT DO NOTHING must not consume a slot.
-- UPDATE rechecks the latest row version under the account row lock, so parallel
-- INSERTs cannot both claim the final slot. An exception rolls back the INSERT.
create function private.track_farm_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare limit_value integer;
begin
  if tg_op = 'INSERT' then
    limit_value := coalesce((private.account_entitlements(new.account_id)->>'max_farms')::integer, 0);
    update public.accounts set farm_count = farm_count + 1
      where id = new.account_id and farm_count < limit_value;
    if not found then raise exception using errcode = 'P0001', message = 'FARM_LIMIT_REACHED'; end if;
    return new;
  end if;
  update public.accounts set farm_count = farm_count - 1 where id = old.account_id;
  return old;
end $$;
create trigger farms_count after insert or delete on public.farms for each row execute function private.track_farm_count();

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger farms_touch before update on public.farms for each row execute function private.touch_updated_at();
create trigger schedules_touch before update on public.irrigation_schedules for each row execute function private.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions for each row execute function private.touch_updated_at();
create function private.validate_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception using errcode = '23514', message = 'INVALID_TIMEZONE';
  end if;
  new.updated_at := now(); return new;
end $$;
create trigger profiles_validate before insert or update on public.profiles for each row execute function private.validate_profile();

-- All application data requires both a valid identity and confirmed email.
create function private.is_verified() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null)
$$;
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.farms enable row level security;
alter table public.irrigation_schedules enable row level security;
alter table public.legacy_imports enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) and (select private.is_verified()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid()) and (select private.is_verified())) with check (id = (select auth.uid()) and (select private.is_verified()));
create policy accounts_read on public.accounts for select to authenticated using (owner_user_id = (select auth.uid()) and (select private.is_verified()));
create policy plans_read on public.plans for select to authenticated using (is_active and (select private.is_verified()));
create policy entitlements_read on public.plan_entitlements for select to authenticated using ((select private.is_verified()));
create policy subscriptions_read on public.subscriptions for select to authenticated using (account_id = (select private.current_account_id()) and (select private.is_verified()));
create policy farms_own on public.farms for all to authenticated using (account_id = (select private.current_account_id()) and (select private.is_verified())) with check (account_id = (select private.current_account_id()) and (select private.is_verified()));
create policy schedules_own on public.irrigation_schedules for all to authenticated using (account_id = (select private.current_account_id()) and (select private.is_verified())) with check (account_id = (select private.current_account_id()) and (select private.is_verified()));
create policy imports_read on public.legacy_imports for select to authenticated using (account_id = (select private.current_account_id()) and (select private.is_verified()));

-- Explicit grants prevent clients from changing ownership, plans or counters.
revoke all on public.profiles, public.accounts, public.plans, public.plan_entitlements, public.subscriptions, public.farms, public.irrigation_schedules, public.legacy_imports from anon, authenticated;
grant select on public.profiles, public.accounts, public.plans, public.plan_entitlements, public.subscriptions, public.farms, public.irrigation_schedules, public.legacy_imports to authenticated;
grant update (full_name, avatar_url, country_code, language, timezone, onboarding_step) on public.profiles to authenticated;
grant insert (account_id, id, data), update (data), delete on public.farms to authenticated;
grant insert (account_id, farm_id, data), update (data), delete on public.irrigation_schedules to authenticated;

create function public.complete_onboarding() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.farms where account_id = private.current_account_id()) then raise exception 'FIRST_FARM_REQUIRED'; end if;
  update public.profiles set onboarding_completed = true, onboarding_step = 5
    where id = auth.uid() and char_length(btrim(full_name)) > 0 and country_code is not null;
  if not found then raise exception 'PROFILE_INCOMPLETE'; end if;
end $$;

-- Validate and import a frozen snapshot in ONE transaction. The full snapshot,
-- including farms above the current limit, is retained for later recovery.
create function public.import_legacy_data(p_snapshot jsonb, p_selected_ids jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target uuid; receipt public.legacy_imports; fingerprint_value text; f jsonb; s record; farm_total integer; schedule_total integer := 0;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  target := private.current_account_id();
  perform 1 from public.accounts where id = target for update;
  if not found then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_snapshot) <> 'object' or not (p_snapshot ?& array['farms','schedules'])
    or jsonb_typeof(p_snapshot->'farms') <> 'array' or jsonb_typeof(p_snapshot->'schedules') <> 'object'
    or jsonb_typeof(p_selected_ids) <> 'array' or octet_length(p_snapshot::text) > 900000 then raise exception 'INVALID_IMPORT'; end if;
  fingerprint_value := encode(sha256(convert_to(jsonb_build_array(p_snapshot, p_selected_ids)::text, 'UTF8')), 'hex');
  select * into receipt from public.legacy_imports where account_id = target;
  if found then
    if receipt.fingerprint <> fingerprint_value then raise exception 'IMPORT_ALREADY_COMPLETED'; end if;
    return jsonb_build_object('farms',receipt.imported_farms,'schedules',receipt.imported_schedules,'alreadyImported',true);
  end if;
  if exists (select 1 from public.farms where account_id = target) then raise exception 'CLOUD_NOT_EMPTY'; end if;
  farm_total := jsonb_array_length(p_selected_ids);
  if farm_total < 1 or farm_total > coalesce((private.account_entitlements(target)->>'max_farms')::integer,0) then raise exception 'FARM_LIMIT_REACHED'; end if;
  if (select count(distinct value) from jsonb_array_elements(p_selected_ids)) <> farm_total
    or (select count(distinct value->>'id') from jsonb_array_elements(p_snapshot->'farms')) <> jsonb_array_length(p_snapshot->'farms') then raise exception 'INVALID_IMPORT'; end if;
  for f in select value from jsonb_array_elements(p_snapshot->'farms') loop
    if not private.valid_farm(f) then raise exception 'INVALID_IMPORT'; end if;
    if p_selected_ids ? (f->>'id') then insert into public.farms(account_id,id,data) values(target,f->>'id',f); end if;
  end loop;
  if (select count(*) from public.farms where account_id = target) <> farm_total then raise exception 'INVALID_IMPORT'; end if;
  for s in select key, value from jsonb_each(p_snapshot->'schedules') loop
    if not private.valid_schedule(s.value) or not exists (select 1 from jsonb_array_elements(p_snapshot->'farms') as source_farm(value) where source_farm.value->>'id' = s.key) then raise exception 'INVALID_IMPORT'; end if;
    if p_selected_ids ? s.key then
      insert into public.irrigation_schedules(account_id,farm_id,data) values(target,s.key,s.value);
      schedule_total := schedule_total + 1;
    end if;
  end loop;
  insert into public.legacy_imports(account_id,fingerprint,snapshot,selected_ids,imported_farms,imported_schedules)
    values(target,fingerprint_value,p_snapshot,p_selected_ids,farm_total,schedule_total);
  return jsonb_build_object('farms',farm_total,'schedules',schedule_total,'alreadyImported',false);
end $$;

-- The default plan is data-driven; no application branch maps a plan code to limits.
insert into public.plans(code,name,is_default) values ('free','Free',true);
insert into public.plan_entitlements(plan_id,key,value)
  select p.id, e.key, e.value from public.plans p cross join jsonb_each(
    '{"max_farms":3,"max_sensors":5,"max_team_members":0,"ai_requests_per_month":50,"advanced_irrigation":false,"automation_access":false,"advanced_analytics":false}'::jsonb
  ) e where p.is_default;

create function private.bootstrap_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare account uuid; default_plan uuid;
begin
  select id into strict default_plan from public.plans where is_default and is_active;
  insert into public.profiles(id,full_name,language) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),120),case when new.raw_user_meta_data->>'language' = 'fa' then 'fa' else 'en' end);
  insert into public.accounts(owner_user_id) values(new.id) returning id into account;
  insert into public.subscriptions(account_id,plan_id) values(account,default_plan);
  return new;
end $$;
create trigger agromind_user_created after insert on auth.users for each row execute function private.bootstrap_user();

-- Backfill any pre-existing users without replacing their information.
insert into public.profiles(id,full_name) select id,left(coalesce(raw_user_meta_data->>'full_name',''),120) from auth.users on conflict do nothing;
insert into public.accounts(owner_user_id) select id from auth.users on conflict do nothing;
insert into public.subscriptions(account_id,plan_id) select a.id,p.id from public.accounts a cross join public.plans p where p.is_default on conflict do nothing;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_account_id(), private.is_verified(), private.valid_farm(jsonb), private.valid_schedule(jsonb) to authenticated;
revoke all on function public.get_entitlements(), public.complete_onboarding(), public.import_legacy_data(jsonb,jsonb) from public, anon;
grant execute on function public.get_entitlements(), public.complete_onboarding(), public.import_legacy_data(jsonb,jsonb) to authenticated;
