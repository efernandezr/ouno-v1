"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Users,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/components/auth/user-profile";
import {
  ReferentSelector,
  BlendSliders,
  type ReferentWithSelection,
} from "@/components/referents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import type { ReferentInfluences, VoiceDNA } from "@/types/voiceDNA";

export default function ReferentSettingsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [voiceDNA, setVoiceDNA] = useState<VoiceDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedReferents, setSelectedReferents] = useState<ReferentWithSelection[]>([]);
  const [showBlendSliders, setShowBlendSliders] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current Voice DNA to get existing referent selections
  const fetchVoiceDNA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/voice-dna");
      if (!response.ok) {
        throw new Error("Failed to fetch Voice DNA");
      }
      const result = await response.json();
      setVoiceDNA(result.voiceDNA);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchVoiceDNA();
    }
  }, [session, fetchVoiceDNA]);

  // Handle referent selection changes
  const handleReferentChange = useCallback((referents: ReferentWithSelection[]) => {
    setSelectedReferents(referents);
    setHasChanges(true);
  }, []);

  // Handle blend slider changes
  const handleBlendChange = useCallback((influences: ReferentInfluences) => {
    // Update selected referents with new weights
    setSelectedReferents((prev) =>
      prev.map((r) => {
        const updated = influences.referents.find((inf) => inf.id === r.id);
        return updated ? { ...r, weight: updated.weight } : r;
      })
    );
    setHasChanges(true);
  }, []);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const selected = selectedReferents.filter((r) => r.selected);
      const totalReferentWeight = selected.reduce((sum, r) => sum + r.weight, 0);
      const userWeight = 100 - totalReferentWeight;

      const influences: ReferentInfluences = {
        userWeight: Math.max(50, userWeight),
        referents: selected.map((r) => ({
          id: r.id,
          name: r.name,
          weight: r.weight,
          activeTraits: r.keyCharacteristics.slice(0, 3),
        })),
      };

      const response = await fetch("/api/voice-dna", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referentInfluences: influences }),
      });

      if (!response.ok) {
        throw new Error("Failed to save referent preferences");
      }

      toast.success("Style influences saved successfully");
      setHasChanges(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (sessionPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to manage your style influences
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  const selected = selectedReferents.filter((r) => r.selected);

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.push("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Style Influences
              </h1>
              <p className="text-muted-foreground mt-2">
                Choose writing styles to blend with your voice
              </p>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Failed to load settings</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchVoiceDNA}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div className="space-y-6">
            {/* Explanation Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <p className="text-sm">
                  <strong>How it works:</strong> Your voice is always the foundation
                  (minimum 50%). Style influences subtly enhance your content with
                  techniques from successful writers without losing your authentic
                  voice.
                </p>
              </CardContent>
            </Card>

            {/* Blend Sliders (if selections made) */}
            {showBlendSliders && selected.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Adjust Influence Levels
                  </CardTitle>
                  <CardDescription>
                    Fine-tune how much each style influences your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlendSliders
                    selectedReferents={selected.map((r) => ({
                      id: r.id,
                      name: r.name,
                      description: r.description,
                      weight: r.weight,
                    }))}
                    userWeight={voiceDNA?.referentInfluences?.userWeight ?? 80}
                    onChange={handleBlendChange}
                  />
                  <div className="mt-6 pt-4 border-t flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowBlendSliders(false)}
                    >
                      Back to Selection
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Referent Selection */
              <Card>
                <CardHeader>
                  <CardTitle>Choose Style Influences</CardTitle>
                  <CardDescription>
                    Select up to 3 writing styles that inspire you. These will
                    subtly influence your generated content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ReferentSelector
                    selectedIds={
                      voiceDNA?.referentInfluences?.referents.map((r) => r.id) ?? []
                    }
                    maxSelections={3}
                    showTonalChart
                    onChange={handleReferentChange}
                  />

                  {selected.length > 0 && (
                    <div className="pt-4 border-t">
                      <Button
                        className="w-full"
                        onClick={() => setShowBlendSliders(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Adjust Influence Levels ({selected.length} selected)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Influences Summary */}
            {voiceDNA?.referentInfluences &&
              voiceDNA.referentInfluences.referents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Configuration</CardTitle>
                    <CardDescription>
                      Your current style blend saved in Voice DNA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                        <span className="font-medium">Your Voice</span>
                        <span className="text-lg font-bold">
                          {voiceDNA.referentInfluences.userWeight}%
                        </span>
                      </div>
                      {voiceDNA.referentInfluences.referents.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <span className="font-medium">{ref.name}</span>
                            {ref.activeTraits.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {ref.activeTraits.slice(0, 2).join(" • ")}
                              </p>
                            )}
                          </div>
                          <span className="text-lg font-bold">{ref.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
