"use client";
import { useEffect, type RefObject } from "react";
import { composerKeyboardInset } from "../lib/composer-layout";

export function useComposerLayout(
  page: RefObject<HTMLElement | null>,
  composer: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const container = composer.current;
    const root = page.current;
    if (!container || !root) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const inset = composerKeyboardInset(
          window.innerHeight,
          viewport,
          container.contains(document.activeElement),
        );
        container.style.setProperty("--composer-keyboard-inset", `${inset}px`);
        root.style.setProperty(
          "--composer-height",
          `${container.offsetHeight}px`,
        );
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(container);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, [page, composer]);
}
