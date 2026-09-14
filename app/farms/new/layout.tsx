import type { ReactNode } from "react";
import { ContextBackLink } from "@/features/navigation/components/context-back-link";
import styles from "./layout.module.css";

export default function NewFarmLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.contextualNewFarm}>
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 sm:px-6 lg:px-0">
        <ContextBackLink fallback="/farms" />
      </div>
      {children}
    </div>
  );
}
