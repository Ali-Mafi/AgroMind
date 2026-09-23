"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Sprout,
  Droplets,
  CloudSun,
  ShieldCheck,
  SlidersHorizontal,
  Mail,
  LifeBuoy,
} from "lucide-react";
import { Disclosure } from "@/components/ui/disclosure";
import { NavigationArrow } from "@/components/ui/navigation-arrow";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { HELP_TOPICS } from "../constants/help";
import { SupportTicketForm } from "./support-ticket-form";

const icons = [
  BookOpen,
  Sprout,
  Droplets,
  CloudSun,
  ShieldCheck,
  SlidersHorizontal,
];
export function HelpCenter() {
  const t = useTranslation();
  const [topicId, setTopicId] = useState<string>("start");
  const topic =
    HELP_TOPICS.find((item) => item.id === topicId) ?? HELP_TOPICS[0];
  return (
    <>
      <p className="max-w-2xl text-base leading-7 text-muted-foreground">
        {t("Find a quick answer and get back to your farm.")}
      </p>
      <section
        aria-label={t("Quick help")}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {HELP_TOPICS.map((item, index) => {
          const Icon = icons[index];
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={topicId === item.id}
              aria-controls="help-questions"
              onClick={() => setTopicId(item.id)}
              className="app-card app-control flex min-h-20 items-center gap-4 p-4 text-start text-sm font-semibold hover:border-primary/40 aria-pressed:border-primary/50 aria-pressed:bg-primary/5"
            >
              <span className="app-icon-container shrink-0">
                <Icon size={20} aria-hidden="true" />
              </span>
              {t(item.name)}
            </button>
          );
        })}
      </section>
      <section
        id="help-questions"
        aria-labelledby="help-questions-heading"
        className="app-card scroll-mt-6 p-5 sm:p-7"
      >
        <h2
          id="help-questions-heading"
          className="mb-4 text-lg font-semibold"
          aria-live="polite"
        >
          {t(topic.name)}
        </h2>
        <div key={topic.id} className="app-state-enter divide-y">
          {topic.questions.map(([question, answer, href, label]) => (
            <Disclosure
              key={question}
              title={t(question)}
              className="py-1 text-sm"
            >
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {t(answer)}
              </p>
              <Link
                href={href}
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
              >
                {t(label)}
                <NavigationArrow size={16} />
              </Link>
            </Disclosure>
          ))}
        </div>
      </section>
      <section className="app-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="app-icon-container">
            <LifeBuoy size={21} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold">{t("Need more help?")}</h2>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t(
            "Support contact options are being prepared. The guides above are available now.",
          )}
        </p>
        <Disclosure
          title={t("Submit Support Ticket")}
          className="mt-5 border-t pt-2 text-sm"
        >
          <SupportTicketForm />
        </Disclosure>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-5">
          <Button
            disabled
            variant="outline"
            className="min-h-11 rounded-xl px-4"
            aria-describedby="email-support-availability"
          >
            <Mail size={17} aria-hidden="true" />
            {t("Email Support")}
          </Button>
          <p
            id="email-support-availability"
            className="text-sm text-muted-foreground"
          >
            {t("An official support email has not been published yet.")}
          </p>
        </div>
      </section>
    </>
  );
}
