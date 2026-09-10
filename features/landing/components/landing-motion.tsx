"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "../landing.module.css";

type MotionProps = { children: ReactNode; className?: string };

export function Reveal({ children, className = "", delay = 0 }: MotionProps & { delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`${styles.reveal} ${className}`}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Float({ children, className = "" }: MotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  useEffect(() => {
    const update = () => {
      if (ref.current) ref.current.dataset.active = String(visible && !document.hidden);
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [visible]);
  return <div ref={ref} className={`${styles.floating} ${className}`}>{children}</div>;
}
