-- Keep account overview readable when an assigned plan is retired, while
-- inactive subscriptions/plans continue to grant no capabilities.
create index subscriptions_plan_id_idx on public.subscriptions(plan_id);
drop policy plans_read on public.plans;
create policy plans_read on public.plans for select to authenticated
using ((select private.is_verified()) and (is_active or id in (
  select plan_id from public.subscriptions where account_id = (select private.current_account_id())
)));
create or replace function public.get_entitlements() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when private.is_verified()
    then private.account_entitlements(private.current_account_id()) else '{}'::jsonb end
$$;
revoke all on function public.get_entitlements() from public, anon;
grant execute on function public.get_entitlements() to authenticated;
