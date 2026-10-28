-- Read provider-owned sessions only. Never write/trigger auth.* tables.
-- All metadata writes and proof consumption are server-only; no client metadata RPC.
create table private.security_sessions (
 session_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null, observed_at timestamptz not null default now(),
 metadata jsonb not null default '{}', provider text, completed_at timestamptz,
 baseline boolean not null default false
);
create index security_sessions_owner on private.security_sessions(user_id,created_at desc);
-- Existing sessions must never become "new login" notifications on reload after rollout.
insert into private.security_sessions(session_id,user_id,created_at,baseline)
 select id,user_id,created_at,true from auth.sessions;
create table private.security_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid, kind text not null, event_key text not null,
 created_at timestamptz not null default now(), details jsonb not null default '{}',
 unique(user_id,event_key)
);
create index security_events_owner on private.security_events(user_id,created_at desc);
create table private.security_revocations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null, factor_id uuid not null, scope text not null check(scope in ('others','global')),
 proof_hash text not null, created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '2 minutes', consumed_at timestamptz,
 state text not null default 'verifying' check(state in ('verifying','executing','failed','completed','pending')),
 targets uuid[] not null default '{}', unique(user_id,proof_hash)
);
create index security_revocations_owner on private.security_revocations(user_id,created_at desc);
create table private.security_denied_sessions (
 session_id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 denied_at timestamptz not null default now()
);
-- Tombstones are independent of metadata retention: never restore an old JWT by pruning history.
alter table private.security_sessions enable row level security;
alter table private.security_events enable row level security;
alter table private.security_revocations enable row level security;
alter table private.security_denied_sessions enable row level security;
revoke all on private.security_sessions,private.security_events,private.security_revocations,private.security_denied_sessions from public,anon,authenticated;

create or replace function private.session_is_active() returns boolean
language plpgsql stable security definer set search_path='' as $$
declare subject uuid:=auth.uid(); sid uuid;
begin
 if subject is null then return false; end if;
 begin sid:=(auth.jwt()->>'session_id')::uuid;
 exception when invalid_text_representation then return false; end;
 return sid is not null and exists(select 1 from auth.sessions s where s.id=sid and s.user_id=subject and (s.not_after is null or s.not_after>now()))
 and not exists(select 1 from private.security_denied_sessions d where d.session_id=sid);
end $$;
-- Still available at AAL1 so required-MFA logins can finish; never exposes other sessions.
create or replace function public.get_current_session() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',s.id,'created_at',s.created_at)
 from auth.sessions s where private.session_is_active() and s.id::text=auth.jwt()->>'session_id' and s.user_id=auth.uid()
$$;

create function private.security_snapshot() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare sessions jsonb; events jsonb;
begin
 if not private.is_verified() or not private.mfa_access_allowed() then raise exception 'SECURITY_DENIED'; end if;
 -- Start from auth.sessions, never from the metadata registry. UTC refreshed_at is
 -- a provider refresh timestamp, NOT a user's interaction/last-activity timestamp.
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',s.id,'current',s.id::text=auth.jwt()->>'session_id','createdAt',s.created_at,
 'lastRefreshAt',s.refreshed_at at time zone 'UTC',
 'state',case when d.session_id is not null then 'blocked' when s.not_after<=now() then 'expired' else 'active' end,
 'metadata',case when m.observed_at>now()-interval '30 days' then m.metadata else '{}'::jsonb end,
 'provider',m.provider) order by s.created_at desc),'[]') into sessions
 from auth.sessions s left join private.security_sessions m on m.session_id=s.id
 left join private.security_denied_sessions d on d.session_id=s.id
 where s.user_id=auth.uid();
 select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]') into events from
 (select id,kind,created_at,details-'metadata' as details from private.security_events where user_id=auth.uid() and created_at>now()-interval '90 days' order by created_at desc,id desc limit 50) e;
 return jsonb_build_object('sessions',sessions,'events',events);
end $$;
create function public.security_snapshot() returns jsonb language sql security invoker set search_path='' as $$ select private.security_snapshot() $$;
revoke all on function private.security_snapshot(),public.security_snapshot() from public,anon;
grant execute on function private.security_snapshot(),public.security_snapshot() to authenticated;

