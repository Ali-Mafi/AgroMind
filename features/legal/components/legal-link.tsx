"use client";
import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import type { LegalKind } from "../content";
import { useLegalModal } from "./legal-modal-provider";

export function isUnmodifiedLegalClick(event: {
  button: number; defaultPrevented: boolean; metaKey: boolean;
  ctrlKey: boolean; altKey: boolean; shiftKey: boolean;
}) {
  return !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
}

export function LegalLink({ kind, children, className }: {
  kind: LegalKind; children: ReactNode; className?: string;
}) {
  const context = useLegalModal();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!context || !isUnmodifiedLegalClick(event)) return;
    event.preventDefault();
    context.openLegal(kind);
  };
  return <Link href={`/${kind}`} onClick={onClick} className={className}>{children}</Link>;
}
