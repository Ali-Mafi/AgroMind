"use client";
import { useRef, useState } from "react";
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
  return (
    <main className="app-page flex min-h-[calc(100dvh-6rem)] flex-col lg:min-h-dvh">
      <PageHeader
        title={t("AgroMind Assistant")}
        description={t(
          "A little help for the questions that grow with your farm.",
        )}
      />
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8 sm:py-12">
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
                input.current?.focus();
              }}
              className="h-auto min-h-16 justify-start gap-3 whitespace-normal rounded-2xl bg-card px-5 py-4 text-start font-medium"
            >
              <Icon size={19} className="shrink-0 text-primary" />
              {t(label)}
            </Button>
          ))}
        </div>
        <div className="app-card mt-10 p-4">
          <label htmlFor="assistant-question" className="sr-only">
            {t("Your question")}
          </label>
          <textarea
            id="assistant-question"
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={t("Ask about your farm…")}
            className="w-full resize-y rounded-xl bg-transparent p-2 text-base leading-7 outline-none"
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
              <Send size={18} className="rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
