"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

const ENAMAD_VERIFY_URL =
  "https://trustseal.enamad.ir/?id=8024287&Code=GGuR0pCbpfBTYSPKvDTV1QHV6hmsuXXc";

export function EnamadBadge() {
  const [failed, setFailed] = useState(false);

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={ENAMAD_VERIFY_URL}
      aria-label="eNAMAD"
      className="inline-flex min-h-16 min-w-32 items-center justify-center rounded-xl border border-border/70 bg-background/80 px-3 py-2 shadow-sm transition-colors hover:bg-background"
    >
      {!failed ? (
        <img
          src="/api/enamad-badge"
          alt="eNAMAD"
          width={120}
          height={120}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-h-20 w-auto object-contain"
        />
      ) : (
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <ShieldCheck aria-hidden="true" className="size-5" />
          <span>eNAMAD</span>
        </span>
      )}
    </a>
  );
}
