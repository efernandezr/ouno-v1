# Implementation Plan: Role-Based Access Control (RBAC)

## Overview

Implement scalable RBAC system leveraging the existing `role` column in the user table. Create admin section with user management, add role to BetterAuth session, and display admin badge in UI.

**Total Files**: 23 (8 modify, 15 create)

---

## Phase 1: Core Infrastructure

Set up role utilities, extend BetterAuth session to include role, and create client-side hook.

### Tasks

- [ ] Create role utilities file with type definitions and helper functions
- [ ] Extend BetterAuth server config to include role in session via customSession
- [ ] Update BetterAuth client to use customSessionClient plugin
- [ ] Create useRole hook for client-side role checks
- [ ] Add `/admin` to protected routes list

### Technical Details

**File: `src/lib/roles.ts` (NEW)**
```typescript
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export type UserRole = "admin" | "user";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  user: 10,
};

export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}

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

export async function requireAdmin(redirectTo = "/dashboard") {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect(redirectTo);
  return session;
}

export async function checkAdminApi() {
  const session = await getSessionWithRole();
  if (!session) return { authorized: false, error: { message: "Unauthorized", status: 401 } };
  if (!isAdmin(session.user.role)) return { authorized: false, error: { message: "Forbidden", status: 403 } };
  return { authorized: true, session };
}
```

**File: `src/lib/auth.ts` - Add customSession plugin**
```typescript
import { customSession } from "better-auth/plugins";

// In plugins array:
customSession(async ({ user: sessionUser, session }) => {
  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, sessionUser.id))
    .limit(1);

  return {
    user: { ...sessionUser, role: dbUser?.role ?? "user" },
    session,
  };
}),
```

**File: `src/lib/auth-client.ts` - Add client plugin**
```typescript
import { customSessionClient } from "better-auth/client/plugins";
import type { Auth } from "./auth";

// In plugins array:
customSessionClient<Auth>(),
```

**File: `src/hooks/useRole.ts` (NEW)**
```typescript
"use client";
import { useSession } from "@/lib/auth-client";
import type { UserRole } from "@/lib/roles";

export function useRole() {
  const { data: session, isPending } = useSession();
  const role = (session?.user?.role ?? "user") as UserRole;
  return {
    role,
    isAdmin: role === "admin",
    isPending,
    isAuthenticated: !!session,
  };
}
```

**File: `src/lib/session.ts` - Add to protectedRoutes**
```typescript
const protectedRoutes = ["/dashboard", "/chat", "/profile", "/admin"];
```

---

## Phase 2: Admin Section Layout

Create the admin section with protected layout and dashboard landing page.

### Tasks

- [ ] Create admin layout with server-side role check and sidebar
- [ ] Create admin sidebar component with navigation links
- [ ] Create admin dashboard page with feature cards
- [ ] Create admin loading skeleton

### Technical Details

**File: `src/app/admin/layout.tsx` (NEW)**
```typescript
import { requireAdmin } from "@/lib/roles";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-8">
        <AdminSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
```

**File: `src/components/admin/AdminSidebar.tsx` (NEW)**
```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
              pathname === item.href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

**File: `src/app/admin/page.tsx` (NEW)**
- Dashboard with cards for Users, Configuration (coming soon), Analytics (coming soon)
- Links to `/admin/users`

**File: `src/app/admin/loading.tsx` (NEW)**
- Loading skeleton with sidebar placeholder

---

## Phase 3: User Management API

Create admin API endpoints for listing users and managing individual users.

### Tasks

- [ ] Create users list API with pagination and search
- [ ] Create user detail API with stats
- [ ] Create user update API for role changes (with self-demotion protection)

### Technical Details

**File: `src/app/api/admin/users/route.ts` (NEW)**
```typescript
// GET /api/admin/users?page=1&limit=20&search=john&role=admin
// Returns: { users: [...], pagination: { page, limit, total, totalPages } }
// Uses checkAdminApi() for protection
// Queries: user table with optional filters
// Ordering: desc(user.createdAt)
```

**File: `src/app/api/admin/users/[id]/route.ts` (NEW)**
```typescript
// GET /api/admin/users/:id
// Returns: { user: {...}, stats: { sessionCount, sampleCount, hasVoiceDNA, calibrationScore } }

