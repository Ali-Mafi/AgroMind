"use client";

import { useEffect, useRef } from "react";
import styles from "../weather-background/weather-background.module.css";

export interface WeatherParticlesProps {
  kind: "rain" | "snow" | "hail" | "none";
  intensity: "light" | "moderate" | "heavy";
  lightning: boolean;
}

interface Particle { x: number; y: number; speed: number; drift: number; length: number; layer: number; phase: number }
const PROFILES = {
  light: { min: 36, max: 80, density: 10000, length: 13, speed: 650, opacity: .32 },
  moderate: { min: 80, max: 180, density: 6000, length: 21, speed: 900, opacity: .46 },
  heavy: { min: 150, max: 320, density: 3500, length: 29, speed: 1250, opacity: .62 },
};
const MAX_CANVAS_PIXELS = 1_400_000;

export function WeatherParticles({ kind, intensity, lightning }: WeatherParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!canvas || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const profile = PROFILES[intensity];
    const snow = kind === "snow";
    const hail = kind === "hail";
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame: number | null = null;
    let previous = 0;
    let elapsed = 0;
    let nextLightning = 10 + Math.random() * 10;
    let intersects = true;

    const reset = (particle: Particle, fill = false) => {
      const depth = .45 + Math.random() * .55;
      particle.x = Math.random() * (width + 100) - 40;
      particle.y = fill ? Math.random() * height : -40 - Math.random() * 60;
      particle.speed = (snow ? 50 + Math.random() * 65 : profile.speed * (.75 + Math.random() * .4)) * depth;
      particle.drift = (snow ? 12 : -110) * depth;
      particle.length = (snow ? 2 + Math.random() * 3 : hail ? 3 + Math.random() * 2 : profile.length) * depth;
      particle.layer = depth < .63 ? 0 : depth < .81 ? 1 : 2;
      particle.phase = Math.random() * Math.PI * 2;
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      // The canvas is bounded by the viewport and by a pixel budget, even on Retina displays.
      const ratio = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      const hardwareScale = (navigator.hardwareConcurrency || 8) <= 4 ? .85 : 1;
      const count = kind === "none" ? 0 : Math.round(Math.min(profile.max, Math.max(profile.min, width * height / profile.density)) * hardwareScale);
      particles = Array.from({ length: count }, () => {
        const particle: Particle = { x: 0, y: 0, speed: 0, drift: 0, length: 0, layer: 0, phase: 0 };
        reset(particle, true);
        return particle;
      });
    };

    const render = (time: number) => {
      if (document.hidden || reduced.matches || !intersects) { frame = null; return; }
      const delta = previous ? Math.min((time - previous) / 1000, .05) : 0;
      previous = time;
      elapsed += delta;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += (particle.drift + (snow ? Math.sin(elapsed + particle.phase) * 15 : 0)) * delta;
        particle.y += particle.speed * delta;
        if (particle.y > height + 40 || particle.x < -60 || particle.x > width + 80) reset(particle);
      }

      // Three batches instead of a DOM element or a separate stroke for every drop.
      for (let layer = 0; layer < 3; layer++) {
        context.beginPath();
        for (const particle of particles) {
          if (particle.layer !== layer) continue;
          if (snow || hail) {
            context.moveTo(particle.x + particle.length, particle.y);
            context.arc(particle.x, particle.y, particle.length, 0, Math.PI * 2);
          } else {
            context.moveTo(particle.x, particle.y);
            context.lineTo(particle.x + particle.drift / particle.speed * particle.length, particle.y + particle.length);
          }
        }
        const opacity = (snow || hail ? .58 : profile.opacity) * (.5 + layer * .25);
        if (snow || hail) { context.fillStyle = `rgba(229,242,255,${opacity})`; context.fill(); }
        else { context.strokeStyle = `rgba(220,239,253,${opacity})`; context.lineWidth = .8 + layer * .45; context.stroke(); }
      }

      if (lightning && elapsed > nextLightning) {
        const phase = elapsed - nextLightning;
        // A single gentle illumination, never a rapid strobe or a claimed live strike.
        if (phase < .9) {
          context.fillStyle = `rgba(214,231,255,${Math.sin(phase / .9 * Math.PI) * .1})`;
          context.fillRect(0, 0, width, height);
        } else nextLightning = elapsed + 12 + Math.random() * 12;
      }
      frame = requestAnimationFrame(render);
    };

    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const update = () => {
      if (document.hidden || reduced.matches || !intersects) {
        stop();
        if (reduced.matches) context.clearRect(0, 0, width, height);
      } else if (frame === null) { previous = 0; frame = requestAnimationFrame(render); }
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      intersects = entry?.isIntersecting ?? false;
      update();
    });
    resize();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    update();
    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, [kind, intensity, lightning]);

  return <canvas ref={ref} className={styles.particles} aria-hidden="true" />;
}
