-- Phase 2.3: farm collaboration foundation.
-- Account ownership remains the immutable source of the owner role. Shared
-- access is additive per farm and never changes the owning account.

create table public.farm_memberships (
  account_id uuid not null,
  farm_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager','worker','viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (account_id, farm_id, user_id),
  foreign key (account_id, farm_id)
    references public.farms(account_id, id) on delete cascade
);

create index farm_memberships_user_idx
  on public.farm_memberships(user_id, account_id, farm_id);
create index farm_memberships_account_user_idx
  on public.farm_memberships(account_id, user_id);

create trigger farm_memberships_touch
before update on public.farm_memberships
for each row execute function private.touch_updated_at();

-- Resolve the caller's effective role without exposing account ownership rows or
-- depending on farm_memberships RLS (which would recurse).
create function private.farm_role(target_account uuid, target_farm text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.accounts a
      where a.id = target_account
        and a.owner_user_id = (select auth.uid())
    ) then 'owner'
    else (
      select m.role
      from public.farm_memberships m
      where m.account_id = target_account
        and m.farm_id = target_farm
        and m.user_id = (select auth.uid())
      limit 1
    )
  end
$$;

-- A team seat is account-wide: the same collaborator can belong to several
-- farms without consuming more than one max_team_members entitlement slot.
create function private.enforce_team_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_value integer;
  current_members integer;
  owner_id uuid;
begin
  select owner_user_id into owner_id
  from public.accounts
  where id = new.account_id
  for update;

  if owner_id is null then
    raise exception using errcode = 'P0001', message = 'ACCOUNT_NOT_FOUND';
  end if;
  if new.user_id = owner_id then
    raise exception using errcode = 'P0001', message = 'OWNER_MEMBERSHIP_FORBIDDEN';
  end if;

  if exists (
    select 1
    from public.farm_memberships m
    where m.account_id = new.account_id
      and m.user_id = new.user_id
  ) then
    return new;
  end if;

  limit_value := coalesce(
    (private.account_entitlements(new.account_id)->>'max_team_members')::integer,
    0
  );
  select count(distinct m.user_id)::integer into current_members
  from public.farm_memberships m
  where m.account_id = new.account_id;

  if current_members >= limit_value then
    raise exception using errcode = 'P0001', message = 'TEAM_MEMBER_LIMIT_REACHED';
  end if;

  return new;
end
$$;

create trigger farm_memberships_limit
before insert on public.farm_memberships
for each row execute function private.enforce_team_member_limit();

alter table public.farm_memberships enable row level security;

-- Members can inspect their own assignment. Owners and managers can inspect the
-- team attached to a farm, but direct membership mutations remain unavailable.
create policy farm_memberships_read
on public.farm_memberships
for select
to authenticated
using (
  (select private.is_verified())
  and (
    user_id = (select auth.uid())
    or private.farm_role(account_id, farm_id) in ('owner','manager')
  )
);

create policy "mfa_gate"
on public.farm_memberships
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

-- Existing owner policies remain in place. These permissive policies add only
-- the minimum collaborator access for each role.
create policy farms_member_read
on public.farms
for select
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, id) in ('manager','worker','viewer')
);

create policy farms_manager_update
on public.farms
for update
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, id) = 'manager'
)
with check (
  (select private.is_verified())
  and private.farm_role(account_id, id) = 'manager'
);

create policy schedules_member_read
on public.irrigation_schedules
for select
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('manager','worker','viewer')
);

create policy schedules_operator_insert
on public.irrigation_schedules
for insert
to authenticated
with check (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('manager','worker')
);

create policy schedules_operator_update
on public.irrigation_schedules
for update
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('manager','worker')
)
with check (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('manager','worker')
);

create policy schedules_operator_delete
on public.irrigation_schedules
for delete
to authenticated
using (
  (select private.is_verified())
  and private.farm_role(account_id, farm_id) in ('manager','worker')
);

-- Membership changes go through owner-only RPCs so a collaborator can never
-- grant themselves a stronger role through direct table writes.
create function public.set_farm_member(
  p_account_id uuid,
  p_farm_id text,
  p_user_id uuid,
  p_role text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;
  if p_role not in ('manager','worker','viewer') then
    raise exception 'INVALID_TEAM_ROLE';
  end if;
  if not exists (
    select 1 from public.accounts
    where id = p_account_id and owner_user_id = auth.uid()
  ) then
    raise exception 'OWNER_REQUIRED';
  end if;
  if not exists (
    select 1 from public.farms
    where account_id = p_account_id and id = p_farm_id
  ) then
    raise exception 'FARM_NOT_FOUND';
  end if;
  if not exists (
    select 1 from auth.users
    where id = p_user_id and email_confirmed_at is not null
  ) then
    raise exception 'MEMBER_NOT_AVAILABLE';
  end if;

  insert into public.farm_memberships(account_id, farm_id, user_id, role)
  values(p_account_id, p_farm_id, p_user_id, p_role)
  on conflict (account_id, farm_id, user_id)
  do update set role = excluded.role;
end
$$;

create function public.remove_farm_member(
  p_account_id uuid,
  p_farm_id text,
  p_user_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;
  if not exists (
    select 1 from public.accounts
    where id = p_account_id and owner_user_id = auth.uid()
  ) then
    raise exception 'OWNER_REQUIRED';
  end if;

  delete from public.farm_memberships
  where account_id = p_account_id
    and farm_id = p_farm_id
    and user_id = p_user_id;
end
$$;

revoke all on public.farm_memberships from public, anon, authenticated;
grant select on public.farm_memberships to authenticated;

-- Farms/schedules already grant only data-column mutations; the new RLS
-- policies determine whether a collaborator can use those grants.
revoke all on function private.farm_role(uuid,text),
  private.enforce_team_member_limit(),
  public.set_farm_member(uuid,text,uuid,text),
  public.remove_farm_member(uuid,text,uuid)
from public, anon, authenticated;

grant execute on function private.farm_role(uuid,text) to authenticated;
grant execute on function public.set_farm_member(uuid,text,uuid,text),
  public.remove_farm_member(uuid,text,uuid)
to authenticated;
