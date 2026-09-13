import "server-only";
type AuthEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};
export async function sendAuthEmail(message: AuthEmail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("EMAIL_UNAVAILABLE");
  const { idempotencyKey, ...content } = message;
  // The REST endpoint permits an abort deadline inside Supabase's hook timeout.
  // Never include the provider response, token-bearing payload or key in logs.
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      ...content,
      from: "AgroMind <accounts@agromind.ir>",
      to: [content.to],
    }),
  });
  if (!response.ok) throw new Error("EMAIL_UNAVAILABLE");
}
