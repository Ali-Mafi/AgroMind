"use client";
import { useEffect, useRef, useState } from "react";
import {
  Droplets,
  Sprout,
  CloudSun,
  Bug,
  Send,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";

import { useComposerLayout } from "../hooks/use-composer-layout";

const actions = [
  ["Irrigation advice", "How can I plan irrigation for my farm?", Droplets],
  [
    "Crop health",
    "What should I check to understand my crop's health?",
    Sprout,
  ],
  ["Weather outlook", "How could the weather affect my farm?", CloudSun],
  [
    "Pest / disease help",
    "What details should I collect about a pest or disease?",
    Bug,
  ],
] as const;

export function AssistantWorkspace() {
  const t = useTranslation();
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const page = useRef<HTMLElement>(null);
  const composer = useRef<HTMLDivElement>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  useComposerLayout(page, composer);
  useEffect(() => {
    const textarea = input.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [draft]);
  return (
    <main ref={page} className="app-page assistant-page flex flex-col">
      <PageHeader
        title={t("AgroMind Assistant")}
        description={t(
          "A little help for the questions that grow with your farm.",
        )}
      />
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-4 sm:py-8">
        <div className="mb-7 flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <MessageCircle size={27} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("What would you like to explore?")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t(
            "Personal advice is coming soon. You can prepare a question below.",
          )}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {actions.map(([label, question, Icon]) => (
            <Button
              key={label}
              variant="outline"
              onClick={() => {
                setDraft(t(question));
                setSelectedPrompt(label);
                input.current?.focus({ preventScroll: true });
              }}
              aria-pressed={selectedPrompt === label}
              className="data-[pressed]:border-primary aria-pressed:border-primary/50 aria-pressed:bg-primary/5 h-auto min-h-16 justify-start gap-3 whitespace-normal rounded-2xl bg-card px-5 py-4 text-start font-medium"
            >
              <Icon size={19} className="shrink-0 text-primary" />
              {t(label)}
            </Button>
          ))}
        </div>
        <p role="status" className="mt-4 min-h-5 text-xs text-primary">
          {selectedPrompt ? t("Question ready. You can edit it below.") : ""}
        </p>
      </section>
      <div ref={composer} className="assistant-composer">
        <div className="app-card p-3 shadow-sm sm:p-4">
          <label htmlFor="assistant-question" className="sr-only">
            {t("Your question")}
          </label>
          <textarea
            id="assistant-question"
            ref={input}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSelectedPrompt(null);
            }}
            maxLength={2000}
            rows={2}
            placeholder={t("Ask about your farm…")}
            className="max-h-40 min-h-18 w-full resize-none overflow-y-auto overscroll-contain rounded-xl bg-transparent p-2 text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-describedby="assistant-availability"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p
              id="assistant-availability"
              className="text-xs text-muted-foreground"
            >
              {t("Chat is not available yet. Your draft stays in this page.")}
            </p>
            <Button
              disabled
              size="icon"
              className="size-11 shrink-0 rounded-xl"
              aria-label={t("Send message")}
            >
              <Send size={18} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
