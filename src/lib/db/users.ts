/**
 * User Database Utilities
 *
 * Functions for managing user records, including onboarding status.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import type { OnboardingStatus } from "@/types/calibration";

/**
 * Get user's current onboarding status
 */
export async function getUserOnboardingStatus(
  userId: string
): Promise<OnboardingStatus> {
  const result = await db
    .select({ onboardingStatus: user.onboardingStatus })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return (result[0]?.onboardingStatus as OnboardingStatus) ?? "not_started";
}

/**
 * Update user's onboarding status
 */
export async function updateUserOnboardingStatus(
  userId: string,
  status: OnboardingStatus
): Promise<void> {
  await db
    .update(user)
    .set({
      onboardingStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

/**
 * Get user by ID with basic info
 */
export async function getUserById(userId: string) {
  const result = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      onboardingStatus: user.onboardingStatus,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0] ?? null;
}