-- Reuse the existing leased, idempotent transactional outbox and scheduled worker.
alter table private.support_outbox alter column ticket_id drop not null;
alter table private.support_outbox drop constraint support_outbox_audience_check;
alter table private.support_outbox add constraint support_outbox_audience_check check(audience in ('user','staff','security'));
alter table private.support_outbox add column security_event_id uuid unique references private.security_events(id) on delete cascade;
alter table private.support_outbox add column security_payload jsonb;
alter table private.support_outbox add constraint outbox_source_check check(
 (audience='security' and security_event_id is not null and ticket_id is null and recipient_id is not null)
 or (audience in ('user','staff') and ticket_id is not null and security_event_id is null));

create function private.security_observe_session(p_user uuid,p_session uuid,p_metadata jsonb,p_provider text,p_aal text) returns boolean
language plpgsql security definer set search_path='' as $$
declare s auth.sessions; m private.security_sessions; eid uuid;
begin
 select * into s from auth.sessions where id=p_session and user_id=p_user and (not_after is null or not_after>now());
 if not found or exists(select 1 from private.security_denied_sessions where session_id=p_session)
 or not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then return false; end if;
 if p_metadata is null or jsonb_typeof(p_metadata)<>'object' or octet_length(p_metadata::text)>4096 then raise exception 'SECURITY_INVALID'; end if;
 insert into private.security_sessions(session_id,user_id,created_at,metadata,provider)
 values(s.id,s.user_id,s.created_at,p_metadata,case when p_provider in ('password','google','oauth','recovery') then p_provider else null end)
 on conflict(session_id) do nothing;
 select * into m from private.security_sessions where session_id=s.id for update;
 -- AAL is from a server-verified JWT; managed factor existence is also checked here.
 if exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified') and p_aal is distinct from 'aal2' then return false; end if;
 if m.baseline or m.completed_at is not null then return false; end if;
 update private.security_sessions set completed_at=now() where session_id=s.id;
 insert into private.security_events(user_id,session_id,kind,event_key,details)
 values(p_user,s.id,'login','login:'||s.id,jsonb_build_object('metadata',m.metadata,'provider',m.provider,'loginAt',s.created_at))
 on conflict(user_id,event_key) do nothing returning id into eid;
 if eid is not null then
  insert into private.support_outbox(recipient_id,audience,event,security_event_id,security_payload)
  select p_user,'security','login',eid,jsonb_build_object('to',u.email,'language',coalesce(pr.language,'en'),'details',e.details)
  from auth.users u left join public.profiles pr on pr.id=u.id join private.security_events e on e.id=eid where u.id=p_user;
 end if;
 return eid is not null;
end $$;

