-- MANUAL DOWN MIGRATION. Roll back app first; export security audit data first.
-- Deletes this feature's metadata/history and security-email jobs. Do not execute
-- while an application-blocked session still exists at the Auth provider.
begin;
-- Hardening is forward-only. Never restore the vulnerable mutation signatures or
-- discard grants, audit history and pending denial state as a routine rollback.
do $$ begin
 if to_regclass('private.security_action_grants') is not null then
  raise exception 'ROLLBACK_BLOCKED_REMEDIATION: retain schema and deploy a compatible forward fix';
 end if;
end $$;

do $$ begin
 if exists(select 1 from private.security_denied_sessions d join auth.sessions s on s.id=d.session_id) then
  raise exception 'ROLLBACK_BLOCKED: pending provider sessions must be revoked through supported Auth APIs first';
 end if;
end $$;
create or replace function private.support_email_jobs() returns jsonb language plpgsql security definer set search_path='' as $$
declare jobs jsonb;
begin
 with claimed as (
 update private.support_outbox set lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
 where id in(select id from private.support_outbox where sent_at is null and (lease_until is null or lease_until<now())
 and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') order by created_at for update skip locked limit 20)
 returning *)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease',c.lease_id,'ticketId',t.id,'number',t.ticket_number,'event',c.event,'audience',c.audience,'to',u.email,'language',case when c.audience='staff' then 'fa' else t.notification_language end)),'[]') into jobs
 from claimed c join public.support_tickets t on t.id=c.ticket_id left join auth.users u on u.id=c.recipient_id ;
 return jobs;
end $$;


create or replace function private.session_is_active() returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare subject uuid := auth.uid(); session_id uuid;
begin
  if subject is null then return false; end if;
  begin session_id := (auth.jwt()->>'session_id')::uuid;
  exception when invalid_text_representation then return false; end;
  if session_id is null then return false; end if;
  return exists (select 1 from auth.sessions s where s.id = session_id
    and s.user_id = subject and (s.not_after is null or s.not_after > now()));
end $$;
revoke all on function private.session_is_active() from public, anon, authenticated;


create or replace function public.get_current_session() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('created_at',s.created_at)
  from auth.sessions s where private.session_is_active()
    and s.id::text = auth.jwt()->>'session_id' and s.user_id = auth.uid()
$$;
revoke all on function public.get_current_session() from public, anon;
grant execute on function public.get_current_session() to authenticated;


drop function public.security_observe_session(uuid,uuid,jsonb,text,text);
drop function private.security_observe_session(uuid,uuid,jsonb,text,text);
drop function public.security_record_event(uuid,uuid,text,text);
drop function private.security_record_event(uuid,uuid,text,text);
drop function public.security_begin_revocation(uuid,uuid,uuid,text,text);
drop function private.security_begin_revocation(uuid,uuid,uuid,text,text);
drop function public.security_consume_revocation(uuid,uuid,uuid);
drop function private.security_consume_revocation(uuid,uuid,uuid);
drop function public.security_finish_revocation(uuid,uuid,boolean);
drop function private.security_finish_revocation(uuid,uuid,boolean);
drop function public.security_prune();
drop function private.security_prune();
drop function public.security_snapshot();
drop function private.security_snapshot();
drop function public.transactional_email_jobs(boolean,boolean);
drop function private.transactional_email_jobs(boolean,boolean);
delete from private.support_outbox where audience='security';
alter table private.support_outbox drop constraint outbox_source_check;
alter table private.support_outbox drop constraint support_outbox_audience_check;
alter table private.support_outbox drop column security_event_id;
alter table private.support_outbox drop column security_payload;
alter table private.support_outbox alter column ticket_id set not null;
alter table private.support_outbox add constraint support_outbox_audience_check check(audience in ('user','staff'));
drop table private.security_revocations,private.security_denied_sessions,private.security_sessions,private.security_events;
commit;
