-- Phase 2.3: secure farm invitations and owner team management.

create table private.farm_invitations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  farm_id text not null,
  invitee_email text not null,
  role text not null check (role in ('manager','worker','viewer')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending'
    check (status in ('pending','accepted','revoked','declined','expired')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  foreign key (account_id, farm_id)
    references public.farms(account_id, id) on delete cascade
);

create unique index farm_invitations_pending_unique
  on private.farm_invitations(account_id, farm_id, invitee_email)
  where status = 'pending';

create index farm_invitations_account_idx
  on private.farm_invitations(account_id, status, expires_at);

create index farm_invitations_email_idx
  on private.farm_invitations(invitee_email, status, expires_at);

create function private.team_seat_count(target_account uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with active_users as (
    select distinct m.user_id
    from public.farm_memberships m
    where m.account_id = target_account
  ),
  active_emails as (
    select lower(u.email) as email
    from auth.users u
    join active_users a on a.user_id = u.id
    where u.email is not null
  ),
  pending_emails as (
    select distinct i.invitee_email as email
    from private.farm_invitations i
    where i.account_id = target_account
      and i.status = 'pending'
      and i.expires_at > now()
      and not exists (
        select 1 from active_emails a where a.email = i.invitee_email
      )
  )
  select
    (select count(*) from active_users)::integer +
    (select count(*) from pending_emails)::integer
$$;

create or replace function private.enforce_team_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_value integer;
  current_seats integer;
  owner_id uuid;
  member_email text;
  reserved boolean;
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

  select lower(u.email) into member_email
  from auth.users u
  where u.id = new.user_id;

  select exists (
    select 1
    from private.farm_invitations i
    where i.account_id = new.account_id
      and i.invitee_email = member_email
      and i.status = 'pending'
      and i.expires_at > now()
  ) into reserved;

  limit_value := coalesce(
    (private.account_entitlements(new.account_id)->>'max_team_members')::integer,
    0
  );
  current_seats := private.team_seat_count(new.account_id);

  if reserved then
    if limit_value <= 0 or current_seats > limit_value then
      raise exception using errcode = 'P0001', message = 'TEAM_MEMBER_LIMIT_REACHED';
    end if;
    return new;
  end if;

  if current_seats >= limit_value then
    raise exception using errcode = 'P0001', message = 'TEAM_MEMBER_LIMIT_REACHED';
  end if;

  return new;
end
$$;

create function public.get_team_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_account uuid;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;

  select a.id into target_account
  from public.accounts a
  where a.owner_user_id = auth.uid()
  limit 1;

  if target_account is null then raise exception 'OWNER_REQUIRED'; end if;

  return jsonb_build_object(
    'activeSeats', (
      select count(distinct m.user_id)::integer
      from public.farm_memberships m
      where m.account_id = target_account
    ),
    'pendingSeats', greatest(
      private.team_seat_count(target_account) - (
        select count(distinct m.user_id)::integer
        from public.farm_memberships m
        where m.account_id = target_account
      ),
      0
    ),
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', m.user_id,
          'email', lower(u.email),
          'display_name', coalesce(
            nullif(trim(p.full_name), ''),
            nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
            lower(u.email)
          ),
          'farm_id', m.farm_id,
          'farm_name', coalesce(nullif(f.data->>'name', ''), m.farm_id),
          'role', m.role,
          'created_at', m.created_at
        )
        order by coalesce(p.full_name, u.email), f.created_at
      )
      from public.farm_memberships m
      join public.farms f
        on f.account_id = m.account_id and f.id = m.farm_id
      join auth.users u on u.id = m.user_id
      left join public.profiles p on p.id = m.user_id
      where m.account_id = target_account
    ), '[]'::jsonb),
    'invitations', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'email', i.invitee_email,
          'farm_id', i.farm_id,
          'farm_name', coalesce(nullif(f.data->>'name', ''), i.farm_id),
          'role', i.role,
          'expires_at', i.expires_at,
          'created_at', i.created_at
        )
        order by i.created_at desc
      )
      from private.farm_invitations i
      join public.farms f
        on f.account_id = i.account_id and f.id = i.farm_id
      where i.account_id = target_account
        and i.status = 'pending'
        and i.expires_at > now()
    ), '[]'::jsonb)
  );
