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

revoke all on function public.get_cloud_snapshot() from public;
revoke all on function public.get_cloud_snapshot() from anon;
grant execute on function public.get_cloud_snapshot() to authenticated;
