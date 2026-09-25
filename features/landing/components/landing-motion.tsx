"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "../landing.module.css";

type MotionProps = { children: ReactNode; className?: string };

export function Reveal({ children, className = "", delay = 0 }: MotionProps & { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    // SSR and the first client render are always visible. Only enhance content
    // below the initial viewport; never move/hide the already-painted hero.
    if (!element || !window.IntersectionObserver || !element.animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      element.getBoundingClientRect().top < window.innerHeight) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      animation = element.animate(
        [{ transform: "translateY(16px)" }, { transform: "translateY(0)" }],
        { duration: 800, delay: delay * 1000, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(element);
    return () => { observer.disconnect(); animation?.cancel(); };
  }, [delay]);
  return (
    <div ref={ref} className={`${styles.reveal} ${className}`}>
      {children}
    </div>
  );
}

export function Float({ children, className = "" }: MotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.IntersectionObserver) return;
    let visible = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      element.dataset.active = String(visible && !document.hidden && !reduced.matches);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return <div ref={ref} className={`${styles.floating} ${className}`}>{children}</div>;
}
