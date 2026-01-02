"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Mic, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Clock, 
  FileText, 
  MoreHorizontal,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Mock Data ---

type ContentStatus = "draft" | "published" | "processing";

interface StreamItem {
  id: string;
  title: string;
  preview: string;
  status: ContentStatus;
  createdAt: Date;
  wordCount: number;
  readTime: number; // minutes
}

const MOCK_ITEMS: StreamItem[] = [
  {
    id: "1",
    title: "The Future of Voice Interfaces",
    preview: "We're moving beyond command-based interactions to conversational flows...",
    status: "published",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    wordCount: 850,
    readTime: 4,
  },
  {
    id: "2",
    title: "Why Minimalism Matters in UI",
    preview: "Reducing cognitive load isn't just about aesthetics, it's about...",
    status: "draft",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    wordCount: 420,
    readTime: 2,
  },
  {
    id: "3",
    title: "Reflections on Remote Work Culture",
    preview: "It's not just about Zoom calls, it's about async communication...",
    status: "published",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    wordCount: 1200,
    readTime: 6,
  },
  {
    id: "4",
    title: "Quick thoughts on AI agents",
    preview: "Agents need to be more than just chatbots...",
    status: "processing",
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    wordCount: 0,
    readTime: 0,
  },
];

const USER_NAME = "Enrique";

// --- Components ---

function Header() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex items-start justify-between mb-12">
      <div>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">
          {today}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Good morning, {USER_NAME}
        </h1>
      </div>
      
      {/* Minimal VoiceDNA Status */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Core: Calibrated</span>
      </div>
    </header>
  );
}

function StreamItemCard({ item }: { item: StreamItem }) {
  const isProcessing = item.status === "processing";

  return (
    <div className={cn(
      "group relative py-6 border-b border-border/40 transition-all hover:bg-muted/30 px-4 -mx-4 rounded-lg",
      isProcessing && "opacity-70"
    )}>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          ) : item.status === "published" ? (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </div>
        
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {isProcessing ? "Processing..." : (
            <>
              {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </>
          )}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-[85%]">
          {item.preview}
        </p>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        {item.status !== "processing" && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <FileText className="w-3 h-3" />
              <span>{item.wordCount} words</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Clock className="w-3 h-3" />
              <span>{item.readTime} min</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FloatingActionButton() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button 
        size="icon" 
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105",
          "bg-primary text-primary-foreground",
          "flex flex-col items-center justify-center gap-0.5"
        )}
      >
        <Mic className="w-6 h-6" />
        <span className="sr-only">New Recording</span>
      </Button>
    </div>
  );
}

// --- Main Page Component ---

export default function PrototypeDashboardPage() {
  // Sort items by date (newest first)
  const sortedItems = [...MOCK_ITEMS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-12 pb-24">
        <Header />

        <main className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recent Stream
            </h2>
            <Button variant="ghost" size="sm" className="text-xs h-7">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-1">
            {sortedItems.map((item) => (
              <StreamItemCard key={item.id} item={item} />
            ))}
          </div>

          {sortedItems.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p>No thoughts captured yet.</p>
            </div>
          )}
        </main>

        <FloatingActionButton />
      </div>
    </div>
  );
}