end
$$;

create function public.create_farm_invitation(
  p_farm_id text,
  p_email text,
  p_role text,
  p_token_hash text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_account uuid;
  owner_email text;
  normalized_email text;
  limit_value integer;
  current_seats integer;
  seat_exists boolean;
  existing_user uuid;
  invitation_id uuid;
  farm_name text;
  expiry timestamptz := now() + interval '7 days';
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;

  normalized_email := lower(trim(p_email));
  if length(normalized_email) < 3
     or length(normalized_email) > 254
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception 'INVALID_EMAIL';
  end if;
  if p_role not in ('manager','worker','viewer') then
    raise exception 'INVALID_TEAM_ROLE';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_INVITATION_TOKEN';
  end if;

  select a.id, lower(u.email)
    into target_account, owner_email
  from public.accounts a
  join auth.users u on u.id = a.owner_user_id
  where a.owner_user_id = auth.uid()
  limit 1
  for update of a;

  if target_account is null then raise exception 'OWNER_REQUIRED'; end if;
  if normalized_email = owner_email then raise exception 'CANNOT_INVITE_OWNER'; end if;

  select coalesce(nullif(f.data->>'name',''), f.id)
    into farm_name
  from public.farms f
  where f.account_id = target_account
    and f.id = p_farm_id;

  if farm_name is null then raise exception 'FARM_NOT_FOUND'; end if;

  -- Expired pending rows no longer reserve a seat or block a fresh invitation.
  update private.farm_invitations
  set status = 'expired'
  where account_id = target_account
    and status = 'pending'
    and expires_at <= now();

  select u.id into existing_user
  from auth.users u
  where lower(u.email) = normalized_email
    and u.email_confirmed_at is not null
  limit 1;

  if existing_user is not null and exists (
    select 1
    from public.farm_memberships m
    where m.account_id = target_account
      and m.farm_id = p_farm_id
      and m.user_id = existing_user
  ) then
    raise exception 'MEMBER_ALREADY_ADDED';
  end if;

  -- Reissuing the same farm/email invite rotates the token without consuming
  -- another seat.
  select i.id into invitation_id
  from private.farm_invitations i
  where i.account_id = target_account
    and i.farm_id = p_farm_id
    and i.invitee_email = normalized_email
    and i.status = 'pending'
  limit 1;

  if invitation_id is not null then
    update private.farm_invitations
    set role = p_role,
        token_hash = p_token_hash,
        invited_by = auth.uid(),
        expires_at = expiry,
        created_at = now(),
        accepted_at = null,
        revoked_at = null
    where id = invitation_id;

    return jsonb_build_object(
      'id', invitation_id,
      'farm_name', farm_name,
      'expires_at', expiry
    );
  end if;

  select (
    (existing_user is not null and exists (
      select 1
      from public.farm_memberships m
      where m.account_id = target_account
        and m.user_id = existing_user
    ))
    or exists (
      select 1
      from private.farm_invitations i
      where i.account_id = target_account
        and i.invitee_email = normalized_email
        and i.status = 'pending'
        and i.expires_at > now()
    )
  ) into seat_exists;

  if not seat_exists then
    limit_value := coalesce(
      (private.account_entitlements(target_account)->>'max_team_members')::integer,
      0
    );
    current_seats := private.team_seat_count(target_account);
    if current_seats >= limit_value then
      raise exception 'TEAM_MEMBER_LIMIT_REACHED';
    end if;
  end if;

  insert into private.farm_invitations(
    account_id, farm_id, invitee_email, role, token_hash,
    invited_by, expires_at
  ) values (
    target_account, p_farm_id, normalized_email, p_role, p_token_hash,
    auth.uid(), expiry
  )
  returning id into invitation_id;

  return jsonb_build_object(
    'id', invitation_id,
    'farm_name', farm_name,
    'expires_at', expiry
  );
end
$$;

create function public.revoke_farm_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_account uuid;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;

  select a.id into target_account
  from public.accounts a
  where a.owner_user_id = auth.uid()
  limit 1;
  if target_account is null then raise exception 'OWNER_REQUIRED'; end if;

  update private.farm_invitations
  set status = 'revoked', revoked_at = now()
  where id = p_invitation_id
    and account_id = target_account
    and status = 'pending';

  if not found then raise exception 'INVITATION_NOT_FOUND'; end if;
end
$$;

create function public.accept_farm_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
  invitation_account uuid;
  invitation_farm text;
  invitation_email text;
  invitation_role text;
  invitation_expires timestamptz;
  current_email text;
  farm_name text;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVITATION_INVALID';
  end if;

  select i.id, i.account_id, i.farm_id, i.invitee_email, i.role, i.expires_at
    into invitation_id, invitation_account, invitation_farm,
         invitation_email, invitation_role, invitation_expires
  from private.farm_invitations i
  where i.token_hash = p_token_hash
    and i.status = 'pending'
  for update;

  if invitation_id is null then raise exception 'INVITATION_INVALID'; end if;
  if invitation_expires <= now() then raise exception 'INVITATION_EXPIRED'; end if;

  select lower(u.email) into current_email
  from auth.users u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null;

  if current_email is null or current_email <> invitation_email then
    raise exception 'INVITATION_EMAIL_MISMATCH';
  end if;

  insert into public.farm_memberships(account_id, farm_id, user_id, role)
  values(invitation_account, invitation_farm, auth.uid(), invitation_role)
  on conflict (account_id, farm_id, user_id)
  do update set role = excluded.role;

  update private.farm_invitations
  set status = 'accepted', accepted_at = now()
  where id = invitation_id;

  select coalesce(nullif(f.data->>'name',''), f.id) into farm_name
  from public.farms f
  where f.account_id = invitation_account
    and f.id = invitation_farm;

  return jsonb_build_object(
    'farm_id', invitation_farm,
    'farm_name', farm_name,
    'role', invitation_role
  );
end
$$;

create function public.decline_farm_invitation(p_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
  invitation_email text;
  invitation_expires timestamptz;
  current_email text;
begin
  if not private.is_verified() then raise exception 'AUTH_REQUIRED'; end if;
  if not private.mfa_access_allowed() then raise exception 'MFA_REQUIRED'; end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'INVITATION_INVALID';
  end if;

  select i.id, i.invitee_email, i.expires_at
    into invitation_id, invitation_email, invitation_expires
  from private.farm_invitations i
  where i.token_hash = p_token_hash
    and i.status = 'pending'
  for update;

  if invitation_id is null then raise exception 'INVITATION_INVALID'; end if;
  if invitation_expires <= now() then raise exception 'INVITATION_EXPIRED'; end if;

  select lower(u.email) into current_email
  from auth.users u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null;

  if current_email is null or current_email <> invitation_email then
    raise exception 'INVITATION_EMAIL_MISMATCH';
  end if;

  update private.farm_invitations
  set status = 'declined', revoked_at = now()
  where id = invitation_id;
end
$$;

revoke all on function private.team_seat_count(uuid),
  public.get_team_overview(),
  public.create_farm_invitation(text,text,text,text),
  public.revoke_farm_invitation(uuid),
  public.accept_farm_invitation(text),
  public.decline_farm_invitation(text)
from public, anon, authenticated;

grant execute on function public.get_team_overview(),
  public.create_farm_invitation(text,text,text,text),
  public.revoke_farm_invitation(uuid),
  public.accept_farm_invitation(text),
  public.decline_farm_invitation(text)
to authenticated;
