-- Enforce the same opt-in MFA rule inside privileged account RPCs as in RLS.
-- No ownership, entitlements or stored data are changed.

create or replace function public.complete_onboarding()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then
    raise exception using errcode = '42501', message = 'MFA_REQUIRED';
  end if;
  if not exists (select 1 from public.farms where account_id = private.current_account_id()) then raise exception 'FIRST_FARM_REQUIRED'; end if;
  update public.profiles
    set onboarding_completed = true, onboarding_step = 3
    where id = auth.uid() and country_code is not null;
  if not found then raise exception 'PROFILE_INCOMPLETE'; end if;
end $$;

create or replace function public.import_legacy_data(p_snapshot jsonb, p_selected_ids jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target uuid; receipt public.legacy_imports; fingerprint_value text; f jsonb; s record; farm_total integer; schedule_total integer := 0;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then
    raise exception using errcode = '42501', message = 'MFA_REQUIRED';
  end if;
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

create or replace function public.get_entitlements() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when private.is_verified() and private.mfa_access_allowed()
    then private.account_entitlements(private.current_account_id()) else '{}'::jsonb end
$$;

revoke all on function public.complete_onboarding(), public.import_legacy_data(jsonb,jsonb), public.get_entitlements() from public, anon;
grant execute on function public.complete_onboarding(), public.import_legacy_data(jsonb,jsonb), public.get_entitlements() to authenticated;
