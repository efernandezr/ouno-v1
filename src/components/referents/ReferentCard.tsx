"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TonalAttributes } from "@/types/voiceDNA";

export interface ReferentCardProps {
  id: string;
  name: string;
  description: string;
  keyCharacteristics: string[];
  tonalAttributes?: TonalAttributes;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: (id: string) => void;
  showTonalChart?: boolean;
}

/**
 * ReferentCard Component
 *
 * Displays a referent style profile with selection toggle.
 * Used in both onboarding and settings pages.
 */
export function ReferentCard({
  id,
  name,
  description,
  keyCharacteristics,
  tonalAttributes,
  selected = false,
  disabled = false,
  onToggle,
  showTonalChart = false,
}: ReferentCardProps) {
  const handleClick = () => {
    if (!disabled && onToggle) {
      onToggle(id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} ${name} as style influence`}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected ? "border-primary bg-primary/5" : "border-border",
        disabled && !selected && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
            "transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground"
          )}
          aria-hidden="true"
        >
          {selected && <Check className="h-3 w-3" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-1">{description}</p>

          {/* Key characteristics */}
          <div className="flex flex-wrap gap-1 mt-2">
            {keyCharacteristics.slice(0, 3).map((trait) => (
              <Badge key={trait} variant="secondary" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>

          {/* Tonal attributes visualization */}
          {showTonalChart && tonalAttributes && (
            <div className="mt-3 pt-3 border-t">
              <TonalChart attributes={tonalAttributes} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Simple horizontal bar chart for tonal attributes
 */
function TonalChart({ attributes }: { attributes: TonalAttributes }) {
  const bars = [
    { label: "Warmth", value: attributes.warmth },
    { label: "Authority", value: attributes.authority },
    { label: "Humor", value: attributes.humor },
    { label: "Directness", value: attributes.directness },
    { label: "Empathy", value: attributes.empathy },
  ];

  return (
    <div className="space-y-1.5">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2 text-xs">
          <span className="w-16 text-muted-foreground">{bar.label}</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all"
              style={{ width: `${bar.value * 100}%` }}
              role="progressbar"
              aria-valuenow={Math.round(bar.value * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${bar.label}: ${Math.round(bar.value * 100)}%`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
