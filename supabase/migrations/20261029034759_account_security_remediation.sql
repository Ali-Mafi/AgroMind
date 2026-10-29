begin;
-- Forward-only remediation. Provider-owned Auth tables are READ ONLY.
-- Service-only reservations attest provider verification; browser RPCs cannot mint proof.
create table private.security_recovery_tickets (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null, created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '10 minutes', consumed_at timestamptz,
 unique(user_id,session_id)
);
create table private.security_action_grants (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null, operation text not null check(operation in ('username','password_change','password_recovery')),
 payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),
 proof_kind text not null check(proof_kind in ('totp','password','recovery_code','recovery_link')),
 factor_id uuid, proof_hash text not null check(proof_hash ~ '^[a-f0-9]{64}$'), recovery_hash text,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '2 minutes',
 state text not null default 'verifying' check(state in ('verifying','verified','consumed','failed')),
 consumed_at timestamptz
);
create index security_action_grants_owner on private.security_action_grants(user_id,created_at);
alter table private.security_recovery_tickets enable row level security;
alter table private.security_action_grants enable row level security;
revoke all on private.security_recovery_tickets,private.security_action_grants from public,anon,authenticated;

create function private.security_owned_session(p_user uuid,p_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
 where s.id=p_session and s.user_id=p_user and u.email_confirmed_at is not null and (s.not_after is null or s.not_after>now()))
 and not exists(select 1 from private.security_denied_sessions where session_id=p_session)
$$;
revoke all on function private.security_owned_session(uuid,uuid) from public,anon,authenticated;

