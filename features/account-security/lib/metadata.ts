import { isIP } from "node:net";
import { geolocation, ipAddress } from "@vercel/functions";
import type { SessionMetadata } from "../types/security";

function clean(value?: string | null) {
  return value?.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "").trim().slice(0, 100) || null;
}

// UA is an untrusted description, never an identity or authorization input.
// Deliberately avoid exact device models and discard the raw UA after parsing.
export function describeDevice(raw: string | null) {
  const ua = (raw ?? "").slice(0, 1024);
  const os = /iPad|iPhone|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Macintosh|Mac OS X/.test(ua) ? "macOS" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Unknown operating system";
  const browser = /Edg(?:e|A|iOS)?\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\/|FxiOS\//.test(ua) ? "Firefox" : /Chrome\/|CriOS\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown browser";
  const device = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "Tablet" : /iPhone|iPod|Mobile/.test(ua) ? "Mobile" : os !== "Unknown operating system" ? "Computer" : "Unknown device";
  return { device, os, browser };
}
export function requestMetadata(requestHeaders: Headers, onVercel = process.env.VERCEL === "1"): SessionMetadata {
  const device = describeDevice(requestHeaders.get("user-agent"));
  // Headers are authoritative only behind the Vercel-controlled ingress. Do not
  // enable this with a client header or trust arbitrary forwarded data locally.
  if (!onVercel) return { ...device, ip: null, city: null, region: null, country: null };
  const request = { headers: requestHeaders };
  let geo;
  try { geo = geolocation(request); } catch { geo = null; }
  const ip = ipAddress(request);
  return {
    ...device,
    ip: ip && isIP(ip) ? ip : null,
    city: clean(geo?.city),
    region: clean(geo?.countryRegion),
    country: clean(geo?.country),
  };
}
export function locationLabel(metadata: SessionMetadata) {
  return [metadata.city, metadata.region, metadata.country].filter(Boolean).join(", ") || "Unknown location";
}
