/**
 * Content Library Page
 *
 * Lists all user's generated content with search and filter capabilities.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import {
  FileText,
  Clock,
  CalendarDays,
  Mic,
  Plus,
  Library,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent, voiceSessions } from "@/lib/schema";
import type { ContentStatus } from "@/types/content";

const statusConfig: Record<
  ContentStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  final: { label: "Final", variant: "default" },
  published: { label: "Published", variant: "outline" },
};

export default async function ContentLibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all content for user, most recent first
  const contents = await db
    .select({
      id: generatedContent.id,
      title: generatedContent.title,
      wordCount: generatedContent.wordCount,
      readTimeMinutes: generatedContent.readTimeMinutes,
      status: generatedContent.status,
      version: generatedContent.version,
      createdAt: generatedContent.createdAt,
      sessionId: generatedContent.sessionId,
    })
    .from(generatedContent)
    .where(eq(generatedContent.userId, session.user.id))
    .orderBy(desc(generatedContent.createdAt));

  // Fetch session modes for context
  const sessionIds = [...new Set(contents.map((c) => c.sessionId))];
  const sessions =
    sessionIds.length > 0
      ? await db
          .select({
            id: voiceSessions.id,
            mode: voiceSessions.mode,
          })
          .from(voiceSessions)
          .where(inArray(voiceSessions.id, sessionIds))
      : [];

  // Create a map of session modes
  const sessionModeMap = new Map(sessions.map((s) => [s.id, s.mode]));

  // Calculate stats
  const totalContent = contents.length;
  const totalWords = contents.reduce((sum, c) => sum + c.wordCount, 0);
  const drafts = contents.filter((c) => c.status === "draft").length;
  const finals = contents.filter((c) => c.status === "final").length;

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Library className="h-8 w-8" />
            Content Library
          </h1>
          <p className="text-muted-foreground mt-1">
            All your generated content in one place
          </p>
        </div>
        <Button asChild>
          <Link href="/record">
            <Plus className="h-4 w-4 mr-2" />
            New Recording
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {totalContent > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalContent}</div>
              <p className="text-xs text-muted-foreground">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {totalWords.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Words</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{drafts}</div>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{finals}</div>
              <p className="text-xs text-muted-foreground">Final</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content list */}
      {contents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No content yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Start by recording your thoughts and we&apos;ll transform them
                into polished content.
              </p>
              <Button asChild>
                <Link href="/record">
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contents.map((content) => {
            const statusInfo = statusConfig[content.status];
            const mode = sessionModeMap.get(content.sessionId);
            const formattedDate = new Date(content.createdAt).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );

            return (
              <Link key={content.id} href={`/content/${content.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {content.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {content.readTimeMinutes} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {content.wordCount.toLocaleString()} words
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formattedDate}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {content.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{content.version}
                          </Badge>
                        )}
                        {mode && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {mode}
                          </Badge>
                        )}
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
