/**
 * Text-only PNG labels for premium email headers/footers.
 *
 * Gmail on iOS forcibly recolors live email text but leaves raster artwork
 * intact. Rasterize only short, public-facing decorative labels while retaining
 * alt text, semantic headings, clickable links and the full plain-text email.
 * No user data, tokens, ticket bodies or external font URLs are accepted.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

type Variant = "brand" | "tagline" | "title" | "subtitle" | "social" | "handle" | "website" | "copyright" | "cta";
const variants: Record<Variant, { width: number; height: number; size: number; color: string }> = {
  brand:     { width: 440, height: 110, size: 81, color: "#ffffff" },
  tagline:   { width: 440, height: 92, size: 21, color: "#ffffff" },
  title:     { width: 1040, height: 160, size: 72, color: "#ffffff" },
  subtitle:  { width: 1000, height: 90, size: 43, color: "#ffffff" },
  social:    { width: 240, height: 65, size: 38, color: "#ffffff" },
  handle:    { width: 280, height: 60, size: 36, color: "#e1ce95" },
  website:   { width: 340, height: 65, size: 35, color: "#ffffff" },
  copyright: { width: 470, height: 60, size: 30, color: "#e6e3d4" },
  cta:       { width: 560, height: 80, size: 45, color: "#ffffff" },
};

const allowed = /^[\p{L}\p{M}\p{N}\s.,،:؛!?؟'’()\-ـ©|]+$/u;
const publicBrandLabels = new Set([
  "AgroMind", "INTELLIGENT\nFARMING TOGETHER", "Instagram", "Telegram",
  "agromind.ir", "agromindir",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variantName = searchParams.get("kind") as Variant | null;
  const variant = variantName && Object.prototype.hasOwnProperty.call(variants, variantName)
    ? variants[variantName]
    : undefined;
  const text = searchParams.get("text")?.normalize("NFC") ?? "";
  const language = searchParams.get("lang");
  if (!variant || !["fa", "en"].includes(language ?? "") ||
      !text || text.length > 100 || !allowed.test(text) ||
      ((variantName === "brand" || variantName === "tagline" || variantName === "social" ||
        variantName === "handle" || variantName === "website" || variantName === "copyright") &&
        !publicBrandLabels.has(text) && !(variantName === "copyright" && /^© 20\\d{2} AgroMind$/.test(text)))) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  // ImageResponse requires a static TTF/OTF/WOFF (not WOFF2). This is the
  // genuine OFL-licensed Vazirmatn font, independent of inbox font support.
  const font = await readFile(join(process.cwd(), "public/email/fonts/vazirmatn-regular.ttf"));
  const serifFont = await readFile(join(process.cwd(), "public/email/fonts/instrument-serif-regular.ttf"));
  const size = text.length > 65 ? variant.size * 0.73
    : text.length > 38 ? variant.size * 0.86 : variant.size;
  const isFa = language === "fa";
  return new ImageResponse(
    <div style={{
      display: "flex",
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      whiteSpace: "pre-wrap",
      overflowWrap: "break-word",
      direction: isFa ? "rtl" : "ltr",
      fontFamily: variantName === "brand" ? "Instrument Serif" : "Vazirmatn",
      fontSize: size,
      lineHeight: 1.23,
      fontWeight: 400,
      letterSpacing: variantName === "tagline" ? 4 : 0,
      color: variant.color,
      padding: "0 12px",
    }}>
      {text}
    </div>,
    {
      width: variant.width,
      height: variant.height,
      fonts: [
        { name: "Vazirmatn", data: font, weight: 400, style: "normal" },
        { name: "Instrument Serif", data: serifFont, weight: 400, style: "normal" },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
