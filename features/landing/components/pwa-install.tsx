"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { AppContainer } from "@/components/layout/app-container";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { Reveal } from "./landing-motion";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const t = useTranslation();
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  async function install() {
    if (!prompt) { setMessage(t("Use your browser menu to add AgroMind to your home screen.")); return; }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setMessage(t(choice.outcome === "accepted" ? "AgroMind is ready on your home screen." : "You can install AgroMind whenever you are ready."));
    setPrompt(null);
  }
  return <section className="py-10 sm:py-16"><AppContainer><Reveal><div className="flex flex-col items-start gap-6 rounded-3xl border border-primary/10 bg-linear-to-r from-primary/8 via-card to-amber-400/8 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9"><div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15"><Smartphone /></span><div><h2 className="font-heading text-xl font-bold sm:text-2xl">{t("Install AgroMind")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t("Add AgroMind to your home screen for faster access and a focused, app-like experience.")}</p>{message && <p role="status" className="mt-2 text-xs font-medium text-primary">{message}</p>}</div></div><Button size="lg" onClick={install} className="min-h-11 w-full rounded-xl px-5 sm:w-auto"><Download />{t("Install AgroMind")}</Button></div></Reveal></AppContainer></section>;
}
