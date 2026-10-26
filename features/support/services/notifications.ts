import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sendAuthEmail } from "@/features/authentication/services/resend-auth";
import { supportEmail } from "../lib/email";
type Job = {
  id: string;
  lease: string;
  ticketId: string;
  number: string;
  event: string;
  audience: string;
  to: string | null;
  language: string;
};
export async function drainSupportEmails() {
  // Explicit activation only after sender/recipient verification. Never acquire secrets from the browser.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mailbox = process.env.SUPPORT_NOTIFICATION_EMAIL;
  if (
    process.env.SUPPORT_EMAIL_ENABLED !== "true" ||
    !key ||
    !url ||
    !process.env.RESEND_API_KEY ||
    !mailbox ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailbox)
  )
    return;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const { data, error } = await client.rpc("support_email_jobs");
    if (error) return;
    for (const job of (data ?? []) as Job[]) {
      let sent = false;
      try {
        const to = job.audience === "staff" ? mailbox : job.to;
        if (!to) throw new Error("RECIPIENT_UNAVAILABLE");
        const href =
          job.audience === "staff"
            ? `https://agromind.ir/admin/support?ticket=${job.ticketId}`
            : `https://agromind.ir/account/help/tickets/${job.ticketId}`;
        await sendAuthEmail({
          ...supportEmail(job.number, job.event, job.language, href, job.audience === "staff" ? "staff" : "user"),
          to,
          idempotencyKey: `support/${job.id}`,
        });
        sent = true;
      } catch {
        /* Persist retry state without PII or provider payloads. */
      }
      await client.rpc("support_email_ack", {
        p_id: job.id,
        p_lease: job.lease,
        p_sent: sent,
      });
    }
  } catch {
    /* The durable outbox is retried by the scheduled endpoint. */
  }
}
