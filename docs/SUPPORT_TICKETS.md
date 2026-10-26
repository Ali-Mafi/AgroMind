# Support tickets

Implemented 2026-10-26 from main `098899aecf69ffda4ff7ae08bbeaf56b9c19912b`.

## Customer and staff experience

Account → Help keeps its guides and now creates persisted text-only tickets, displays a human-readable number, lists personal tickets with status filters and unread indicators, and opens chronological, paginated conversations. Customers can reply to active tickets and reopen resolved tickets. Closed tickets require staff intervention.

`/admin/support` provides ticket-number/subject/customer-email search, status/priority/category filters, public replies, internal notes, status/priority changes, and timestamps. Page sizes are 20 tickets and 50 messages. Read receipts only advance to messages actually returned, so a concurrent reply is not silently marked read. Staff verification is available at `/admin/support/verify`.

## Authorization and concurrency

- Reuses the existing verified-email, live-session and enrolled-MFA database gates. Farm collaboration roles do **not** imply platform support permissions.
- `private.support_staff` is an operator-controlled registry. There is no client-accessible role-grant action, no metadata-based admin check, and no default staff account.
- Staff reads require AAL2. Staff ticket mutations additionally require a signed TOTP authentication-method timestamp within 15 minutes. The application checks staff access server-side and SQL independently checks authorization.
- Public tables have SELECT-only grants and RLS. Owners see only their own tickets and public messages. Internal notes are invisible through both RLS and the read RPC. All commands check the authenticated actor rather than accepting user/author/owner IDs.
- Private, fixed-search-path definer implementations sit behind explicitly granted invoker RPC wrappers. Anonymous callers cannot invoke them. No public-table INSERT/UPDATE/DELETE is granted to customers.
- UUID idempotency keys are scoped to actors and bound to the complete command. Changed payloads using a previous key fail. Actor advisory locks serialize durable limits: 5 creations/day and 60 commands/hour. Ticket row locks serialize replies; version checks prevent lost staff status/priority updates. Users cannot choose priority or arbitrary status.
- Staff commands append private audit records. Resolved tickets must be reopened before public replies; closed tickets can only be restored to open by staff. All text renders as React text, never HTML. No attachments/buckets were added.
- `/admin` is included in existing private routing/cache protection; no unrelated authentication or PWA behavior changes.

## Secure staff bootstrap (manual)

An authorized operator must verify the intended person's existing Auth identity outside the application, require verified email and a verified TOTP factor, and record the grant approver. Do not derive an account from display names or editable metadata. In the Supabase SQL editor, substitute the **verified existing UUID** and real approver reference:

```sql
insert into private.support_staff(user_id, granted_by)
select id, '<operator/change-reference>' from auth.users
where id = '<verified-existing-user-uuid>'::uuid
  and email_confirmed_at is not null
  and exists (select 1 from auth.mfa_factors f
              where f.user_id=auth.users.id and f.status='verified')
on conflict (user_id) do nothing;
```

Confirm exactly one intended membership, then have that person authenticate with MFA and visit `/admin/support`. Revoke immediately with `delete from private.support_staff where user_id = '<verified-existing-user-uuid>'::uuid;` and retain the operator's change record. Revocation is checked on every database call. No accounts were granted access during implementation.

## Email activation and operations (manual configuration required)

Ticket/message transactions atomically enqueue notifications. Email errors never roll back ticket writes. Creation notifies the customer and staff; public replies notify the opposite party; status changes notify both. Internal notes never enqueue emails. Templates are Persian/English, include only the ticket number, event and trusted `https://agromind.ir` link, and reuse the existing Resend sender (`accounts@agromind.ir`).

Production inspection found Resend configured, but **no** support-worker service credential, support recipient setting, activation flag or cron secret. Delivery stays disabled until an operator:

