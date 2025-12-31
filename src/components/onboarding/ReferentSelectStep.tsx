"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Users, Check, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ReferentStyleProfile } from "@/types/referent";
import type { ReferentInfluence, ReferentInfluences } from "@/types/voiceDNA";

interface ReferentSelectStepProps {
  onComplete: () => void;
  isProcessing: boolean;
}

interface ReferentWithSelection extends ReferentStyleProfile {
  selected: boolean;
  weight: number;
}

const MAX_REFERENTS = 3;
const MIN_USER_WEIGHT = 50;

/**
 * ReferentSelectStep Component
 *
 * Final onboarding step where users select writing style influences
 * from pre-built referent profiles.
 */
export function ReferentSelectStep({
  onComplete,
  isProcessing,
}: ReferentSelectStepProps) {
  const [referents, setReferents] = useState<ReferentWithSelection[]>([]);
  const [userWeight, setUserWeight] = useState(80);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showWeights, setShowWeights] = useState(false);

  // Load referent profiles
  useEffect(() => {
    async function loadReferents() {
      try {
        const response = await fetch("/api/referents");
        if (!response.ok) throw new Error("Failed to load referents");

        const data = await response.json();
        setReferents(
          data.referents.map((r: ReferentStyleProfile) => ({
            ...r,
            selected: false,
            weight: 0,
          }))
        );
      } catch (error) {
        console.error("Error loading referents:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReferents();
  }, []);

  // Memoize selected referents to prevent unnecessary recalculations
  const selectedReferents = useMemo(
    () => referents.filter((r) => r.selected),
    [referents]
  );
  const selectedCount = selectedReferents.length;
  const canSelectMore = selectedCount < MAX_REFERENTS;

  const toggleReferent = useCallback(
    (id: string) => {
      setReferents((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;

          // If deselecting, reset weight
          if (r.selected) {
            return { ...r, selected: false, weight: 0 };
          }

          // If selecting and at max, don't allow
          if (!canSelectMore) return r;

          // Calculate default weight for new selection
          const newSelectedCount = selectedReferents.length + 1;
          const remainingWeight = 100 - userWeight;
          const defaultWeight = Math.floor(remainingWeight / newSelectedCount);

          return { ...r, selected: true, weight: defaultWeight };
        })
      );
    },
    [canSelectMore, selectedReferents.length, userWeight]
  );

  // Track previous userWeight to detect actual changes
  const prevUserWeightRef = useRef(userWeight);

  // Recalculate weights when user weight changes
  useEffect(() => {
    if (selectedCount === 0) return;

    // Only update if userWeight actually changed (not due to selection changes)
    if (prevUserWeightRef.current === userWeight) return;
    prevUserWeightRef.current = userWeight;

    const remainingWeight = 100 - userWeight;
    const weightPerReferent = Math.floor(remainingWeight / selectedCount);

    setReferents((prev) =>
      prev.map((r) => {
        if (!r.selected) return r;
        // Only update if weight actually differs
        if (r.weight === weightPerReferent) return r;
        return { ...r, weight: weightPerReferent };
      })
    );
  }, [userWeight, selectedCount]);

  const handleComplete = useCallback(async () => {
    setIsSaving(true);

    try {
      // Build referent influences object
      const influences: ReferentInfluences = {
        userWeight,
        referents: selectedReferents.map(
          (r): ReferentInfluence => ({
            id: r.id,
            name: r.name,
            weight: r.weight,
            activeTraits: r.keyCharacteristics.slice(0, 3),
          })
        ),
      };

      // Save to Voice DNA
      await fetch("/api/voice-dna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referentInfluences: influences }),
      });

      onComplete();
    } catch (error) {
      console.error("Error saving referent influences:", error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedReferents, userWeight, onComplete]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading style influences...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Weight adjustment view
  if (showWeights && selectedReferents.length > 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Adjust Influence Levels</CardTitle>
          <CardDescription>
            Your voice is always the foundation. Adjust how much each referent
            influences your writing style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User voice slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Your Voice</span>
              <Badge>{userWeight}%</Badge>
            </div>
            <Slider
              value={[userWeight]}
              onValueChange={(values) => setUserWeight(Math.max(MIN_USER_WEIGHT, values[0] ?? MIN_USER_WEIGHT))}
              min={MIN_USER_WEIGHT}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 50% - your voice is always primary
            </p>
          </div>

          {/* Referent sliders */}
          {selectedReferents.map((referent) => (
            <div key={referent.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{referent.name}</span>
                <Badge variant="outline">{referent.weight}%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {referent.description}
              </p>
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowWeights(false)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={isSaving || isProcessing}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main selection view
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Choose Style Influences</CardTitle>
        <CardDescription className="text-base">
          Select up to {MAX_REFERENTS} writing styles that inspire you. These
          will subtly influence your generated content while keeping your voice
          primary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection indicator */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: MAX_REFERENTS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                i < selectedReferents.length ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Referent cards grid */}
        <div className="grid gap-4">
          {referents.map((referent) => (
            <button
              key={referent.id}
              onClick={() => toggleReferent(referent.id)}
              disabled={!referent.selected && !canSelectMore}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                referent.selected
                  ? "border-primary bg-primary/5"
                  : "border-border",
                !referent.selected && !canSelectMore && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
                    referent.selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  )}
                >
                  {referent.selected && <Check className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{referent.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {referent.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {referent.keyCharacteristics.slice(0, 3).map((trait) => (
                      <Badge
                        key={trait}
                        variant="secondary"
                        className="text-xs"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          {selectedReferents.length > 0 ? (
            <>
              <Button onClick={() => setShowWeights(true)} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Adjust Influence Levels
              </Button>
              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={isSaving || isProcessing}
              >
                Skip adjustment & complete
              </Button>
            </>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSaving || isProcessing}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Skip & Complete Setup"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
