import { NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkAdminApi } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { user, voiceSessions, writingSamples, voiceDNAProfiles } from "@/lib/schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/:id
 * Returns user details with activity statistics
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { authorized, error } = await checkAdminApi();
  if (!authorized) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { id } = await params;

  // Fetch user
  const [userData] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      onboardingStatus: user.onboardingStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch stats in parallel
  const [sessionCountResult, sampleCountResult, voiceDNAResult] = await Promise.all([
    db.select({ count: count() }).from(voiceSessions).where(eq(voiceSessions.userId, id)),
    db.select({ count: count() }).from(writingSamples).where(eq(writingSamples.userId, id)),
    db
      .select({
        calibrationScore: voiceDNAProfiles.calibrationScore,
        voiceSessionsAnalyzed: voiceDNAProfiles.voiceSessionsAnalyzed,
        writingSamplesAnalyzed: voiceDNAProfiles.writingSamplesAnalyzed,
      })
      .from(voiceDNAProfiles)
      .where(eq(voiceDNAProfiles.userId, id))
      .limit(1),
  ]);

  const stats = {
    sessionCount: sessionCountResult[0]?.count ?? 0,
    sampleCount: sampleCountResult[0]?.count ?? 0,
    hasVoiceDNA: voiceDNAResult.length > 0,
    calibrationScore: voiceDNAResult[0]?.calibrationScore ?? 0,
    voiceSessionsAnalyzed: voiceDNAResult[0]?.voiceSessionsAnalyzed ?? 0,
    writingSamplesAnalyzed: voiceDNAResult[0]?.writingSamplesAnalyzed ?? 0,
  };

  return NextResponse.json({ user: userData, stats });
}

/**
 * PATCH /api/admin/users/:id
 * Update user role (with self-demotion protection)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, error, session } = await checkAdminApi();
  if (!authorized) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { id } = await params;

  // Prevent self-demotion
  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  // Parse and validate body
  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = body;
  if (!role || (role !== "admin" && role !== "user")) {
    return NextResponse.json(
      { error: "Invalid role. Must be 'admin' or 'user'" },
      { status: 400 }
    );
  }

  // Check user exists
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update role
  const [updatedUser] = await db
    .update(user)
    .set({ role: role as UserRole })
    .where(eq(user.id, id))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  return NextResponse.json({ user: updatedUser });
}
