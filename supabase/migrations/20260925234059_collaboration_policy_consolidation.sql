-- Consolidate collaboration-aware RLS so each operation has one permissive
-- policy. The MFA gate remains a separate restrictive policy.

drop policy if exists farms_own on public.farms;
drop policy if exists farms_member_read on public.farms;
drop policy if exists farms_manager_update on public.farms;

create policy farms_access_select
on public.farms
for select
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, id) in ('owner','manager','worker','viewer')
);

create policy farms_access_insert
on public.farms
for insert
to authenticated
with check (
  (select private.is_verified())
  and private.farm_role(account_id, id) = 'owner'
);

create policy farms_access_update
on public.farms
for update
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, id) in ('owner','manager')
)
with check (
  (select private.is_verified())
  and private.farm_role(account_id, id) in ('owner','manager')
);

create policy farms_access_delete
on public.farms
for delete
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, id) = 'owner'
);

drop policy if exists schedules_own on public.irrigation_schedules;
drop policy if exists schedules_member_read on public.irrigation_schedules;
drop policy if exists schedules_operator_insert on public.irrigation_schedules;
drop policy if exists schedules_operator_update on public.irrigation_schedules;
drop policy if exists schedules_operator_delete on public.irrigation_schedules;

create policy schedules_access_select
on public.irrigation_schedules
for select
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('owner','manager','worker','viewer')
);

create policy schedules_access_insert
on public.irrigation_schedules
for insert
to authenticated
with check (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('owner','manager','worker')
);

create policy schedules_access_update
on public.irrigation_schedules
for update
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('owner','manager','worker')
)
with check (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('owner','manager','worker')
);

create policy schedules_access_delete
on public.irrigation_schedules
for delete
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('owner','manager','worker')
);
