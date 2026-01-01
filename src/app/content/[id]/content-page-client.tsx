"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, MessageSquare, Sparkles } from "lucide-react";
import { ContentActions } from "@/components/content/ContentActions";
import { ContentEditor } from "@/components/content/ContentEditor";
import { RefineChat } from "@/components/content/RefineChat";
import { VoiceRefine } from "@/components/content/VoiceRefine";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContentStatus } from "@/types/content";

interface SerializedContent {
  id: string;
  userId: string;
  sessionId: string;
  title: string;
  content: string;
  wordCount: number;
  readTimeMinutes: number;
  status: ContentStatus;
  version: number;
  parentVersionId: string | null;
  modelUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SerializedSession {
  id: string;
  mode: "quick" | "guided";
  durationSeconds: number | null;
  createdAt: string;
}

interface ContentPageClientProps {
  content: SerializedContent;
  voiceSession: SerializedSession | null;
}

export function ContentPageClient({
  content: initialContent,
  voiceSession,
}: ContentPageClientProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<"view" | "voice" | "text">("view");

  const handleSave = useCallback(
    async (title: string, newContent: string) => {
      const response = await fetch(`/api/content/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: newContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      const { content: updatedContent } = await response.json();

      setContent((prev) => ({
        ...prev,
        title: updatedContent.title,
        content: updatedContent.content,
        wordCount: updatedContent.wordCount,
        readTimeMinutes: updatedContent.readTimeMinutes,
        updatedAt: updatedContent.updatedAt,
      }));
    },
    [content.id]
  );

  const handleStatusChange = useCallback(
    async (status: ContentStatus) => {
      const response = await fetch(`/api/content/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setContent((prev) => ({ ...prev, status }));
    },
    [content.id]
  );

  const handleDelete = useCallback(async () => {
    const response = await fetch(`/api/content/${content.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete content");
    }

    router.push("/content/library");
  }, [content.id, router]);

  const handleRefineComplete = useCallback(
    (result: { contentId: string; content: string; changes: string[] }) => {
      // Navigate to the new version
      router.push(`/content/${result.contentId}`);
    },
    [router]
  );

  return (
    <div className="container max-w-4xl py-8 px-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/content/library">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Library
            </Link>
          </Button>
          {voiceSession && (
            <span className="text-sm text-muted-foreground">
              From {voiceSession.mode} session •{" "}
              {voiceSession.durationSeconds
                ? `${Math.round(voiceSession.durationSeconds / 60)} min recording`
                : ""}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <ContentActions
            contentId={content.id}
            title={content.title}
            content={content.content}
            status={content.status}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Main content with tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="view" className="gap-2">
            <Sparkles className="h-4 w-4" />
            View & Edit
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-2">
            <Mic className="h-4 w-4" />
            Voice Refine
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Text Refine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-0">
          <ContentEditor
            contentId={content.id}
            initialTitle={content.title}
            initialContent={content.content}
            wordCount={content.wordCount}
            readTimeMinutes={content.readTimeMinutes}
            status={content.status}
            createdAt={new Date(content.createdAt)}
            version={content.version}
            onSave={handleSave}
          />
        </TabsContent>

        <TabsContent value="voice" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <VoiceRefine
              contentId={content.id}
              onRefineComplete={handleRefineComplete}
            />
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">How Voice Refine Works</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click &quot;Start Recording&quot;</li>
                <li>Describe the changes you want (up to 60 seconds)</li>
                <li>We&apos;ll transcribe your feedback and apply it</li>
                <li>A new version will be created with your changes</li>
              </ol>
              <p className="mt-4 text-xs">
                Your original version is always preserved.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <RefineChat
              contentId={content.id}
              onRefineComplete={handleRefineComplete}
            />
            <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">Refinement Tips</h3>
              <ul className="space-y-2">
                <li>
                  <strong>Be specific:</strong> &quot;Add a call-to-action at the
                  end&quot; works better than &quot;make it better&quot;
                </li>
                <li>
                  <strong>Focus on sections:</strong> &quot;Expand the second
                  paragraph&quot; helps target changes
                </li>
                <li>
                  <strong>Describe tone:</strong> &quot;Make it more casual&quot; or
                  &quot;add more authority&quot;
                </li>
                <li>
                  <strong>Iterate:</strong> Make one change at a time for better
                  control
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Version info */}
      {content.version > 1 && (
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Version {content.version}
            {content.parentVersionId && (
              <>
                {" "}
                •{" "}
                <Link
                  href={`/content/${content.parentVersionId}`}
                  className="text-primary hover:underline"
                >
                  View previous version
                </Link>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
