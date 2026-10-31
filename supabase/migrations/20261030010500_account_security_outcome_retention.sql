-- Follow-up to PR #52 independent audit: preserve unresolved credential outcomes.
-- Only application-owned private functions are modified. No production execution.
begin;

-- A confirmed native logout does not prove an ambiguous password mutation
-- succeeded or failed. Do not prune the only durable operation record while
-- the provider outcome remains unknown.
create or replace function private.security_prune() returns void
language plpgsql security definer set search_path='' as $$
begin
 update private.support_outbox set security_payload=null where audience='security'
   and created_at<now()-interval '30 days' and security_payload is not null;
 update private.security_sessions set metadata='{}'
   where observed_at<now()-interval '30 days' and metadata<>'{}';
 update private.security_events set details=details-'metadata'
   where created_at<now()-interval '30 days' and details ? 'metadata';
 delete from private.security_events where created_at<now()-interval '90 days';
 delete from private.security_sessions m
   where not exists(select 1 from auth.sessions s where s.id=m.session_id)
   and m.observed_at<now()-interval '90 days';
 delete from private.security_revocations
   where state in ('failed','completed') and created_at<now()-interval '1 day'
     and password_result is distinct from 'pending';
 delete from private.security_action_grants
   where created_at<now()-interval '1 day';
 delete from private.security_recovery_tickets
   where expires_at<now()-interval '1 day';
 update private.support_outbox set delivery_payload=null
   where created_at<now()-interval '30 days' and delivery_payload is not null;
 -- Only prune denied tokens after the associated native session has gone.
 delete from private.security_denied_sessions d
   where not exists(select 1 from auth.sessions s where s.id=d.session_id);
end $$;

-- Preserve the existing native-session reconciliation behavior and report
-- unresolved provider password outcomes separately for operator alerting.
create or replace function private.security_reconcile_revocations() returns jsonb
language plpgsql security definer set search_path='' as $$
declare op record; pending integer; stale integer;
  password_pending integer; password_stale integer;
begin
 for op in select id,user_id from private.security_revocations
   where state in ('pending','executing') and consumed_at is not null
   order by checked_at nulls first,created_at
   for update skip locked limit 100
 loop
  perform private.security_finish_revocation(op.id,op.user_id,false);
 end loop;
 select count(*),count(*) filter(where created_at<now()-interval '10 minutes')
   into pending,stale
   from private.security_revocations where state in ('pending','executing');
 select count(*),count(*) filter(where created_at<now()-interval '10 minutes')
   into password_pending,password_stale
   from private.security_revocations where password_result='pending';
 return jsonb_build_object('pending',pending,'stale',stale,
   'passwordOutcomesPending',password_pending,
   'passwordOutcomesStale',password_stale);
end $$;

commit;
