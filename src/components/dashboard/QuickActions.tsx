"use client";

import Link from "next/link";
import { Mic, Timer, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "primary" | "secondary";
}

function QuickAction({
  href,
  icon,
  title,
  description,
  variant = "secondary",
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all",
        "min-h-[140px] touch-manipulation",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variant === "primary"
          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
          : "bg-card border-border hover:border-primary/50"
      )}
      aria-label={`${title}: ${description}`}
    >
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-xl mb-3",
          variant === "primary" ? "bg-primary-foreground/20" : "bg-primary/10"
        )}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-center">{title}</h3>
      <p
        className={cn(
          "text-sm text-center mt-1",
          variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {description}
      </p>
    </Link>
  );
}

/**
 * QuickActions Component
 *
 * Large, thumb-friendly buttons for starting voice sessions.
 * Designed for mobile-first use with touch targets ≥44px.
 */
export function QuickActions() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Start a Spark</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Thought Stream - Primary Action */}
        <QuickAction
          href="/record/quick"
          icon={<Mic className="h-7 w-7" />}
          title="Thought Stream"
          description="< 2 min"
          variant="primary"
        />

        {/* Deep Dive */}
        <QuickAction
          href="/record/guided"
          icon={<Timer className="h-7 w-7 text-primary" />}
          title="Deep Dive"
          description="2-5 min"
        />
      </div>

      {/* Secondary action - full width on mobile */}
      <Link
        href="/content"
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl border bg-card",
          "hover:border-primary/50 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Content Library</h3>
          <p className="text-sm text-muted-foreground">
            View your generated articles
          </p>
        </div>
      </Link>
    </div>
  );
}
