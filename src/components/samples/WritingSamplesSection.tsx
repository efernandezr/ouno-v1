"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UploadedSample } from "@/hooks/useSampleUpload";
import { SampleCard, type Sample } from "./SampleCard";
import { SampleUploadDialog } from "./SampleUploadDialog";

interface WritingSamplesSectionProps {
  onSamplesChange?: () => void;
}

/**
 * WritingSamplesSection Component
 *
 * Main section for displaying and managing writing samples.
 * Shows list of samples, add button, and handles CRUD operations.
 */
export function WritingSamplesSection({
  onSamplesChange,
}: WritingSamplesSectionProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSamples = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/samples");

      if (!response.ok) {
        throw new Error("Failed to fetch samples");
      }

      const data = await response.json();
      setSamples(data.samples || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/samples/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to delete sample");
        }

        setSamples((prev) => prev.filter((s) => s.id !== id));
        toast.success("Writing sample deleted");
        onSamplesChange?.();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete sample");
        throw err;
      }
    },
    [onSamplesChange]
  );

  const handleUploadSuccess = useCallback(
    (_sample: UploadedSample) => {
      // Refresh the full list to get complete sample data
      fetchSamples();
      toast.success("Writing sample added");
      onSamplesChange?.();
    },
    [fetchSamples, onSamplesChange]
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Failed to load samples</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSamples}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {samples.length === 0
            ? "No samples yet"
            : `${samples.length} sample${samples.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Sample
        </Button>
      </div>

      {/* Empty state */}
      {samples.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium mb-1">No writing samples</h4>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Add samples of your existing writing to help us better match your
            style in generated content.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Your First Sample
          </Button>
        </div>
      )}

      {/* Sample list */}
      {samples.length > 0 && (
        <div className="space-y-2">
          {samples.map((sample) => (
            <SampleCard
              key={sample.id}
              sample={sample}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <SampleUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
