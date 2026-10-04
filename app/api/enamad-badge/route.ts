const ENAMAD_BADGE_URL =
  "https://trustseal.enamad.ir/logo.aspx?id=8024287&Code=GGuR0pCbpfBTYSPKvDTV1QHV6hmsuXXc";

export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch(ENAMAD_BADGE_URL, {
      cache: "no-store",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://agromind.ir/",
        "User-Agent": "Mozilla/5.0 (compatible; AgroMind/1.0; +https://agromind.ir/)",
      },
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      return new Response("eNAMAD badge unavailable", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
        "Content-Type": contentType,
      },
    });
  } catch {
    return new Response("eNAMAD badge unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
