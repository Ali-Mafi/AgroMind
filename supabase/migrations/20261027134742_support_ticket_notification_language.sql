-- Customer-facing support notifications use the language selected when a ticket
-- was submitted, not the current staff locale or a changing profile fallback.
-- Existing records retain the best available persisted profile language.
alter table public.support_tickets
  add column notification_language text not null default 'en'
  check (notification_language in ('fa','en'));

update public.support_tickets t
set notification_language=p.language
from public.profiles p
where p.id=t.user_id and p.language in ('fa','en');

create or replace function private.support_command(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); is_staff boolean:=private.support_staff_allowed(); t public.support_tickets; prior private.support_commands;
 action text:=p->>'action'; request uuid:=(p->>'requestId')::uuid; body text:=btrim(p->>'body'); note boolean:=coalesce((p->>'internal')::boolean,false); old_status text; old_priority text;
begin
 if actor is null or not private.is_verified() or not private.mfa_access_allowed() then raise exception 'SUPPORT_DENIED'; end if;
 if request is null or action not in ('create','reply','update','reopen') or action is null then raise exception 'SUPPORT_INVALID'; end if;
 -- Serialize each actor's limits and idempotency checks, across all app instances.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,7821));
 select * into prior from private.support_commands where user_id=actor and request_id=request;
 if found then
  if prior.payload<>p then raise exception 'SUPPORT_CONFLICT'; end if;
  return jsonb_build_object('id',prior.ticket_id);
 end if;
 if (select count(*) from private.support_commands where user_id=actor and created_at>now()-interval '1 hour')>=60
 or (action='create' and (select count(*) from private.support_commands where user_id=actor and payload->>'action'='create' and created_at>now()-interval '1 day')>=5)
 then raise exception 'SUPPORT_RATE'; end if;
 if action='create' then
  if body is null or length(body) not between 20 and 4000 or length(btrim(p->>'subject')) not between 3 and 120 then raise exception 'SUPPORT_INVALID'; end if;
  if p ? 'language' and (jsonb_typeof(p->'language') <> 'string' or p->>'language' not in ('fa','en')) then raise exception 'SUPPORT_INVALID'; end if;
  insert into public.support_tickets(user_id,subject,category,notification_language)
  values(actor,btrim(p->>'subject'),p->>'category',
    coalesce(p->>'language',(select pr.language from public.profiles pr where pr.id=actor),'en'))
  returning * into t;
  insert into public.support_ticket_messages(ticket_id,author_id,body) values(t.id,actor,body);
  insert into private.support_outbox(ticket_id,recipient_id,audience,event) values(t.id,actor,'user','created'),(t.id,null,'staff','created');
 else
  select * into t from public.support_tickets where id=(p->>'ticketId')::uuid for update;
  if not found or (t.user_id<>actor and not is_staff) then raise exception 'SUPPORT_DENIED'; end if;
  if is_staff and not private.support_fresh() then raise exception 'SUPPORT_MFA'; end if;
  old_status:=t.status; old_priority:=t.priority;
  if action='reply' then
   if body is null or length(body) not between 1 and 4000 or (note and not is_staff) then raise exception 'SUPPORT_INVALID'; end if;
   if t.status in ('resolved','closed') and not note then raise exception 'SUPPORT_CLOSED'; end if;
   insert into public.support_ticket_messages(ticket_id,author_id,body,internal,staff) values(t.id,actor,body,note,is_staff);
   if not note then
    t.status:=case when is_staff then 'waiting_for_user' else 'waiting_for_support' end;
    t.last_public_at:=now();
    if is_staff then t.last_staff_at:=now(); else t.last_user_at:=now(); end if;
    insert into private.support_outbox(ticket_id,recipient_id,audience,event) values(t.id,case when is_staff then t.user_id else null end,case when is_staff then 'user' else 'staff' end,'reply');
   end if;
  elsif action='reopen' then
   if t.status<>'resolved' then raise exception 'SUPPORT_CLOSED'; end if;
   t.status:='waiting_for_support';
  elsif action='update' then
   if not is_staff then raise exception 'SUPPORT_DENIED'; end if;
   if (p->>'version')::integer is distinct from t.version then raise exception 'SUPPORT_CONFLICT'; end if;
   t.status:=p->>'status'; t.priority:=p->>'priority';
   -- Closed tickets are final; is_staff can explicitly restore them to open.
   if old_status='closed' and t.status not in ('closed','open') then raise exception 'SUPPORT_CLOSED'; end if;
  end if;
  if action in ('update','reopen') and t.status<>old_status then
   insert into private.support_outbox(ticket_id,recipient_id,audience,event) values(t.id,t.user_id,'user','status'),(t.id,null,'staff','status');
  end if;
  update public.support_tickets set status=t.status,priority=t.priority,version=version+1,updated_at=now(),last_public_at=t.last_public_at,last_staff_at=t.last_staff_at,last_user_at=t.last_user_at where id=t.id;
  if is_staff then insert into private.support_audit(ticket_id,actor_id,action,old_status,new_status,old_priority,new_priority) values(t.id,actor,case when note then 'note' else action end,old_status,t.status,old_priority,t.priority); end if;
 end if;
 insert into private.support_commands(user_id,request_id,ticket_id,payload) values(actor,request,t.id,p);
 return jsonb_build_object('id',t.id);
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

