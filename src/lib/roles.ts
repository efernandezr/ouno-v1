import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

/**
 * User role type matching the database enum
 */
export type UserRole = "admin" | "user";

/**
 * Role hierarchy for authorization checks.
 * Higher values = more permissions.
 * Easy to extend with new roles (e.g., "moderator": 50)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  user: 10,
};

/**
 * Check if a user's role meets or exceeds a required role level
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role is admin
 */
export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

/**
 * Get session with role fetched from database.
 * This is used until BetterAuth's customSession is properly configured.
 */
export async function getSessionWithRole() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return {
    ...session,
    user: { ...session.user, role: (dbUser?.role ?? "user") as UserRole },
  };
}

/**
 * Server-side guard that requires admin role.
 * Redirects to login if not authenticated, or to redirectTo if not admin.
 * Use in Server Components/page.tsx files.
 */
export async function requireAdmin(redirectTo = "/dashboard") {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect(redirectTo);
  return session;
}

/**
 * API route guard for admin endpoints.
 * Returns authorization status and error info.
 * Use in API route handlers.
 */
export async function checkAdminApi() {
  const session = await getSessionWithRole();
  if (!session) {
    return { authorized: false as const, error: { message: "Unauthorized", status: 401 } };
  }
  if (!isAdmin(session.user.role)) {
    return { authorized: false as const, error: { message: "Forbidden", status: 403 } };
  }
  return { authorized: true as const, session };
}
