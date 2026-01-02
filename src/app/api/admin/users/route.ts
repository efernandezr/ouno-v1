import { NextResponse } from "next/server";
import { and, desc, or, ilike, count, eq, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkAdminApi } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";
import { user } from "@/lib/schema";

export async function GET(request: Request) {
  // Admin authorization check
  const { authorized, error } = await checkAdminApi();
  if (!authorized) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const search = searchParams.get("search")?.trim() || "";
  const roleFilter = searchParams.get("role") as UserRole | null;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: SQL[] = [];

  if (search) {
    const searchCondition = or(
      ilike(user.name, `%${search}%`),
      ilike(user.email, `%${search}%`)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (roleFilter && (roleFilter === "admin" || roleFilter === "user")) {
    conditions.push(eq(user.role, roleFilter));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total users matching filters
  const countResult = await db
    .select({ total: count() })
    .from(user)
    .where(whereClause);

  const total = countResult[0]?.total ?? 0;

  // Fetch paginated users
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
      onboardingStatus: user.onboardingStatus,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
