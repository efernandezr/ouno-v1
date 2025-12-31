/**
 * Content View/Edit Page
 *
 * Displays generated content with options to edit, refine, and manage.
 */

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent, voiceSessions } from "@/lib/schema";
import { ContentPageClient } from "./content-page-client";

interface ContentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentPage({ params }: ContentPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch content
  const [content] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);

  if (!content) {
    notFound();
  }

  // Verify ownership
  if (content.userId !== session.user.id) {
    notFound();
  }

  // Fetch associated session for context
  const [voiceSession] = await db
    .select({
      id: voiceSessions.id,
      mode: voiceSessions.mode,
      durationSeconds: voiceSessions.durationSeconds,
      createdAt: voiceSessions.createdAt,
    })
    .from(voiceSessions)
    .where(eq(voiceSessions.id, content.sessionId))
    .limit(1);

  // Serialize dates for client component
  const serializedContent = {
    id: content.id,
    userId: content.userId,
    sessionId: content.sessionId,
    title: content.title,
    content: content.content,
    wordCount: content.wordCount,
    readTimeMinutes: content.readTimeMinutes,
    status: content.status,
    version: content.version,
    parentVersionId: content.parentVersionId,
    modelUsed: content.modelUsed,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt.toISOString(),
  };

  const serializedSession = voiceSession
    ? {
        id: voiceSession.id,
        mode: voiceSession.mode,
        durationSeconds: voiceSession.durationSeconds,
        createdAt: voiceSession.createdAt.toISOString(),
      }
    : null;

  return (
    <ContentPageClient
      content={serializedContent}
      voiceSession={serializedSession}
    />
  );
}
