"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import type { ReferentInfluence, ReferentInfluences } from "@/types/voiceDNA";

const MIN_USER_WEIGHT = 50;
const MAX_USER_WEIGHT = 100;

export interface BlendSlidersProps {
  selectedReferents: Array<{
    id: string;
    name: string;
    description?: string;
    weight: number;
  }>;
  userWeight?: number;
  onChange?: (influences: ReferentInfluences) => void;
  className?: string;
}

/**
 * BlendSliders Component
 *
 * Sliders for adjusting the balance between user voice and referent influences.
 * User voice is always primary (minimum 50%).
 */
export function BlendSliders({
  selectedReferents,
  userWeight: initialUserWeight = 80,
  onChange,
  className,
}: BlendSlidersProps) {
  const [userWeight, setUserWeight] = useState(
    Math.max(MIN_USER_WEIGHT, Math.min(MAX_USER_WEIGHT, initialUserWeight))
  );

  // Calculate referent weights based on user weight - no useState needed
  const referentWeights = useMemo(() => {
    if (selectedReferents.length === 0) {
      return {};
    }
    const remainingWeight = 100 - userWeight;
    const weightPerReferent = Math.floor(remainingWeight / selectedReferents.length);

    const weights: Record<string, number> = {};
    selectedReferents.forEach((ref) => {
      weights[ref.id] = weightPerReferent;
    });
    return weights;
  }, [userWeight, selectedReferents]);

  // Notify parent of changes
  useEffect(() => {
    if (!onChange) return;

    const influences: ReferentInfluences = {
      userWeight,
      referents: selectedReferents.map(
        (ref): ReferentInfluence => ({
          id: ref.id,
          name: ref.name,
          weight: referentWeights[ref.id] || 0,
          activeTraits: [],
        })
      ),
    };

    onChange(influences);
  }, [onChange, userWeight, selectedReferents, referentWeights]);

  const handleUserWeightChange = useCallback((values: number[]) => {
    const newWeight = Math.max(MIN_USER_WEIGHT, values[0] ?? MIN_USER_WEIGHT);
    setUserWeight(newWeight);
  }, []);

  if (selectedReferents.length === 0) {
    return (
      <div className={className}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Your Voice</span>
            <Badge>100%</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Select style influences to enable blending controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* User voice slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Your Voice</span>
            <Badge>{userWeight}%</Badge>
          </div>
          <Slider
            value={[userWeight]}
            onValueChange={handleUserWeightChange}
            min={MIN_USER_WEIGHT}
            max={MAX_USER_WEIGHT}
            step={5}
            aria-label="Your voice percentage"
          />
          <p className="text-xs text-muted-foreground">
            Minimum 50% — your voice is always primary
          </p>
        </div>

        {/* Referent sliders (read-only, calculated from remaining) */}
        {selectedReferents.map((referent) => {
          const weight = referentWeights[referent.id] || 0;
          return (
            <div key={referent.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{referent.name}</span>
                <Badge variant="outline">{weight}%</Badge>
              </div>
              {referent.description && (
                <p className="text-xs text-muted-foreground">
                  {referent.description}
                </p>
              )}
              {/* Visual indicator bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/40 rounded-full transition-all"
                  style={{ width: `${weight * 2}%` }}
                  role="progressbar"
                  aria-valuenow={weight}
                  aria-valuemin={0}
                  aria-valuemax={50}
                  aria-label={`${referent.name} influence: ${weight}%`}
                />
              </div>
            </div>
          );
        })}

        {/* Total indicator */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total blend</span>
            <span className="font-medium">
              {userWeight + Object.values(referentWeights).reduce((a, b) => a + b, 0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
