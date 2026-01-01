"use client";

import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    container: "w-6 h-6",
    icon: "h-3.5 w-3.5",
    text: "text-lg",
  },
  md: {
    container: "w-8 h-8",
    icon: "h-5 w-5",
    text: "text-2xl",
  },
  lg: {
    container: "w-10 h-10",
    icon: "h-6 w-6",
    text: "text-3xl",
  },
};

interface LogoMarkProps {
  size?: keyof typeof sizes;
  className?: string;
}

/**
 * Logo mark (icon only) - placeholder for future "Variable Circle" logo.
 * When the final logo SVG is ready, replace the Mic icon with the SVG here.
 */
export function LogoMark({ size = "md", className }: LogoMarkProps) {
  const sizeConfig = sizes[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-primary/10",
        sizeConfig.container,
        className
      )}
      aria-hidden="true"
    >
      <Mic className={cn("text-primary", sizeConfig.icon)} />
    </div>
  );
}

interface LogoTextProps {
  size?: keyof typeof sizes;
  className?: string;
}

/**
 * Logo text ("Ouno") with gradient styling.
 */
export function LogoText({ size = "md", className }: LogoTextProps) {
  const sizeConfig = sizes[size];

  return (
    <span
      className={cn(
        "font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent",
        sizeConfig.text,
        className
      )}
    >
      Ouno
    </span>
  );
}

interface OunoLogoProps {
  size?: keyof typeof sizes;
  showText?: boolean;
  className?: string;
}

/**
 * Full Ouno logo with mark and text.
 * Use showText={false} for icon-only contexts (e.g., favicons, mobile nav).
 */
export function OunoLogo({
  size = "md",
  showText = true,
  className,
}: OunoLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showText && <LogoText size={size} />}
    </div>
  );
}
