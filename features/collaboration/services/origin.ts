import "server-only";

import { headers } from "next/headers";
import { siteOrigin } from "@/features/authentication/lib/redirects";

export async function collaborationRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto =
    requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!forwardedHost || forwardedProto !== "https") return siteOrigin();

  const host = forwardedHost.split(",")[0]?.trim().toLowerCase();
  if (!host) return siteOrigin();

  const production =
    host === "agromind.ir" || host === "www.agromind.ir";
  const preview =
    process.env.VERCEL_ENV === "preview" &&
    /^agro-mind(?:-git)?-[a-z0-9-]+-ali-mafi\.vercel\.app$/.test(host);

  return production || preview ? `https://${host}` : siteOrigin();
}
