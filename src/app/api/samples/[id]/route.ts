/**
 * Writing Sample Individual API
 *
 * DELETE - Remove a writing sample
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { rebuildVoiceDNA } from "@/lib/analysis/voiceDNABuilder";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writingSamples } from "@/lib/schema";

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

    // Rebuild Voice DNA profile to reflect the removal
    // This recalculates the profile from remaining samples
    await rebuildVoiceDNA(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sample:", error);
    return NextResponse.json(
      { error: "Failed to delete writing sample" },
      { status: 500 }
    );
  }
}
