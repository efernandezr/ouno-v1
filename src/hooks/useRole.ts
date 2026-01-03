"use client";

import { useSessionContext } from "@/contexts/session-context";
import type { UserRole } from "@/lib/roles";

/**
 * Client-side hook for role-based authorization.
 * Returns the current user's role and convenience boolean flags.
 */
export function useRole() {
  const { data: session, isPending } = useSessionContext();

  // Type assertion needed because customSessionClient adds role dynamically
  const role = ((session?.user as { role?: string } | null)?.role ?? "user") as UserRole;

  return {
    role,
    isAdmin: role === "admin",
    isPending,
    isAuthenticated: !!session,
  };
}
