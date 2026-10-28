import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sendAuthEmail } from "@/features/authentication/services/resend-auth";
import { loginSecurityEmail } from "@/features/account-security/lib/email";
import type { SessionMetadata } from "@/features/account-security/types/security";
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
  securityDetails?: { metadata?: SessionMetadata; provider?: string; loginAt?: string };
};
export async function drainSupportEmails() {
  // Explicit activation only after sender/recipient verification. Never acquire secrets from the browser.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mailbox = process.env.SUPPORT_NOTIFICATION_EMAIL;
  const supportEnabled = process.env.SUPPORT_EMAIL_ENABLED === "true" && Boolean(mailbox && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailbox));
  const securityEnabled = process.env.SECURITY_EMAIL_ENABLED === "true";
  if (!key || !url) return;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const pruned = await client.rpc("security_prune");
    if (pruned.error) console.error("[email] security_retention_failed");
    if ((!supportEnabled && !securityEnabled) || !process.env.RESEND_API_KEY) return;
    const { data, error } = await client.rpc("transactional_email_jobs", { p_support: supportEnabled, p_security: securityEnabled });
    if (error) { console.error("[email] queue_lease_failed"); return; }
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
          ...(job.audience === "security"
            ? loginSecurityEmail(job.securityDetails ?? {}, job.language)
            : supportEmail(job.number, job.event, job.language, href, job.audience === "staff" ? "staff" : "user")),
          to,
          idempotencyKey: `support/${job.id}`,
        });
        sent = true;
      } catch {
        console.error("[email] delivery_failed", { audience: job.audience });
      }
      const ack = await client.rpc("support_email_ack", {
        p_id: job.id,
        p_lease: job.lease,
        p_sent: sent,
      });
      if (ack.error) console.error("[email] queue_ack_failed");
    }
  } catch {
    console.error("[email] queue_worker_failed");
  }
}