// PATCH /api/admin/users/:id
// Body: { role: "admin" | "user" }
// Protection: Cannot demote self (check session.user.id !== params.id)
// Returns: { user: updatedUser }
```

**API Protection Pattern:**
```typescript
export async function GET(request: Request) {
  const { authorized, error } = await checkAdminApi();
  if (!authorized) {
    return NextResponse.json({ error: error!.message }, { status: error!.status });
  }
  // ... route logic
}
```

---

## Phase 4: User Management UI

Create user list and detail pages with components.

### Tasks

- [ ] Create user list page
- [ ] Create user list component with search and pagination
- [ ] Create user detail page
- [ ] Create user detail component with role editor
- [ ] Create users loading skeleton

### Technical Details

**File: `src/app/admin/users/page.tsx` (NEW)**
```typescript
import { UserList } from "@/components/admin/UserList";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </header>
      <UserList />
    </div>
  );
}
```

**File: `src/components/admin/UserList.tsx` (NEW)**
- State: users[], pagination, search, loading, page
- Search input with debounce (300ms)
- User cards with Avatar, name, email, role badge, join date
- Pagination controls (prev/next)
- Links to `/admin/users/[id]`

**File: `src/app/admin/users/[id]/page.tsx` (NEW)**
```typescript
// Server component that fetches user data
// Passes to UserDetail client component
```

**File: `src/components/admin/UserDetail.tsx` (NEW)**
- Display user info (avatar, name, email, verified status, join date)
- Stats cards (sessions, samples, Ouno Core status)
- Role selector dropdown (Select component)
- Save button for role changes
- Self-demotion prevention (disabled if viewing own profile)

---

## Phase 5: UI Indicators

Add admin badge to header and admin link to user profile dropdown.

### Tasks

- [ ] Create AdminBadge component
- [ ] Add AdminBadge to site header
- [ ] Add Admin Panel link to user profile dropdown

### Technical Details

**File: `src/components/auth/AdminBadge.tsx` (NEW)**
```typescript
"use client";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";

export function AdminBadge() {
  const { isAdmin, isPending } = useRole();
  if (isPending || !isAdmin) return null;

  return (
    <Link href="/admin">
      <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    </Link>
  );
}
```

**File: `src/components/site-header.tsx` - Add AdminBadge**
```typescript
import { AdminBadge } from "@/components/auth/AdminBadge";

// In nav section before UserProfile:
<AdminBadge />
```

**File: `src/components/auth/user-profile.tsx` - Add Admin Panel link**
```typescript
import { Shield } from "lucide-react";

// In dropdown, after "Your Profile" and before Sign Out:
{session.user?.role === "admin" && (
  <>
    <DropdownMenuItem asChild>
      <Link href="/admin">
        <Shield className="mr-2 h-4 w-4" />
        Admin Panel
      </Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
  </>
)}
```

---

## Phase 6: Setup & Documentation

Create seed script and update documentation.

### Tasks

- [ ] Create admin seed script
- [ ] Add db:seed-admin script to package.json
- [ ] Update CLAUDE.md with role documentation
- [ ] Update README.md with admin features

### Technical Details

**File: `scripts/seed-admin.ts` (NEW)**
```typescript
#!/usr/bin/env npx tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { user } from "../src/lib/schema";

const ADMIN_EMAIL = "efernandezr@gmail.com";

async function seedAdmin() {
  const client = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(client);

  const [existing] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (!existing) {
    console.log(`User ${ADMIN_EMAIL} not found. Register first.`);
    process.exit(0);
  }

  if (existing.role === "admin") {
    console.log(`User ${ADMIN_EMAIL} is already admin.`);
    process.exit(0);
  }

  await db.update(user).set({ role: "admin" }).where(eq(user.id, existing.id));
  console.log(`Set ${ADMIN_EMAIL} as admin!`);

  await client.end();
}

seedAdmin();
```

**File: `package.json` - Add script**
```json
"db:seed-admin": "npx tsx scripts/seed-admin.ts"
```

**File: `CLAUDE.md` updates:**
- Add to Key Enums: `user_role: admin, user`
- Add `/admin` route to Project Structure
- Add `src/components/admin/` to components structure
- Add role utilities section to Common Tasks

**File: `README.md` updates:**
- Add "Role-Based Access Control" to Features section
- Document admin capabilities
- Add `db:seed-admin` to Available Scripts

---

## File Summary

| Action | File |
|--------|------|
| Modify | `src/lib/auth.ts` |
| Modify | `src/lib/auth-client.ts` |
| Modify | `src/lib/session.ts` |
| Modify | `src/components/site-header.tsx` |
| Modify | `src/components/auth/user-profile.tsx` |
| Modify | `package.json` |
| Modify | `CLAUDE.md` |
| Modify | `README.md` |
| Create | `src/lib/roles.ts` |
| Create | `src/hooks/useRole.ts` |
| Create | `src/app/admin/layout.tsx` |
| Create | `src/app/admin/page.tsx` |
| Create | `src/app/admin/loading.tsx` |
| Create | `src/app/admin/users/page.tsx` |
| Create | `src/app/admin/users/[id]/page.tsx` |
| Create | `src/app/admin/users/loading.tsx` |
| Create | `src/app/api/admin/users/route.ts` |
| Create | `src/app/api/admin/users/[id]/route.ts` |
| Create | `src/components/admin/AdminSidebar.tsx` |
| Create | `src/components/admin/UserList.tsx` |
| Create | `src/components/admin/UserDetail.tsx` |
| Create | `src/components/auth/AdminBadge.tsx` |
| Create | `scripts/seed-admin.ts` |

---

## Verification

After implementation:

1. Run `pnpm db:seed-admin` to set admin
2. Login as `efernandezr@gmail.com`
3. Verify admin badge appears in header
4. Navigate to `/admin` - should see dashboard
5. Go to Users - should see all registered users
6. Test role change on another user
7. Verify non-admin users are redirected from `/admin`
