"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    width: 80,
    height: 24,
  },
  md: {
    width: 120,
    height: 36,
  },
  lg: {
    width: 160,
    height: 48,
  },
};

interface OunoLogoProps {
  size?: keyof typeof sizes;
  className?: string;
}

/**
 * Ouno logo with automatic light/dark mode switching.
 * Uses PNG logos from /public/brand/
 */
export function OunoLogo({ size = "md", className }: OunoLogoProps) {
  const { width, height } = sizes[size];

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {/* Light mode: show dark logo */}
      <Image
        src="/brand/logo-dark.png"
        alt="Ouno"
        width={width}
        height={height}
        className="dark:hidden object-contain"
        priority
      />
      {/* Dark mode: show light logo */}
      <Image
        src="/brand/logo-light.png"
        alt="Ouno"
        width={width}
        height={height}
        className="hidden dark:block object-contain"
        priority
      />
    </div>
  );
}

// Legacy exports for backwards compatibility (deprecated)
/** @deprecated Use OunoLogo instead */
export const LogoMark = OunoLogo;
/** @deprecated Use OunoLogo instead */
export const LogoText = () => null;
