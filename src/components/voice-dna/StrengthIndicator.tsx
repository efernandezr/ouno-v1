"use client";

import { cn } from "@/lib/utils";

interface StrengthIndicatorProps {
  score: number; // 0-100
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Get calibration level based on score
 */
function getCalibrationLevel(score: number): {
  level: "low" | "medium" | "high";
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 70) {
    return {
      level: "high",
      label: "Well Calibrated",
      color: "text-success",
      bgColor: "bg-success",
    };
  }
  if (score >= 30) {
    return {
      level: "medium",
      label: "Getting There",
      color: "text-warning",
      bgColor: "bg-warning",
    };
  }
  return {
    level: "low",
    label: "Needs More Data",
    color: "text-destructive",
    bgColor: "bg-destructive",
  };
}

/**
 * StrengthIndicator - Visual calibration score display
 *
 * Shows the Voice DNA calibration score as a color-coded progress bar
 * with optional label and percentage display.
 *
 * Color coding:
 * - Red (< 30%): Needs more recordings/calibration
 * - Yellow (30-70%): Making progress
 * - Green (> 70%): Well calibrated
 */
export function StrengthIndicator({
  score,
  showLabel = true,
  showPercentage = true,
  size = "md",
  className,
}: StrengthIndicatorProps) {
  const calibration = getCalibrationLevel(score);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Label and percentage row */}
      {(showLabel || showPercentage) && (
        <div
          className={cn(
            "flex items-center justify-between mb-1",
            textSizeClasses[size]
          )}
        >
          {showLabel && (
            <span className={cn("font-medium", calibration.color)}>
              {calibration.label}
            </span>
          )}
          {showPercentage && (
            <span className="text-muted-foreground">{score}%</span>
          )}
        </div>
      )}

      {/* Progress bar with custom color */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-primary/20",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            calibration.bgColor
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Compact circular indicator for tight spaces
 */
export function StrengthIndicatorCircle({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const calibration = getCalibrationLevel(score);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  const strokeWidth = size === "sm" ? 3 : size === "md" ? 4 : 5;
  const radius = size === "sm" ? 12 : size === "md" ? 18 : 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {/* Background circle */}
      <svg className="absolute w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-500 ease-out",
            calibration.level === "high"
              ? "stroke-success"
              : calibration.level === "medium"
                ? "stroke-warning"
                : "stroke-destructive"
          )}
        />
      </svg>
      {/* Score text */}
      <span className={cn("font-semibold z-10", calibration.color)}>
        {score}
      </span>
    </div>
  );
}

/**
 * Mini badge-style indicator
 */
export function StrengthBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const calibration = getCalibrationLevel(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        calibration.level === "high"
          ? "bg-success/10 text-success"
          : calibration.level === "medium"
            ? "bg-warning/10 text-warning"
            : "bg-destructive/10 text-destructive",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          calibration.level === "high"
            ? "bg-success"
            : calibration.level === "medium"
              ? "bg-warning"
              : "bg-destructive"
        )}
      />
      {score}%
    </span>
  );
}
