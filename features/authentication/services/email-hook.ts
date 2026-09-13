import "server-only";
import { createHash } from "node:crypto";
import { Webhook } from "standardwebhooks";
import { z } from "zod";
import { emailSchema, tokenHashSchema } from "../lib/validation";
import { renderAuthEmail } from "../emails/templates";
import { sendAuthEmail } from "./resend-auth";

const payloadSchema = z.object({
  user: z.object({
    email: emailSchema,
    user_metadata: z
      .object({ language: z.unknown().optional() })
      .passthrough()
      .optional(),
  }),
  email_data: z.object({
    token_hash: tokenHashSchema,
    email_action_type: z.enum(["signup", "recovery"]),
  }),
});
function failure(status: number) {
  return Response.json(
    {
      error: {
        http_code: status,
        message:
          status === 401 ? "Invalid webhook." : "Email could not be sent.",
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
async function limitedBody(request: Request) {
  if (
    !request.body ||
    Number(request.headers.get("content-length") ?? 0) > 65536
  )
    throw new Error("INVALID_BODY");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 65536) {
        await reader.cancel();
        throw new Error("INVALID_BODY");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function handleAuthEmail(request: Request) {
  const secret = process.env.SUPABASE_AUTH_EMAIL_HOOK_SECRET;
  if (!secret || !process.env.RESEND_API_KEY) return failure(503);
  if (
    !request.headers.get("webhook-id") ||
    !request.headers.get("webhook-signature") ||
    !request.headers.get("webhook-timestamp")
  )
    return failure(401);
  let verified: unknown;
  try {
    // Official Standard Webhooks verification checks signature and timestamp.
    verified = new Webhook(secret.replace(/^v1,/, "")).verify(
      await limitedBody(request),
      Object.fromEntries(request.headers),
    );
  } catch {
    return failure(401);
  }
  const payload = payloadSchema.safeParse(verified);
  if (!payload.success) return failure(400);
  const { user, email_data: email } = payload.data;
  try {
    const rendered = renderAuthEmail(
      email.email_action_type,
      email.token_hash,
      user.user_metadata?.language === "fa" ? "fa" : "en",
    );
    const idempotencyKey =
      "agromind-auth/" +
      createHash("sha256")
        .update(email.email_action_type + ":" + email.token_hash)
        .digest("hex");
    await sendAuthEmail({ ...rendered, to: user.email, idempotencyKey });
    return Response.json({}, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(503);
  }
}
