-- Text-only support. All writes are transactional commands; no direct client DML.
create table private.support_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now(), granted_by text not null
);
alter table private.support_staff enable row level security;
create function private.support_staff_allowed() returns boolean language sql stable security definer set search_path='' as $$
 select private.is_verified() and private.mfa_access_allowed() and auth.jwt()->>'aal'='aal2'
 and exists(select 1 from private.support_staff where user_id=auth.uid())
$$;
create function private.support_fresh() returns boolean language sql stable security definer set search_path='' as $$
 select private.support_staff_allowed() and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]')) a
 where a->>'method'='totp' and (a->>'timestamp')::numeric between extract(epoch from now())-900 and extract(epoch from now())+30)
$$;
create sequence private.support_number;
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(),
 ticket_number text not null unique default ('AM-' || lpad(nextval('private.support_number')::text,8,'0')),
 user_id uuid not null references auth.users(id), subject text not null check(length(subject) between 3 and 120),
 category text not null check(category in ('Account','Farm management','Weather','Irrigation','Sensors','Billing / Subscription','Bug report','Other')),
 status text not null default 'open' check(status in ('open','waiting_for_support','waiting_for_user','resolved','closed')),
 priority text not null default 'normal' check(priority in ('low','normal','high')),
 version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 last_public_at timestamptz not null default now(), last_staff_at timestamptz, last_user_at timestamptz not null default now()
);
create table public.support_ticket_messages (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 author_id uuid not null references auth.users(id), body text not null check(length(btrim(body)) between 1 and 4000),
 internal boolean not null default false, staff boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table private.support_reads (ticket_id uuid references public.support_tickets(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, read_at timestamptz not null, primary key(ticket_id,user_id));
create table private.support_commands (
 user_id uuid references auth.users(id), request_id uuid, ticket_id uuid references public.support_tickets(id), payload jsonb not null, created_at timestamptz not null default now(), primary key(user_id,request_id)
);
create table private.support_audit (
 id uuid primary key default gen_random_uuid(), ticket_id uuid references public.support_tickets(id), actor_id uuid references auth.users(id), action text not null, old_status text, new_status text, old_priority text, new_priority text, created_at timestamptz not null default now()
);
create table private.support_outbox (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id), recipient_id uuid references auth.users(id), audience text not null check(audience in ('user','staff')),
 event text not null, created_at timestamptz not null default now(), sent_at timestamptz, attempts integer not null default 0,
 lease_id uuid, lease_until timestamptz, first_attempt_at timestamptz, last_error text
);
create index support_owner_updated on public.support_tickets(user_id,updated_at desc,id);
create index support_queue on public.support_tickets(status,priority,category,updated_at desc);
create index support_messages_ticket on public.support_ticket_messages(ticket_id,created_at,id);
create index support_messages_author on public.support_ticket_messages(author_id);
create index support_commands_rate on private.support_commands(user_id,created_at);
create index support_outbox_pending on private.support_outbox(created_at) where sent_at is null;
create index support_outbox_ticket on private.support_outbox(ticket_id);
create index support_outbox_recipient on private.support_outbox(recipient_id);
create index support_audit_ticket on private.support_audit(ticket_id);
create index support_audit_actor on private.support_audit(actor_id);
create index support_reads_user on private.support_reads(user_id);
create index support_commands_ticket on private.support_commands(ticket_id);
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table private.support_reads enable row level security;
alter table private.support_commands enable row level security;
alter table private.support_audit enable row level security;
alter table private.support_outbox enable row level security;
revoke all on private.support_staff,private.support_reads,private.support_commands,private.support_audit,private.support_outbox from public,anon,authenticated;
revoke all on public.support_tickets, public.support_ticket_messages from anon, authenticated;
grant select on public.support_tickets, public.support_ticket_messages to authenticated;
create policy support_ticket_read on public.support_tickets for select to authenticated using
 ((select private.is_verified()) and (select private.mfa_access_allowed()) and (user_id=(select auth.uid()) or (select private.support_staff_allowed())));
create policy support_message_read on public.support_ticket_messages for select to authenticated using
 ((select private.is_verified()) and (select private.mfa_access_allowed()) and
 ((select private.support_staff_allowed()) or (not internal and exists(select 1 from public.support_tickets t where t.id=ticket_id and t.user_id=(select auth.uid())))));

create function private.support_command(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
  insert into public.support_tickets(user_id,subject,category) values(actor,btrim(p->>'subject'),p->>'category') returning * into t;
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
create function public.support_command(p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.support_command(p) $$;

create function private.support_read(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); is_staff boolean:=private.support_staff_allowed(); selected_ticket public.support_tickets; result jsonb; rows jsonb; page integer:=greatest(0,least(coalesce((p->>'page')::integer,0),10000));
begin
 if actor is null or not private.is_verified() or not private.mfa_access_allowed() then raise exception 'SUPPORT_DENIED'; end if;
 if coalesce((p->>'staff')::boolean,false) and not is_staff then raise exception 'SUPPORT_DENIED'; end if;
 if length(coalesce(p->>'search',''))>120 then raise exception 'SUPPORT_INVALID'; end if;
 if p->>'ticketId' is not null then
  select * into selected_ticket from public.support_tickets where id=(p->>'ticketId')::uuid;
  if not found or (selected_ticket.user_id<>actor and not is_staff) then raise exception 'SUPPORT_DENIED'; end if;
  select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at,m.id),'[]') into rows from
   (select * from public.support_ticket_messages where ticket_id=selected_ticket.id and (not internal or is_staff) order by created_at,id limit 50 offset page*50) m;
  -- Mark only the visible page's public messages; never clear a concurrent reply.
  insert into private.support_reads values(selected_ticket.id,actor,coalesce((select max((m->>'created_at')::timestamptz) from jsonb_array_elements(rows) m where not (m->>'internal')::boolean),selected_ticket.created_at))
   on conflict(ticket_id,user_id) do update set read_at=greatest(private.support_reads.read_at,excluded.read_at);
  return jsonb_build_object('ticket',to_jsonb(selected_ticket),'messages',rows,'hasMore',(select count(*)>(page+1)*50 from public.support_ticket_messages where ticket_id=selected_ticket.id and (not internal or is_staff)));
 end if;
 select coalesce(jsonb_agg(to_jsonb(q)),'[]') into result from (
 select t.*, (case when is_staff and coalesce((p->>'staff')::boolean,false) then t.last_user_at else t.last_staff_at end > coalesce(r.read_at,'-infinity')) as unread,
 case when is_staff and coalesce((p->>'staff')::boolean,false) then u.email else null end as user_email
 from public.support_tickets t left join private.support_reads r on r.ticket_id=t.id and r.user_id=actor join auth.users u on u.id=t.user_id
 where (t.user_id=actor or (is_staff and coalesce((p->>'staff')::boolean,false)))
 and (coalesce(p->>'status','')='' or t.status=p->>'status') and (coalesce(p->>'priority','')='' or t.priority=p->>'priority')
 and (coalesce(p->>'category','')='' or t.category=p->>'category')
 and (coalesce(p->>'search','')='' or t.ticket_number ilike '%'||(p->>'search')||'%' or t.subject ilike '%'||(p->>'search')||'%' or (is_staff and u.email ilike '%'||(p->>'search')||'%'))
 order by t.updated_at desc,t.id limit 21 offset page*20) q;
 return jsonb_build_object('tickets',result,'staff',is_staff);
end $$;
create function public.support_read(p jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.support_read(p) $$;
create function public.support_is_staff() returns boolean language sql security invoker set search_path='' as $$ select private.support_staff_allowed() $$;
revoke all on function private.support_staff_allowed(),private.support_fresh(),private.support_command(jsonb),private.support_read(jsonb), public.support_command(jsonb),public.support_read(jsonb),public.support_is_staff() from public,anon;
grant execute on function private.support_staff_allowed(),private.support_fresh(),private.support_command(jsonb),private.support_read(jsonb),public.support_command(jsonb),public.support_read(jsonb),public.support_is_staff() to authenticated;

-- Only the authenticated server worker can lease notification jobs. No user RPC can read recipients.
create function private.support_email_jobs() returns jsonb language plpgsql security definer set search_path='' as $$
declare jobs jsonb;
begin
 with claimed as (
 update private.support_outbox set lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
 where id in(select id from private.support_outbox where sent_at is null and (lease_until is null or lease_until<now())
 and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours') order by created_at for update skip locked limit 20)
 returning *)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease',c.lease_id,'ticketId',t.id,'number',t.ticket_number,'event',c.event,'audience',c.audience,'to',u.email,'language',coalesce(pr.language,'fa'))),'[]') into jobs
 from claimed c join public.support_tickets t on t.id=c.ticket_id left join auth.users u on u.id=c.recipient_id left join public.profiles pr on pr.id=c.recipient_id;
 return jobs;
end $$;
create function private.support_email_ack(p_id uuid,p_lease uuid,p_sent boolean) returns void language sql security definer set search_path='' as $$
 update private.support_outbox set sent_at=case when p_sent then now() end,last_error=case when p_sent then null else 'DELIVERY_FAILED' end,lease_until=case when p_sent then null else now()+interval '10 minutes' end
 where id=p_id and lease_id=p_lease and sent_at is null
$$;
create function public.support_email_jobs() returns jsonb language sql security invoker set search_path='' as $$ select private.support_email_jobs() $$;
create function public.support_email_ack(p_id uuid,p_lease uuid,p_sent boolean) returns void language sql security invoker set search_path='' as $$ select private.support_email_ack(p_id,p_lease,p_sent) $$;
revoke all on function private.support_email_jobs(),private.support_email_ack(uuid,uuid,boolean) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.support_email_jobs(),private.support_email_ack(uuid,uuid,boolean) to service_role;
revoke all on function public.support_email_jobs(),public.support_email_ack(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.support_email_jobs(),public.support_email_ack(uuid,uuid,boolean) to service_role;