create function private.security_record_event(p_user uuid,p_session uuid,p_kind text,p_key text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_kind not in ('logout','mfa_enrolled','mfa_removed','password_changed','username_changed') or length(p_key)>160 then raise exception 'SECURITY_INVALID'; end if;
 -- Caller is the server. Logout/password changes may already have removed the session.
 if not exists(select 1 from auth.users where id=p_user) then return; end if;
 insert into private.security_events(user_id,session_id,kind,event_key) values(p_user,p_session,p_kind,p_kind||':'||p_key) on conflict(user_id,event_key) do nothing;
end $$;

create function private.security_begin_revocation(p_user uuid,p_session uuid,p_factor uuid,p_scope text,p_proof_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare op uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
 if p_scope is null or p_scope not in ('others','global') or p_proof_hash is null or p_proof_hash !~ '^[a-f0-9]{64}$' then raise exception 'SECURITY_INVALID'; end if;
 if not exists(select 1 from auth.sessions where id=p_session and user_id=p_user and (not_after is null or not_after>now()))
 or exists(select 1 from private.security_denied_sessions where session_id=p_session)
 or not exists(select 1 from auth.mfa_factors where id=p_factor and user_id=p_user and status='verified') then raise exception 'SECURITY_DENIED'; end if;
 delete from private.security_revocations where user_id=p_user and created_at<now()-interval '10 minutes';
 if (select count(*) from private.security_revocations where user_id=p_user)>=5 then raise exception 'SECURITY_RATE'; end if;
 if exists(select 1 from private.security_revocations where user_id=p_user and state in ('verifying','executing') and expires_at>now()) then raise exception 'SECURITY_BUSY'; end if;
 if exists(select 1 from private.security_revocations where user_id=p_user and proof_hash=p_proof_hash) then raise exception 'SECURITY_REPLAY'; end if;
 insert into private.security_revocations(user_id,session_id,factor_id,scope,proof_hash) values(p_user,p_session,p_factor,p_scope,p_proof_hash) returning id into op;
 return op;
end $$;

-- The server calls this ONLY after native challenge + verify succeeds. No browser
-- endpoint accepts proof timestamps, operation IDs, or reusable elevated flags.
create function private.security_consume_revocation(p_id uuid,p_user uuid,p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare op private.security_revocations; target_ids uuid[];
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
 select * into op from private.security_revocations where id=p_id and user_id=p_user and session_id=p_session for update;
 if not found or op.state<>'verifying' or op.consumed_at is not null or op.expires_at<=now() then raise exception 'SECURITY_REPLAY'; end if;
 if not exists(select 1 from auth.sessions where id=p_session and user_id=p_user and (not_after is null or not_after>now()))
 or exists(select 1 from private.security_denied_sessions where session_id=p_session)
 or not exists(select 1 from auth.mfa_factors where id=op.factor_id and user_id=p_user and status='verified') then raise exception 'SECURITY_DENIED'; end if;
 select coalesce(array_agg(id),'{}') into target_ids from auth.sessions where user_id=p_user and (op.scope='global' or id<>p_session);
 update private.security_revocations set consumed_at=now(),state='executing',targets=target_ids where id=op.id;
 insert into private.security_denied_sessions(session_id,user_id) select unnest(target_ids),p_user on conflict do nothing;
 insert into private.security_events(user_id,session_id,kind,event_key,details)
 values(p_user,p_session,'revocation_requested','revoke-request:'||op.id,jsonb_build_object('scope',op.scope,'count',cardinality(target_ids)));
 return jsonb_build_object('scope',op.scope,'count',cardinality(target_ids));
end $$;
create function private.security_finish_revocation(p_id uuid,p_user uuid,p_success boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare op private.security_revocations; done boolean;
begin
 select * into op from private.security_revocations where id=p_id and user_id=p_user for update;
 if not found then return false; end if;
 if op.state<>'executing' then
  if op.state='verifying' then update private.security_revocations set state='failed' where id=op.id; end if;
  return op.state='completed';
 end if;
 done:=p_success and not exists(select 1 from auth.sessions where id=any(op.targets) and user_id=p_user);
 update private.security_revocations set state=case when done then 'completed' else 'pending' end where id=op.id;
 insert into private.security_events(user_id,session_id,kind,event_key,details)
 values(p_user,op.session_id,case when done then 'sessions_revoked' else 'revocation_pending' end,'revoke-result:'||op.id,jsonb_build_object('scope',op.scope,'count',cardinality(op.targets))) on conflict(user_id,event_key) do nothing;
 return done;
end $$;

-- Shared outbox leasing/ack semantics and 23h retry horizon remain unchanged.
create function private.transactional_email_jobs(p_support boolean,p_security boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare jobs jsonb;
begin
 with claimed as (
 update private.support_outbox set lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
 where id in(select id from private.support_outbox where ((p_support and audience in ('user','staff')) or (p_security and audience='security' and created_at>now()-interval '23 hours')) and sent_at is null and (lease_until is null or lease_until<now())
 and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') order by created_at for update skip locked limit 20)
 returning *)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease',c.lease_id,'ticketId',t.id,'number',t.ticket_number,'event',c.event,'audience',c.audience,'to',case when c.audience='security' then c.security_payload->>'to' else u.email end,
 'language',case when c.audience='security' then c.security_payload->>'language' when c.audience='staff' then 'fa' else coalesce(t.notification_language,'en') end,'securityDetails',c.security_payload->'details')),'[]') into jobs
 from claimed c left join public.support_tickets t on t.id=c.ticket_id left join auth.users u on u.id=c.recipient_id
 left join public.profiles pr on pr.id=c.recipient_id left join private.security_events e on e.id=c.security_event_id;
 return jobs;
end $$;
create or replace function private.support_email_jobs() returns jsonb language sql security definer set search_path='' as $$ select private.transactional_email_jobs(true,false) $$;
create function public.transactional_email_jobs(p_support boolean,p_security boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.transactional_email_jobs(p_support,p_security) $$;
revoke all on function private.transactional_email_jobs(boolean,boolean),public.transactional_email_jobs(boolean,boolean) from public,anon,authenticated;
grant execute on function private.transactional_email_jobs(boolean,boolean),public.transactional_email_jobs(boolean,boolean) to service_role;
create function private.security_prune() returns void language plpgsql security definer set search_path='' as $$
begin
 update private.support_outbox set security_payload=null where audience='security' and created_at<now()-interval '30 days' and security_payload is not null;
 update private.security_sessions set metadata='{}' where observed_at<now()-interval '30 days' and metadata<>'{}';
 update private.security_events set details=details-'metadata' where created_at<now()-interval '30 days' and details ? 'metadata';
 delete from private.security_events where created_at<now()-interval '90 days';
 delete from private.security_sessions m where not exists(select 1 from auth.sessions s where s.id=m.session_id) and m.observed_at<now()-interval '90 days';
 delete from private.security_revocations where created_at<now()-interval '1 day';
 -- No issued JWT remains usable after its auth.sessions row is gone, so removing
 -- these tombstones cannot restore access through our session-aware guard.
 delete from private.security_denied_sessions d where not exists(select 1 from auth.sessions s where s.id=d.session_id);
end $$;

create function public.security_observe_session(p_user uuid,p_session uuid,p_metadata jsonb,p_provider text,p_aal text) returns boolean language sql security invoker set search_path='' as $$ select private.security_observe_session(p_user,p_session,p_metadata,p_provider,p_aal) $$;
revoke all on function private.security_observe_session(uuid,uuid,jsonb,text,text),public.security_observe_session(uuid,uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function private.security_observe_session(uuid,uuid,jsonb,text,text),public.security_observe_session(uuid,uuid,jsonb,text,text) to service_role;

create function public.security_record_event(p_user uuid,p_session uuid,p_kind text,p_key text) returns void language sql security invoker set search_path='' as $$ select private.security_record_event(p_user,p_session,p_kind,p_key) $$;
revoke all on function private.security_record_event(uuid,uuid,text,text),public.security_record_event(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.security_record_event(uuid,uuid,text,text),public.security_record_event(uuid,uuid,text,text) to service_role;

create function public.security_begin_revocation(p_user uuid,p_session uuid,p_factor uuid,p_scope text,p_proof_hash text) returns uuid language sql security invoker set search_path='' as $$ select private.security_begin_revocation(p_user,p_session,p_factor,p_scope,p_proof_hash) $$;
revoke all on function private.security_begin_revocation(uuid,uuid,uuid,text,text),public.security_begin_revocation(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.security_begin_revocation(uuid,uuid,uuid,text,text),public.security_begin_revocation(uuid,uuid,uuid,text,text) to service_role;

create function public.security_consume_revocation(p_id uuid,p_user uuid,p_session uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.security_consume_revocation(p_id,p_user,p_session) $$;
revoke all on function private.security_consume_revocation(uuid,uuid,uuid),public.security_consume_revocation(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function private.security_consume_revocation(uuid,uuid,uuid),public.security_consume_revocation(uuid,uuid,uuid) to service_role;

create function public.security_finish_revocation(p_id uuid,p_user uuid,p_success boolean) returns boolean language sql security invoker set search_path='' as $$ select private.security_finish_revocation(p_id,p_user,p_success) $$;
revoke all on function private.security_finish_revocation(uuid,uuid,boolean),public.security_finish_revocation(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function private.security_finish_revocation(uuid,uuid,boolean),public.security_finish_revocation(uuid,uuid,boolean) to service_role;

create function public.security_prune() returns void language sql security invoker set search_path='' as $$ select private.security_prune() $$;
revoke all on function private.security_prune(),public.security_prune() from public,anon,authenticated;
grant execute on function private.security_prune(),public.security_prune() to service_role;
