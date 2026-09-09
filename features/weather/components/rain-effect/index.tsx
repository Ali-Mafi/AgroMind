"use client";

import { useEffect, useRef } from "react";

export type RainIntensity = "light" | "moderate" | "heavy";

interface RainEffectProps {
  intensity: RainIntensity;
  isNight: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  drift: number;
  layer: 0 | 1 | 2;
}

interface RainProfile {
  densityDivisor: number;
  minDrops: number;
  maxDrops: number;
  length: [number, number];
  speed: [number, number];
  opacity: [number, number];
  wind: number;
}

const RAIN_PROFILES: Record<RainIntensity, RainProfile> = {
  light: {
    densityDivisor: 16_000,
    minDrops: 22,
    maxDrops: 50,
    length: [10, 17],
    speed: [520, 760],
    opacity: [0.18, 0.3],
    wind: -55,
  },
  moderate: {
    densityDivisor: 8_000,
    minDrops: 40,
    maxDrops: 100,
    length: [13, 24],
    speed: [680, 980],
    opacity: [0.24, 0.42],
    wind: -78,
  },
  heavy: {
    densityDivisor: 4_500,
    minDrops: 70,
    maxDrops: 160,
    length: [18, 34],
    speed: [850, 1_250],
    opacity: [0.32, 0.58],
    wind: -100,
  },
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createDrop(
  width: number,
  height: number,
  profile: RainProfile,
  fillViewport: boolean,
): RainDrop {
  const depth = randomBetween(0.45, 1);
  const layer =
    depth < 0.64
      ? 0
      : depth < 0.82
        ? 1
        : 2;

  return {
    x: randomBetween(-60, width + 60),
    y: fillViewport
      ? randomBetween(-height * 0.1, height)
      : randomBetween(-120, -20),
    length: randomBetween(...profile.length) * depth,
    speed: randomBetween(...profile.speed) * depth,
    drift: profile.wind * depth,
    layer,
  };
}

export function RainEffect({ intensity, isNight }: RainEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!canvas || !context) return;

    const profile = RAIN_PROFILES[intensity];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let width = 0;
    let height = 0;
    let drops: RainDrop[] = [];
    let frameId: number | null = null;
    let previousTime = 0;
    let isIntersecting = true;

    const populateDrops = () => {
      const hardwareScale =
        (navigator.hardwareConcurrency ?? 8) <= 4 ? 0.72 : 1;
      const requestedCount = Math.round(
        (width * height) / profile.densityDivisor,
      );
      const count = Math.round(
        Math.min(
          profile.maxDrops,
          Math.max(profile.minDrops, requestedCount),
        ) * hardwareScale,
      );

      drops = Array.from({ length: count }, () =>
        createDrop(width, height, profile, true),
      );
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;

      if (!width || !height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.lineCap = "round";
      populateDrops();
    };

    const resetDrop = (drop: RainDrop) => {
      Object.assign(
        drop,
        createDrop(width, height, profile, false),
      );
    };

    const render = (time: number) => {
      if (document.hidden || !isIntersecting || reducedMotion.matches) {
        frameId = null;
        return;
      }

      const delta = previousTime
        ? Math.min((time - previousTime) / 1_000, 0.034)
        : 0;
      previousTime = time;

      context.clearRect(0, 0, width, height);

      for (const drop of drops) {
        drop.x += drop.drift * delta;
        drop.y += drop.speed * delta;

        if (drop.y > height + drop.length || drop.x < -80) {
          resetDrop(drop);
        }
      }

      const layers = [0, 1, 2] as const;

      for (const layer of layers) {
        context.beginPath();

        for (const drop of drops) {
          if (drop.layer !== layer) continue;

          context.moveTo(drop.x, drop.y);
          context.lineTo(
            drop.x + (drop.drift / drop.speed) * drop.length,
            drop.y + drop.length,
          );
        }

        const layerProgress = (layer + 1) / layers.length;
        const opacity =
          profile.opacity[0] +
          (profile.opacity[1] - profile.opacity[0]) * layerProgress;

        context.lineWidth = 0.65 + layer * 0.35;
        context.strokeStyle = isNight
          ? `rgba(213, 231, 255, ${opacity})`
          : `rgba(63, 95, 119, ${opacity})`;
        context.stroke();
      }

      frameId = window.requestAnimationFrame(render);
    };

    const stop = () => {
      if (frameId === null) return;
      window.cancelAnimationFrame(frameId);
      frameId = null;
    };

    const start = () => {
      if (
        frameId !== null ||
        document.hidden ||
        !isIntersecting ||
        reducedMotion.matches
      ) {
        return;
      }

      previousTime = 0;
      frameId = window.requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const handleMotionPreference = () => {
      if (!reducedMotion.matches) {
        start();
        return;
      }

      stop();
      context.clearRect(0, 0, width, height);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        if (isIntersecting) start();
        else stop();
      },
      { threshold: 0.01 },
    );

    resizeCanvas();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionPreference);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, [intensity, isNight]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        contain: "strict",
        transform: "translateZ(0)",
      }}
      aria-hidden="true"
    />
  );
}