1. Verifies the existing Resend sender/domain and an actual monitored support mailbox. Do not assume that the displayed contact address proves mailbox delivery.
2. Adds server-only `SUPABASE_SERVICE_ROLE_KEY`, `SUPPORT_NOTIFICATION_EMAIL`, and a strong `CRON_SECRET` using provider secret controls. Keep the existing `RESEND_API_KEY` and `NEXT_PUBLIC_SUPABASE_URL`. Never place the service credential in a `NEXT_PUBLIC_` variable.
3. Sets `SUPPORT_EMAIL_ENABLED=true` only after verification, and redeploys.
4. Configures an authenticated scheduler to GET `/api/support/notifications` every 10 minutes with `Authorization: Bearer <CRON_SECRET>`. Use Vercel Cron if the existing plan supports that interval; otherwise use an already-authorized scheduler. No paid upgrade or schedule was created. Each successful command also requests a best-effort `after()` drain when configured.
5. Tests an authorized customer/staff pair and real inbox for creation, both reply directions and status changes. Record provider message IDs/inbox acceptance without storing ticket bodies or credentials in logs.

Workers lease at most 20 jobs with `FOR UPDATE SKIP LOCKED`, five-minute leases and ten-minute failure backoff. Acknowledgements require the current lease token. Resend keys are stable (`support/<outbox UUID>`). Automatic retries stop 23 hours after the first attempt, within the provider's 24-hour idempotency window: old uncertain deliveries require reconciliation, never blind resend. Jobs that have never been attempted remain eligible, including those queued before activation. Review the backlog before activation.

Operator monitoring (private SQL only):

```sql
select audience, event, count(*), min(created_at) as oldest
from private.support_outbox where sent_at is null group by audience,event;
select id, attempts, first_attempt_at, last_error
from private.support_outbox
where sent_at is null and first_attempt_at < now()-interval '23 hours';
```

For expired uncertain jobs, reconcile the provider's delivery record using the idempotency/job ID before marking delivery or creating a new deliberate notification. Do not reset `first_attempt_at` automatically. Keep recipient/language/mailbox configuration stable during retries. Determine retention/deletion policy for tickets, command receipts, notes and audit evidence before purging; the implementation does not silently destroy customer correspondence.

## Verification boundaries

Automated coverage includes schema validation, ownership/IDOR attempts, direct DML denial, role revocation, AAL2/fresh-MFA checks, internal-note privacy, transitions/version conflicts, pagination/read receipts, limits, duplicate concurrency, outbox leases/recovery, localized templates and Help Center regressions. HTTP tests cover unauthenticated redirects, no-store headers and scheduler authentication. Mobile layouts have responsive/accessibility regression checks; authenticated browser/device acceptance is separate and remains unverified without authorized sessions.

See the session log and master progress for actual run/deployment evidence. Configuration presence is not email delivery evidence; local database tests are not a production customer-session test.

## Interface polish and staff mailbox — 2026-10-26

- Admin tickets now distinguish unread and read using a distinct start-border, background tint, clear indicator and accessible label. Statuses have distinct treatments; unread totals are page-scoped. Staff statuses distinguish staff response needed from waiting for the customer.
- Customer Help places the visible submission form before their ticket list. Conversation messages are visually separated for customers, staff and private notes. Authorization and data models are unchanged.
- Staff new-ticket notifications have a dedicated subject and short, safe message with no ticket body. The production recipient is intended to be `admin@agromind.ir`. Email delivery remains dependent on verified mailbox, server-only worker credential, activation and scheduled retries, followed by a real inbox test.

## Production scheduler (2026-10-26)

A Vercel Cron route is now configured in `vercel.json` with `0 8 * * *` UTC, which is compatible with the Hobby daily scheduling limit. When service credentials and `SUPPORT_EMAIL_ENABLED=true` are available, user and staff mutations also attempt an immediate best-effort notification drain via Next.js `after()`. The daily cron acts as a delayed fallback for retryable jobs; it does **not** guarantee immediate delivery or precise execution time on Hobby.

- The production Vercel project includes `SUPPORT_NOTIFICATION_EMAIL=admin@agromind.ir` and a server-only `CRON_SECRET`. Their presence is not proof that the mailbox accepts deliveries.
- `SUPABASE_SERVICE_ROLE_KEY` is **not** present. Copy it securely from the matching Supabase project's server API settings into Production environment variables in Vercel; never paste it into a chat, commit, or use a `NEXT_PUBLIC_` prefix.
- Enable `SUPPORT_EMAIL_ENABLED=true` only after verifying the sender, inbox and worker credential; redeploy and perform one authorized ticket-created delivery test.
- The Vercel cron is protected with Bearer `CRON_SECRET` headers. Do not expose it or remove the constant-time authorization check.
- More frequent scheduled retry delivery requires a Vercel plan supporting sub-daily cron or a separately configured authorized scheduler.
