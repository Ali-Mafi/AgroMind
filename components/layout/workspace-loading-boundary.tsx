import { Suspense, type ReactNode } from "react";
import { LoadingSkeleton } from "@/components/ui/workspace";

// Segment loading.tsx files cannot cover their own async layout. Put this
// boundary ABOVE ProtectedLayout, only on workspace routes (not auth/MFA),
// so public auth redirects keep their original HTTP status and semantics.
// No private data is rendered before the unchanged security checks complete.
export function WorkspaceLoadingBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div data-route-loading className="mx-auto min-h-svh w-full max-w-6xl px-4 py-8 sm:px-6">
        <LoadingSkeleton />
      </div>
    }>
      {children}
    </Suspense>
  );
}
