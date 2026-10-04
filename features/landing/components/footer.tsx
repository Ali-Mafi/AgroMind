import { ShieldCheck } from "lucide-react";
import { T } from "@/features/settings/components/translated-text";
import { APP } from "@/constants/app";

const ENAMAD_VERIFY_URL =
  "https://trustseal.enamad.ir/?id=8024287&Code=GGuR0pCbpfBTYSPKvDTV1QHV6hmsuXXc";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <p className="font-semibold">
            {APP.name}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            <T text={APP.slogan} />
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <a
            referrerPolicy="origin"
            target="_blank"
            rel="noopener noreferrer"
            href={ENAMAD_VERIFY_URL}
            aria-label="eNAMAD"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-background"
          >
            <ShieldCheck aria-hidden="true" className="size-5" />
            <span>eNAMAD</span>
          </a>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP.name}<T text=". All rights reserved." />
          </p>
        </div>
      </div>
    </footer>
  );
}
