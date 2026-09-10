"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, Compass, Download, Share, Smartphone, SquarePlus, X } from "lucide-react";
import { AppContainer } from "@/components/layout/app-container";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/features/settings/context/settings-context";
import { useTranslation } from "@/features/settings/hooks/use-translation";
import { Reveal } from "./landing-motion";
import styles from "../landing.module.css";

export function PwaInstall() {
  const t = useTranslation();
  const { format, direction } = useSettings();

  useEffect(() => {
    // Installation is always user initiated; Android is not offered yet.
    const suppressPrompt = (event: Event) => event.preventDefault();
    window.addEventListener("beforeinstallprompt", suppressPrompt);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline-cache availability must not block the manual installation guide.
      });
    }
    return () => window.removeEventListener("beforeinstallprompt", suppressPrompt);
  }, []);

  const steps = [
    { icon: Compass, heading: t("Open in Safari"), body: t("Open AgroMind in Safari on your iPhone or iPad.") },
    { icon: Share, heading: t("Tap Share"), body: t("Tap Safari's Share button. Open the browser menu first if needed.") },
    { icon: SquarePlus, heading: t("Add to Home Screen"), body: t("Choose Add to Home Screen from the share menu. If Open as Web App appears, keep it enabled.") },
    { icon: Smartphone, heading: t("Add and open AgroMind"), body: t("Tap Add, then open AgroMind from your home screen to continue to sign up.") },
  ];

  return (
    <section id="install" aria-labelledby="install-title" className="py-12 sm:py-20">
      <AppContainer>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-linear-to-br from-primary/8 via-card to-accent/8 p-6 sm:p-10 lg:p-12">
            <div className="max-w-2xl">
              <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15"><Smartphone aria-hidden="true" /></span>
              <h2 id="install-title" className="font-heading text-3xl font-bold sm:text-4xl">{t("Install AgroMind")}</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{t("Add AgroMind to your home screen for faster access and a focused, app-like experience.")}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="flex flex-col rounded-3xl border border-border/80 bg-background/60 p-5 sm:p-6">
                <Smartphone className="size-6 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-semibold">{t("Android app")}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{t("The Android app is on its way.")}</p>
                <Button disabled className="mt-6 min-h-12 w-full rounded-xl" variant="outline">{t("Coming soon")}</Button>
              </div>

              <Dialog.Root>
                <div className="flex flex-col rounded-3xl border border-primary/25 bg-background/90 p-5 shadow-lg shadow-primary/5 sm:p-6">
                  <Compass className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-semibold">{t("iOS · PWA")}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{t("Install from Safari, then create your AgroMind account.")}</p>
                  <Dialog.Trigger className={buttonVariants({ className: "mt-6 min-h-12 w-full rounded-xl" })}>
                    <Download aria-hidden="true" />{t("Install on iPhone or iPad")}
                  </Dialog.Trigger>
                </div>

                <Dialog.Portal>
                  <Dialog.Backdrop className={`${styles.installBackdrop} fixed inset-0 z-[90] bg-black/50`} />
                  <Dialog.Popup dir={direction} className={`${styles.installDialog} fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-h-[88dvh] max-w-lg flex-col overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-2xl outline-none sm:inset-x-6 sm:bottom-auto sm:top-[max(1rem,calc((100dvh-42rem)/2))]`}>
                    <div className="flex shrink-0 items-start justify-between gap-3 border-b p-5 sm:p-6">
                      <div>
                        <Dialog.Title className="font-heading text-xl font-bold">{t("Install on iPhone or iPad")}</Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">{t("Add AgroMind to your home screen using Safari.")}</Dialog.Description>
                      </div>
                      <Dialog.Close aria-label={t("Close installation guide")} className={buttonVariants({ variant: "ghost", className: "size-11 rounded-xl p-0" })}><X aria-hidden="true" /></Dialog.Close>
                    </div>
                    <ol className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
                      {steps.map(({ icon: Icon, heading, body }, index) => (
                        <li key={heading} className="flex items-start gap-4">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{format.number(index + 1, 0)}</span>
                          <div><h4 className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-primary" aria-hidden="true" />{heading}</h4><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p></div>
                        </li>
                      ))}
                    </ol>
                    <div className="shrink-0 border-t bg-card p-5 sm:p-6">
                      <Link href="/signup" className={buttonVariants({ className: "min-h-12 w-full rounded-xl" })}>{t("Continue to sign up")}<ArrowRight className="rtl:rotate-180" aria-hidden="true" /></Link>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </Reveal>
      </AppContainer>
    </section>
  );
}
