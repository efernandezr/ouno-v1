"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Client-side only check using useSyncExternalStore (hydration-safe)
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client value
    () => false  // Server value
  );
}

interface AudioVisualizerProps {
  audioLevel: number; // 0-100
  isRecording: boolean;
  className?: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Default fallback colors (blue-500 and gray)
const DEFAULT_COLORS = {
  primary: { r: 59, g: 130, b: 246 },
  muted: { r: 128, g: 128, b: 128 },
};

/**
 * Convert CSS variable to RGB that Canvas can understand.
 * Tailwind v4 uses OKLCH/LAB colors which Canvas doesn't support.
 * We create a temporary element and let the browser convert to RGB.
 */
function cssVarToRgb(cssVar: string): RgbColor {
  // Create a temporary element to compute the color
  const temp = document.createElement("div");
  temp.style.color = `var(${cssVar})`;
  temp.style.display = "none";
  document.body.appendChild(temp);

  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);

  // Parse rgb(r, g, b) or rgba(r, g, b, a) format
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match && match[1] && match[2] && match[3]) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }

  return { r: 128, g: 128, b: 128 };
}

function rgbToString(rgb: RgbColor, opacity: number = 1): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * AudioVisualizer Component
 *
 * Displays a waveform-style visualization based on audio level.
 * Uses Canvas API for smooth animations.
 */
export function AudioVisualizer({
  audioLevel,
  isRecording,
  className,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>(Array(20).fill(0));
  const colorsRef = useRef<{ primary: RgbColor; muted: RgbColor }>(DEFAULT_COLORS);

  // Hydration-safe mounted check
  const mounted = useIsMounted();

  // Compute actual colors from CSS variables on client
  useEffect(() => {
    if (mounted) {
      colorsRef.current = {
        primary: cssVarToRgb("--primary"),
        muted: cssVarToRgb("--muted-foreground"),
      };
    }
  }, [mounted]);

  // Single animation loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      const c = colorsRef.current;
      if (!c) return;

      // Get actual dimensions
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const barCount = barsRef.current.length;
      const barWidth = width / barCount - 4;
      const maxBarHeight = height * 0.8;

      // Update bar heights
      const bars = barsRef.current;
      if (isRecording) {
        for (let i = 0; i < barCount; i++) {
          const randomFactor = 0.5 + Math.random() * 0.5;
          const targetHeight = (audioLevel / 100) * maxBarHeight * randomFactor;
          const currentHeight = bars[i] ?? 0;
          bars[i] = currentHeight + (targetHeight - currentHeight) * 0.3;
        }
      } else {
        for (let i = 0; i < barCount; i++) {
          bars[i] = (bars[i] ?? 0) * 0.9;
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.max(4, bars[i] ?? 0);
        const x = i * (barWidth + 4) + 2;
        const y = (height - barHeight) / 2;

        // Create gradient with RGBA colors (Canvas-compatible)
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        if (isRecording) {
          gradient.addColorStop(0, rgbToString(c.primary, 1));
          gradient.addColorStop(1, rgbToString(c.primary, 0.6));
        } else {
          gradient.addColorStop(0, rgbToString(c.muted, 0.3));
          gradient.addColorStop(1, rgbToString(c.muted, 0.1));
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [audioLevel, isRecording]);

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
      {isRecording && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">Recording</span>
        </div>
      )}
    </div>
  );
}
