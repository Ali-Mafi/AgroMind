"use client";

import type { ReactNode } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native buttons + Base UI focus/expanded state; no Safari summary marker. */
export function Disclosure({
  title,
  children,
  className,
  defaultOpen = false,
  id,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  id?: string;
}) {
  return (
    <Accordion.Root
      defaultValue={defaultOpen ? ["content"] : []}
      className={cn("app-disclosure", className)}
      id={id}
    >
      <Accordion.Item value="content">
        <Accordion.Header>
          <Accordion.Trigger className="app-disclosure-trigger flex min-h-12 w-full items-center justify-between gap-4 rounded-xl py-3 text-start font-semibold outline-none">
            <span>{title}</span>
            <ChevronDown
              className="app-disclosure-chevron size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel keepMounted className="app-disclosure-panel">
          <div className="pb-3 pt-2">{children}</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}
