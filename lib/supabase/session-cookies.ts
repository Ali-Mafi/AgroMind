import { createHash } from "node:crypto";
import { combineChunks, isChunkLike, stringFromBase64URL } from "@supabase/ssr";

type SessionCookie = { name: string; value: string };

const cancellationPrefix = "agromind_mfa_cancel_";
const uuidPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export function sessionCookieName(url: string) {
  // Match supabase-js's existing default to preserve previously issued cookies.
  return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
}

export async function pendingMfaCancellationCookie(
  cookies: SessionCookie[],
  sessionName: string,
) {
  const value = await combineChunks(
    sessionName,
    (name) => cookies.find((cookie) => cookie.name === name)?.value,
  );
  if (!value) return null;

  try {
    const { access_token: token } = JSON.parse(
      value.startsWith("base64-")
        ? stringFromBase64URL(value.slice("base64-".length))
        : value,
    );
    if (typeof token !== "string") return null;
    const [header, payload, signature, extra] = token.split(".");
    if (!header || !payload || !signature || extra !== undefined) return null;
    const { aal, session_id: sessionId } = JSON.parse(
      stringFromBase64URL(payload),
    );

    // These claims are used only to suppress a cookie, never to authenticate it.
    if (
      aal !== "aal1" ||
      typeof sessionId !== "string" ||
      !uuidPattern.test(sessionId)
    )
      return null;
    const fingerprint = createHash("sha256").update(sessionId).digest("base64url");
    return cancellationPrefix + fingerprint;
  } catch {
    return null;
  }
}

export async function visibleSessionCookies(
  cookies: SessionCookie[],
  sessionName: string,
) {
  if (!cookies.some(({ name }) => name.startsWith(cancellationPrefix)))
    return cookies;
  const cancellation = await pendingMfaCancellationCookie(cookies, sessionName);
  if (!cookies.some(({ name, value }) => name === cancellation && value === "1"))
    return cookies;

  // Keep the names visible to SSR so it can remove obsolete chunks on sign-in.
  return cookies.map((cookie) =>
    isChunkLike(cookie.name, sessionName) ? { ...cookie, value: "" } : cookie,
  );
}