create function private.security_issue_recovery(p_user uuid,p_session uuid,p_hash text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.security_owned_session(p_user,p_session) or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'SECURITY_DENIED'; end if;
 -- Never renew/reissue a ticket for the same native session, including consumed ones.
 insert into private.security_recovery_tickets(token_hash,user_id,session_id) values(p_hash,p_user,p_session);
end $$;
create function private.security_has_recovery(p_user uuid,p_session uuid,p_hash text) returns boolean
language sql stable security definer set search_path='' as $$
 select private.security_owned_session(p_user,p_session) and exists(select 1 from private.security_recovery_tickets
 where token_hash=p_hash and user_id=p_user and session_id=p_session and consumed_at is null and expires_at>now())
$$;

create function private.security_begin_action(p_user uuid,p_session uuid,p_operation text,p_payload_hash text,p_kind text,p_factor uuid,p_proof_hash text,p_recovery_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare gid uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
 if not private.security_owned_session(p_user,p_session) then raise exception 'SECURITY_DENIED'; end if;
 if p_operation is null or p_operation not in ('username','password_change','password_recovery')
 or p_kind is null or p_kind not in ('totp','password','recovery_code','recovery_link')
 or p_payload_hash is null or p_payload_hash !~ '^[a-f0-9]{64}$'
 or p_proof_hash is null or p_proof_hash !~ '^[a-f0-9]{64}$' then raise exception 'SECURITY_INVALID'; end if;
 if p_operation='username' and p_kind<>'totp' then raise exception 'SECURITY_DENIED'; end if;
 if p_kind in ('recovery_code','recovery_link') and p_operation<>'password_recovery' then raise exception 'SECURITY_DENIED'; end if;
 if p_operation='password_recovery' and not private.security_has_recovery(p_user,p_session,p_recovery_hash) then raise exception 'SECURITY_RECOVERY_REQUIRED'; end if;
 if p_kind='totp' then
  if not exists(select 1 from auth.mfa_factors where id=p_factor and user_id=p_user and factor_type='totp' and status='verified') then raise exception 'SECURITY_DENIED'; end if;
 elsif p_kind in ('password','recovery_link') and exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified') then raise exception 'SECURITY_DENIED';
 end if;
 if (select count(*) from private.security_action_grants where user_id=p_user and created_at>now()-interval '10 minutes')
  +(select count(*) from private.security_revocations where user_id=p_user and created_at>now()-interval '10 minutes')>=5 then raise exception 'SECURITY_RATE'; end if;
 if exists(select 1 from private.security_action_grants where user_id=p_user and state in ('verifying','verified') and expires_at>now())
 or exists(select 1 from private.security_revocations where user_id=p_user and state in ('verifying','executing') and expires_at>now()) then raise exception 'SECURITY_BUSY'; end if;
 if exists(select 1 from private.security_action_grants where user_id=p_user and proof_hash=p_proof_hash and created_at>now()-interval '10 minutes')
 or exists(select 1 from private.security_revocations where user_id=p_user and proof_hash=p_proof_hash and created_at>now()-interval '10 minutes') then raise exception 'SECURITY_REPLAY'; end if;
 insert into private.security_action_grants(user_id,session_id,operation,payload_hash,proof_kind,factor_id,proof_hash,recovery_hash)
 values(p_user,p_session,p_operation,p_payload_hash,p_kind,p_factor,p_proof_hash,p_recovery_hash) returning id into gid;
 return gid;
end $$;
create function private.security_authorize_action(p_id uuid,p_user uuid,p_session uuid,p_verified boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 update private.security_action_grants set state=case when p_verified then 'verified' else 'failed' end
 where id=p_id and user_id=p_user and session_id=p_session and state='verifying' and expires_at>now()
 and private.security_owned_session(p_user,p_session);
 if not found then raise exception 'SECURITY_REPLAY'; end if;
end $$;
create function private.security_consume_action(p_id uuid,p_user uuid,p_session uuid,p_operation text,p_payload_hash text) returns void
language plpgsql security definer set search_path='' as $$
declare g private.security_action_grants;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
 select * into g from private.security_action_grants where id=p_id and user_id=p_user and session_id=p_session for update;
 if not found or g.state<>'verified' or g.expires_at<=now() or g.operation is distinct from p_operation or g.payload_hash is distinct from p_payload_hash then raise exception 'SECURITY_REPLAY'; end if;
 if not private.security_owned_session(p_user,p_session) then raise exception 'SECURITY_DENIED'; end if;
 if g.proof_kind='totp' and not exists(select 1 from auth.mfa_factors where id=g.factor_id and user_id=p_user and factor_type='totp' and status='verified') then raise exception 'SECURITY_DENIED'; end if;
 if g.proof_kind in ('password','recovery_link') and exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified') then raise exception 'SECURITY_DENIED'; end if;
 if g.operation='password_recovery' then
  update private.security_recovery_tickets set consumed_at=now() where token_hash=g.recovery_hash and user_id=p_user and session_id=p_session and consumed_at is null and expires_at>now();
  if not found then raise exception 'SECURITY_RECOVERY_REQUIRED'; end if;
 end if;
 update private.security_action_grants set state='consumed',consumed_at=now() where id=g.id;
end $$;

-- Remove the historical unguarded signature. Retain a rejecting stub for old clients.
create or replace function public.change_username(p_username text) returns text
language plpgsql security invoker set search_path='' as $$
begin raise exception 'SECURITY_FRESH_REQUIRED'; end $$;
revoke all on function public.change_username(text) from public,anon,authenticated;
create function private.security_change_username(p_username text,p_grant uuid,p_payload_hash text) returns text
language plpgsql security definer set search_path='' as $$
declare normalized text:=lower(btrim(coalesce(p_username,''))); subject uuid:=auth.uid(); sid uuid;
begin
 if not private.is_verified() or not private.mfa_access_allowed() then raise exception 'AUTH_REQUIRED'; end if;
 sid:=(auth.jwt()->>'session_id')::uuid;
 if normalized !~ '^[a-z0-9_]{6,30}$' then raise exception 'INVALID_USERNAME'; end if;
 -- Bind the actual username as well as the operation; SHA256 here is NOT a password hash.
 if p_payload_hash is distinct from encode(sha256(convert_to(normalized,'UTF8')),'hex') then raise exception 'SECURITY_INVALID'; end if;
 perform private.security_consume_action(p_grant,subject,sid,'username',p_payload_hash);
 begin
  update public.profiles set username=normalized where id=subject;
 exception when unique_violation then raise exception using errcode='23505',message='USERNAME_TAKEN'; end;
 if not found then raise exception 'AUTH_REQUIRED'; end if;
 insert into private.security_events(user_id,session_id,kind,event_key)
 values(subject,sid,'username_changed','username-grant:'||p_grant);
 -- Consumption, mutation and audit INSERT share one transaction; any failure rolls ALL back.
 return normalized;
end $$;
create function public.security_change_username(p_username text,p_grant uuid,p_payload_hash text) returns text
language sql security invoker set search_path='' as $$ select private.security_change_username(p_username,p_grant,p_payload_hash) $$;
revoke all on function private.security_change_username(text,uuid,text),public.security_change_username(text,uuid,text) from public,anon;
grant execute on function private.security_change_username(text,uuid,text),public.security_change_username(text,uuid,text) to authenticated;

create function public.security_issue_recovery(p_user uuid,p_session uuid,p_hash text) returns void language sql security invoker set search_path='' as $$ select private.security_issue_recovery(p_user,p_session,p_hash) $$;
revoke all on function private.security_issue_recovery(uuid,uuid,text),public.security_issue_recovery(uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.security_issue_recovery(uuid,uuid,text),public.security_issue_recovery(uuid,uuid,text) to service_role;

create function public.security_has_recovery(p_user uuid,p_session uuid,p_hash text) returns boolean language sql security invoker set search_path='' as $$ select private.security_has_recovery(p_user,p_session,p_hash) $$;
revoke all on function private.security_has_recovery(uuid,uuid,text),public.security_has_recovery(uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.security_has_recovery(uuid,uuid,text),public.security_has_recovery(uuid,uuid,text) to service_role;

create function public.security_begin_action(p_user uuid,p_session uuid,p_operation text,p_payload_hash text,p_kind text,p_factor uuid,p_proof_hash text,p_recovery_hash text) returns uuid language sql security invoker set search_path='' as $$ select private.security_begin_action(p_user,p_session,p_operation,p_payload_hash,p_kind,p_factor,p_proof_hash,p_recovery_hash) $$;
revoke all on function private.security_begin_action(uuid,uuid,text,text,text,uuid,text,text),public.security_begin_action(uuid,uuid,text,text,text,uuid,text,text) from public,anon,authenticated;
grant execute on function private.security_begin_action(uuid,uuid,text,text,text,uuid,text,text),public.security_begin_action(uuid,uuid,text,text,text,uuid,text,text) to service_role;

create function public.security_authorize_action(p_id uuid,p_user uuid,p_session uuid,p_verified boolean) returns void language sql security invoker set search_path='' as $$ select private.security_authorize_action(p_id,p_user,p_session,p_verified) $$;
revoke all on function private.security_authorize_action(uuid,uuid,uuid,boolean),public.security_authorize_action(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function private.security_authorize_action(uuid,uuid,uuid,boolean),public.security_authorize_action(uuid,uuid,uuid,boolean) to service_role;

create function public.security_consume_action(p_id uuid,p_user uuid,p_session uuid,p_operation text,p_payload_hash text) returns void language sql security invoker set search_path='' as $$ select private.security_consume_action(p_id,p_user,p_session,p_operation,p_payload_hash) $$;
revoke all on function private.security_consume_action(uuid,uuid,uuid,text,text),public.security_consume_action(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function private.security_consume_action(uuid,uuid,uuid,text,text),public.security_consume_action(uuid,uuid,uuid,text,text) to service_role;

-- Pending operations survive new attempts and retention. Fresh proof is required for every new provider call.
create or replace function private.security_begin_revocation(p_user uuid,p_session uuid,p_factor uuid,p_scope text,p_proof_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare op uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
 if p_scope is null or p_scope not in ('others','global') or p_proof_hash is null or p_proof_hash !~ '^[a-f0-9]{64}$' then raise exception 'SECURITY_INVALID'; end if;
 if not exists(select 1 from auth.sessions where id=p_session and user_id=p_user and (not_after is null or not_after>now()))
 or exists(select 1 from private.security_denied_sessions where session_id=p_session)
 or not exists(select 1 from auth.mfa_factors where id=p_factor and user_id=p_user and status='verified' and factor_type='totp') then raise exception 'SECURITY_DENIED'; end if;
 delete from private.security_revocations where user_id=p_user and state in ('failed','completed') and created_at<now()-interval '10 minutes';
 if (select count(*) from private.security_revocations where user_id=p_user and created_at>now()-interval '10 minutes')+(select count(*) from private.security_action_grants where user_id=p_user and created_at>now()-interval '10 minutes')>=5 then raise exception 'SECURITY_RATE'; end if;
 if exists(select 1 from private.security_action_grants where user_id=p_user and state in ('verifying','verified') and expires_at>now()) or exists(select 1 from private.security_revocations where user_id=p_user and state in ('verifying','executing') and expires_at>now()) then raise exception 'SECURITY_BUSY'; end if;
 if exists(select 1 from private.security_action_grants where user_id=p_user and proof_hash=p_proof_hash and created_at>now()-interval '10 minutes') or exists(select 1 from private.security_revocations where user_id=p_user and proof_hash=p_proof_hash) then raise exception 'SECURITY_REPLAY'; end if;
 insert into private.security_revocations(user_id,session_id,factor_id,scope,proof_hash) values(p_user,p_session,p_factor,p_scope,p_proof_hash) returning id into op;
 return op;
end $$;


alter table private.security_revocations alter column factor_id drop not null;
alter table private.security_revocations add column checked_at timestamptz;
create index security_revocations_reconciliation on private.security_revocations(checked_at nulls first,created_at) where state in ('pending','executing');
-- Called ONLY after a consumed password grant AND successful provider password update.
create function private.security_password_changed(p_id uuid,p_user uuid,p_session uuid) returns void
language plpgsql security definer set search_path='' as $$
declare g private.security_action_grants; target_ids uuid[];
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,9064));
 select * into g from private.security_action_grants where id=p_id and user_id=p_user and session_id=p_session for update;
 if not found or g.state<>'consumed' or g.operation not in ('password_change','password_recovery') or g.consumed_at<now()-interval '2 minutes' then raise exception 'SECURITY_DENIED'; end if;
 if exists(select 1 from private.security_revocations where id=p_id) then return; end if;
 select coalesce(array_agg(id),'{}') into target_ids from auth.sessions where user_id=p_user;
 insert into private.security_revocations(id,user_id,session_id,factor_id,scope,proof_hash,state,consumed_at,targets)
 values(p_id,p_user,p_session,g.factor_id,'global',g.proof_hash,'executing',now(),target_ids);
 insert into private.security_denied_sessions(session_id,user_id) select unnest(target_ids),p_user on conflict do nothing;
 insert into private.security_events(user_id,session_id,kind,event_key) values(p_user,p_session,'password_changed','password-grant:'||p_id);
 insert into private.security_events(user_id,session_id,kind,event_key,details)
 values(p_user,p_session,'revocation_requested','revoke-request:'||p_id,jsonb_build_object('scope','global','count',cardinality(target_ids),'authorization',g.operation));
end $$;
create function public.security_password_changed(p_id uuid,p_user uuid,p_session uuid) returns void language sql security invoker set search_path='' as $$ select private.security_password_changed(p_id,p_user,p_session) $$;
revoke all on function private.security_password_changed(uuid,uuid,uuid),public.security_password_changed(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function private.security_password_changed(uuid,uuid,uuid),public.security_password_changed(uuid,uuid,uuid) to service_role;

create or replace function private.security_finish_revocation(p_id uuid,p_user uuid,p_success boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare op private.security_revocations; done boolean;
begin
 select * into op from private.security_revocations where id=p_id and user_id=p_user for update;
 if not found then return false; end if;
 if op.state='completed' then return true; end if;
 if op.state='verifying' then update private.security_revocations set state='failed' where id=op.id; return false; end if;
 if op.state not in ('executing','pending') or op.consumed_at is null then return false; end if;
 -- Provider responses may be lost. Native row disappearance is authoritative;
 -- p_success is retained for API compatibility, but cannot declare success by itself.
 done:=not exists(select 1 from auth.sessions where id=any(op.targets) and user_id=p_user);
 update private.security_revocations set checked_at=now(),state=case when done then 'completed' else 'pending' end where id=op.id;
 insert into private.security_events(user_id,session_id,kind,event_key,details)
 values(p_user,op.session_id,case when done then 'sessions_revoked' else 'revocation_pending' end,
 (case when done then 'revoke-complete:' else 'revoke-pending:' end)||op.id,
 jsonb_build_object('scope',op.scope,'count',cardinality(op.targets))) on conflict(user_id,event_key) do nothing;
 return done;
end $$;
-- No bearer tokens are stored and this worker cannot revoke anything. It only
-- reconciles native disappearance and reports counts for operational alerts.
create function private.security_reconcile_revocations() returns jsonb
language plpgsql security definer set search_path='' as $$
declare op record; pending integer; stale integer;
begin
 for op in select id,user_id from private.security_revocations where state in ('pending','executing') and consumed_at is not null order by checked_at nulls first,created_at for update skip locked limit 100 loop
  perform private.security_finish_revocation(op.id,op.user_id,false);
 end loop;
 select count(*),count(*) filter(where created_at<now()-interval '10 minutes') into pending,stale
 from private.security_revocations where state in ('pending','executing');
 return jsonb_build_object('pending',pending,'stale',stale);
end $$;
create function public.security_reconcile_revocations() returns jsonb language sql security invoker set search_path='' as $$ select private.security_reconcile_revocations() $$;
revoke all on function private.security_reconcile_revocations(),public.security_reconcile_revocations() from public,anon,authenticated;
grant execute on function private.security_reconcile_revocations(),public.security_reconcile_revocations() to service_role;

-- Complete provider payload is frozen BEFORE any send, not rerendered on retry.
alter table private.support_outbox add column delivery_payload jsonb;
alter table private.support_outbox add column delivery_hold boolean not null default false;
-- Legacy attempts may have been accepted by Resend. Do not resend an unknown body
-- under the old key or mint a new key. Operator reconciliation is required.
update private.support_outbox set delivery_hold=true,last_error='LEGACY_PAYLOAD_UNKNOWN'
 where sent_at is null and attempts>0;
create function private.transactional_email_jobs_v2(p_support boolean,p_security boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare jobs jsonb;
begin
 with claimed as (
 update private.support_outbox set lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
 where id in(select id from private.support_outbox where not delivery_hold and ((p_support and audience in ('user','staff')) or (p_security and audience='security' and created_at>now()-interval '23 hours')) and sent_at is null and (lease_until is null or lease_until<now())
 and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') order by created_at for update skip locked limit 20)
 returning *)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease',c.lease_id,'ticketId',t.id,'number',t.ticket_number,'event',c.event,'audience',c.audience,
 'to',case when c.audience='security' then c.security_payload->>'to' else u.email end,
 'language',case when c.audience='security' then c.security_payload->>'language' when c.audience='staff' then 'fa' else coalesce(t.notification_language,'en') end,
 'securityDetails',c.security_payload->'details','deliveryPayload',c.delivery_payload)),'[]') into jobs
 from claimed c left join public.support_tickets t on t.id=c.ticket_id left join auth.users u on u.id=c.recipient_id;
 return jobs;
end $$;
create function public.transactional_email_jobs_v2(p_support boolean,p_security boolean) returns jsonb language sql security invoker set search_path='' as $$ select private.transactional_email_jobs_v2(p_support,p_security) $$;
revoke all on function private.transactional_email_jobs_v2(boolean,boolean),public.transactional_email_jobs_v2(boolean,boolean) from public,anon,authenticated;
grant execute on function private.transactional_email_jobs_v2(boolean,boolean),public.transactional_email_jobs_v2(boolean,boolean) to service_role;
-- Old workers must not newly lease messages they could send without freezing.
create or replace function private.transactional_email_jobs(p_support boolean,p_security boolean) returns jsonb language sql security definer set search_path='' as $$ select '[]'::jsonb $$;
create function private.security_freeze_email(p_id uuid,p_lease uuid,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job private.support_outbox;
begin
 select * into job from private.support_outbox where id=p_id for update;
 if not found or job.lease_id is distinct from p_lease or job.lease_until<=now() or job.sent_at is not null or job.delivery_hold then raise exception 'EMAIL_LEASE_LOST'; end if;
 if job.delivery_payload is not null then return job.delivery_payload; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>262144
 or not (p_payload ?& array['to','from','subject','html','text','version','language'])
 or jsonb_typeof(p_payload->'to')<>'string' or jsonb_typeof(p_payload->'from')<>'string'
 or jsonb_typeof(p_payload->'subject')<>'string' or jsonb_typeof(p_payload->'html')<>'string'
 or jsonb_typeof(p_payload->'text')<>'string' or p_payload->>'version'<>'signature-premium-v1'
 then raise exception 'EMAIL_PAYLOAD_INVALID'; end if;
 update private.support_outbox set delivery_payload=p_payload where id=p_id;
 return p_payload;
end $$;
create function public.security_freeze_email(p_id uuid,p_lease uuid,p_payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.security_freeze_email(p_id,p_lease,p_payload) $$;
revoke all on function private.security_freeze_email(uuid,uuid,jsonb),public.security_freeze_email(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function private.security_freeze_email(uuid,uuid,jsonb),public.security_freeze_email(uuid,uuid,jsonb) to service_role;
create function private.security_email_health() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('held',count(*) filter(where delivery_hold),'overdue',count(*) filter(where created_at<now()-interval '30 minutes'))
 from private.support_outbox where sent_at is null
$$;
create function public.security_email_health() returns jsonb language sql security invoker set search_path='' as $$ select private.security_email_health() $$;
revoke all on function private.security_email_health(),public.security_email_health() from public,anon,authenticated;
grant execute on function private.security_email_health(),public.security_email_health() to service_role;

create or replace function private.security_prune() returns void language plpgsql security definer set search_path='' as $$
begin
 update private.support_outbox set security_payload=null where audience='security' and created_at<now()-interval '30 days' and security_payload is not null;
 update private.security_sessions set metadata='{}' where observed_at<now()-interval '30 days' and metadata<>'{}';
 update private.security_events set details=details-'metadata' where created_at<now()-interval '30 days' and details ? 'metadata';
 delete from private.security_events where created_at<now()-interval '90 days';
 delete from private.security_sessions m where not exists(select 1 from auth.sessions s where s.id=m.session_id) and m.observed_at<now()-interval '90 days';
 delete from private.security_revocations where state in ('failed','completed') and created_at<now()-interval '1 day';
 delete from private.security_action_grants where created_at<now()-interval '1 day';
 delete from private.security_recovery_tickets where expires_at<now()-interval '1 day';
 update private.support_outbox set delivery_payload=null where created_at<now()-interval '30 days' and delivery_payload is not null;
 -- No issued JWT remains usable after its auth.sessions row is gone, so removing
 -- these tombstones cannot restore access through our session-aware guard.
 delete from private.security_denied_sessions d where not exists(select 1 from auth.sessions s where s.id=d.session_id);
end $$;


commit;
