import type { ReactNode } from "react";
import { BottomNavigation } from "@/features/navigation/components/bottom-navigation";
import { T } from "@/features/settings/components/translated-text";
import "./app-shell.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="agromind-app">
      <a
        href="#workspace-content"
        className="sr-only z-[200] rounded-xl bg-card p-4 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        <T text="Skip to content" />
      </a>
      <BottomNavigation />
      <div
        id="workspace-content"
        tabIndex={-1}
        className="app-content outline-none"
      >
        {children}
      </div>
    </div>
  );
}
