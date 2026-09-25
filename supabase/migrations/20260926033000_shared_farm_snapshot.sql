-- Phase 2.3: expose shared farms in the existing cloud snapshot without
-- changing the legacy owned-farm payload consumed by the current production app.

create or replace function public.get_cloud_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with current_account as (
    select a.*
    from public.accounts a
    where a.owner_user_id = auth.uid()
    limit 1
  ), current_subscription as (
    select s.*
    from public.subscriptions s
    join current_account a on a.id = s.account_id
    limit 1
  )
  select jsonb_build_object(
    'profile', (
      select to_jsonb(p)
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    'account', (
      select to_jsonb(a)
      from current_account a
    ),
    'subscription', (
      select to_jsonb(s)
      from current_subscription s
    ),
    'plan', (
      select to_jsonb(pl)
      from public.plans pl
      join current_subscription s on s.plan_id = pl.id
      limit 1
    ),
    'entitlements', public.get_entitlements(),
    'farms', coalesce((
      select jsonb_agg(f.data order by f.created_at)
      from public.farms f
      join current_account a on a.id = f.account_id
    ), '[]'::jsonb),
    'irrigationSchedules', coalesce((
      select jsonb_object_agg(s.farm_id, s.data)
      from public.irrigation_schedules s
      join current_account a on a.id = s.account_id
    ), '{}'::jsonb),
    'sharedFarms', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'account_id', f.account_id,
          'farm_id', f.id,
          'role', private.farm_role(f.account_id, f.id),
          'data', f.data
        )
        order by f.created_at
      )
      from public.farms f
      where not exists (
        select 1 from current_account a where a.id = f.account_id
      )
    ), '[]'::jsonb),
    'sharedIrrigationSchedules', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'account_id', s.account_id,
          'farm_id', s.farm_id,
          'data', s.data
        )
        order by s.created_at
      )
      from public.irrigation_schedules s
      where not exists (
        select 1 from current_account a where a.id = s.account_id
      )
    ), '[]'::jsonb),
    'migration', (
      select jsonb_build_object(
        'fingerprint', li.fingerprint,
        'imported_farms', li.imported_farms,
        'imported_schedules', li.imported_schedules,
        'created_at', li.created_at
      )
      from public.legacy_imports li
      join current_account a on a.id = li.account_id
      limit 1
    )
  );
$$;

revoke all on function public.get_cloud_snapshot() from public, anon;
grant execute on function public.get_cloud_snapshot() to authenticated;

-- Shared schedule writes need an explicit account target. The existing
-- save_irrigation_schedule(text,jsonb) function remains unchanged for the
-- current production client and owned farms.
create function public.save_shared_irrigation_schedule(
  p_account_id uuid,
  p_farm_id text,
  p_data jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if private.farm_role(p_account_id, p_farm_id) not in ('owner','manager','worker') then
    raise exception 'FARM_WRITE_FORBIDDEN';
  end if;

  insert into public.irrigation_schedules(account_id, farm_id, data)
    values(p_account_id, p_farm_id, p_data)
    on conflict (account_id, farm_id) do update set data = excluded.data;
end
$$;

revoke all on function public.save_shared_irrigation_schedule(uuid,text,jsonb)
  from public, anon;
grant execute on function public.save_shared_irrigation_schedule(uuid,text,jsonb)
  to authenticated;
