"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  wordCount: number;
  readTimeMinutes: number;
  status: "draft" | "final" | "published";
  createdAt: string;
}

/**
 * RecentContent Component
 *
 * Displays the user's most recent generated content.
 * Shows up to 5 items on dashboard with link to full library.
 */
export function RecentContent() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch("/api/content?limit=5");
        if (!response.ok) throw new Error("Failed to fetch content");

        const data = await response.json();
        setContent(data.content || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Content</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Content</h2>
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Content</h2>
        <div className="p-6 rounded-xl border border-dashed text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No content generated yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start a recording session to create your first article
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Content</h2>
        <Link
          href="/content"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {content.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/content/${item.id}`}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border bg-card",
        "hover:border-primary/50 transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <FileText className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium truncate">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{item.wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.readTimeMinutes} min read
          </span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}

function StatusBadge({ status }: { status: ContentItem["status"] }) {
  const variants: Record<ContentItem["status"], { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-yellow-500/10 text-yellow-600" },
    final: { label: "Final", className: "bg-green-500/10 text-green-600" },
    published: { label: "Published", className: "bg-blue-500/10 text-blue-600" },
  };

  const { label, className } = variants[status];

  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}
