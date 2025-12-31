/**
 * Onboarding Status API
 *
 * GET - Get current onboarding status
 * PATCH - Update onboarding status
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserOnboardingStatus,
  updateUserOnboardingStatus,
} from "@/lib/db/users";
import type { OnboardingStatus } from "@/types/calibration";

const VALID_STATUSES: OnboardingStatus[] = [
  "not_started",
  "voice_intro",
  "follow_ups",
  "samples",
  "complete",
];

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getUserOnboardingStatus(session.user.id);

    return NextResponse.json({ status });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body as { status: OnboardingStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid onboarding status" },
        { status: 400 }
      );
    }

    await updateUserOnboardingStatus(session.user.id, status);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
