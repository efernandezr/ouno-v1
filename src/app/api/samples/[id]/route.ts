/**
 * Writing Sample Individual API
 *
 * DELETE - Remove a writing sample
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writingSamples, voiceDNAProfiles } from "@/lib/schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE - Remove a writing sample
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const [deletedSample] = await db
      .delete(writingSamples)
      .where(
        and(
          eq(writingSamples.id, id),
          eq(writingSamples.userId, session.user.id)
        )
      )
      .returning({ id: writingSamples.id });

    if (!deletedSample) {
      return NextResponse.json(
        { error: "Sample not found or access denied" },
        { status: 404 }
      );
    }

    // Decrement the counter on Voice DNA profile
    const [profile] = await db
      .select()
      .from(voiceDNAProfiles)
      .where(eq(voiceDNAProfiles.userId, session.user.id))
      .limit(1);

    const currentCount = profile?.writingSamplesAnalyzed ?? 0;
    if (profile && currentCount > 0) {
      await db
        .update(voiceDNAProfiles)
        .set({
          writingSamplesAnalyzed: currentCount - 1,
          updatedAt: new Date(),
        })
        .where(eq(voiceDNAProfiles.userId, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sample:", error);
    return NextResponse.json(
      { error: "Failed to delete writing sample" },
      { status: 500 }
    );
  }
}
