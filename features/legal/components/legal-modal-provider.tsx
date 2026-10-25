"use client";
import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LegalKind } from "../content";

// The sizeable legal copy loads only if the user opens a policy.
const Dialog = lazy(() => import("./legal-modal-dialog").then(({ LegalModalDialog }) => ({ default: LegalModalDialog })));
type ContextValue = { openLegal: (kind: LegalKind) => void };
const Context = createContext<ContextValue | null>(null);

export function LegalModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<LegalKind | null>(null);
  const openLegal = useCallback((kind: LegalKind) => setActive(kind), []);
  const context = useMemo(() => ({ openLegal }), [openLegal]);
  return <Context.Provider value={context}>
    {children}
    {active !== null && <Suspense fallback={null}>
      <Dialog kind={active} onSelect={openLegal} onClose={() => setActive(null)} />
    </Suspense>}
  </Context.Provider>;
}

// Graceful no-JavaScript/isolated-SSR fallback to the real URL.
export function useLegalModal() {
  return useContext(Context);
}
