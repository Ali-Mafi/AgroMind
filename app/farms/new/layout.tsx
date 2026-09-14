import type { ReactNode } from "react";
import { ContextBackLink } from "@/features/navigation/components/context-back-link";

export default function NewFarmLayout({ children }: { children: ReactNode }) {
  return (
    <div data-contextual-new-farm>
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6 lg:px-0">
        <ContextBackLink fallback="/farms" />
      </div>
      {children}
      <style>{`
        [data-contextual-new-farm] main > div.space-y-1 > a:first-child {
          display: none;
        }
      `}</style>
    </div>
  );
}
