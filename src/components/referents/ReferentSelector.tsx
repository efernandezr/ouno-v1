"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReferentStyleProfile } from "@/types/referent";
import type { TonalAttributes } from "@/types/voiceDNA";
import { ReferentCard } from "./ReferentCard";

const MAX_REFERENTS = 3;

export interface ReferentWithSelection {
  id: string;
  name: string;
  slug: string;
  description: string;
  keyCharacteristics: string[];
  tonalAttributes: TonalAttributes;
  selected: boolean;
  weight: number;
}

export interface ReferentSelectorProps {
  selectedIds?: string[];
  maxSelections?: number;
  showTonalChart?: boolean;
  onChange?: (referents: ReferentWithSelection[]) => void;
  className?: string;
}

/**
 * ReferentSelector Component
 *
 * Grid of referent cards with multi-select functionality.
 * Fetches referent profiles from API and manages selection state.
 */
export function ReferentSelector({
  selectedIds = [],
  maxSelections = MAX_REFERENTS,
  showTonalChart = false,
  onChange,
  className,
}: ReferentSelectorProps) {
  const [referents, setReferents] = useState<ReferentWithSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load referent profiles
  useEffect(() => {
    async function loadReferents() {
      try {
        const response = await fetch("/api/referents");
        if (!response.ok) throw new Error("Failed to load referents");

        const data = await response.json();
        setReferents(
          data.referents.map((r: ReferentStyleProfile & { tonalAttributes: TonalAttributes }) => ({
            ...r,
            selected: selectedIds.includes(r.id),
            weight: selectedIds.includes(r.id) ? Math.floor(50 / selectedIds.length) : 0,
          }))
        );
      } catch (err) {
        console.error("Error loading referents:", err);
        setError("Failed to load style influences");
      } finally {
        setIsLoading(false);
      }
    }

    loadReferents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedReferents = referents.filter((r) => r.selected);
  const selectedCount = selectedReferents.length;
  const canSelectMore = selectedCount < maxSelections;

  const toggleReferent = useCallback(
    (id: string) => {
      setReferents((prev) => {
        const updated = prev.map((r) => {
          if (r.id !== id) return r;

          // If deselecting, reset weight
          if (r.selected) {
            return { ...r, selected: false, weight: 0 };
          }

          // If selecting and at max, don't allow
          const currentSelected = prev.filter((ref) => ref.selected);
          if (currentSelected.length >= maxSelections) return r;

          // Calculate default weight for new selection
          const newSelectedCount = currentSelected.length + 1;
          const defaultWeight = Math.floor(50 / newSelectedCount);

          return { ...r, selected: true, weight: defaultWeight };
        });

        // Recalculate weights for existing selections
        const newSelected = updated.filter((r) => r.selected);
        if (newSelected.length > 0) {
          const weightPerReferent = Math.floor(50 / newSelected.length);
          return updated.map((r) =>
            r.selected ? { ...r, weight: weightPerReferent } : r
          );
        }

        return updated;
      });
    },
    [maxSelections]
  );

  // Notify parent of changes
  useEffect(() => {
    if (onChange && !isLoading) {
      onChange(referents);
    }
  }, [referents, onChange, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading style influences...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection indicator */}
      <div className="flex justify-center gap-2" role="status" aria-live="polite">
        {Array.from({ length: maxSelections }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              i < selectedCount ? "bg-primary" : "bg-muted"
            )}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">
          {selectedCount} of {maxSelections} selected
        </span>
      </div>

      {/* Referent cards grid */}
      <div className="grid gap-4">
        {referents.map((referent) => (
          <ReferentCard
            key={referent.id}
            id={referent.id}
            name={referent.name}
            description={referent.description}
            keyCharacteristics={referent.keyCharacteristics}
            tonalAttributes={referent.tonalAttributes}
            selected={referent.selected}
            disabled={!referent.selected && !canSelectMore}
            onToggle={toggleReferent}
            showTonalChart={showTonalChart}
          />
        ))}
      </div>
    </div>
  );
}
