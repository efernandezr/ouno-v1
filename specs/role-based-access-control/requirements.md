# Requirements: Role-Based Access Control (RBAC)

## Overview

Implement a scalable role-based access control system with Admin and User roles. Create a dedicated admin section for user management and system configuration. The system should be designed for future extensibility with additional roles and granular permissions.

## Background

The application currently has a `role` column in the user table with enum values `["admin", "user"]`, but this field is not utilized for authorization. All authenticated users have equal access to all features.

## Goals

1. **Role Infrastructure**: Wire up the existing role column to BetterAuth sessions and create utilities for role-based authorization
2. **Admin Section**: Create a protected `/admin` route with dashboard and configuration pages
3. **User Management**: Allow admins to view all users, see their activity stats, and manage roles
4. **Visual Indicators**: Display admin badge in UI when user has admin role
5. **Initial Setup**: Provide a seed script to set the initial admin user

## User Stories

### As an Admin
- I can access the `/admin` section to manage the application
- I can view a list of all registered users with search and pagination
- I can view detailed information about any user including their activity stats
- I can change a user's role (except my own to prevent self-demotion)
- I see an "Admin" badge in the header indicating my role
- I can quickly navigate to admin panel from user dropdown

### As a Regular User
- I cannot access the `/admin` section (redirected to dashboard)
- I can use all existing features (recording, content generation, etc.)
- I don't see admin-specific UI elements

## Acceptance Criteria

### Role Infrastructure
- [ ] BetterAuth session includes `role` field
- [ ] `requireAdmin()` utility redirects non-admins to dashboard
- [ ] `checkAdminApi()` returns 403 for non-admin API requests
- [ ] `useRole()` hook available for client-side role checks
- [ ] Role hierarchy system supports future role additions

### Admin Section
- [ ] `/admin` route is protected (redirects non-admins)
- [ ] Admin layout includes sidebar navigation
- [ ] Admin dashboard shows overview with links to sub-sections
- [ ] Loading states displayed during page transitions

### User Management
- [ ] Users list shows: name, email, role badge, join date
- [ ] Search filters users by name or email
- [ ] Pagination works for large user lists
- [ ] User detail page shows activity stats (sessions, samples, Ouno Core)
- [ ] Role can be changed via dropdown (admin only)
- [ ] Admin cannot demote themselves

### UI Indicators
- [ ] Admin badge appears in site header for admin users
- [ ] Badge links to `/admin` section
- [ ] "Admin Panel" option appears in user profile dropdown
- [ ] Badge styling is subtle but visible

### Initial Setup
- [ ] Seed script sets `efernandezr@gmail.com` as admin
- [ ] Script is idempotent (safe to run multiple times)
- [ ] Script provides clear console feedback

## Non-Functional Requirements

- **Scalability**: Easy to add new roles (moderator, premium, etc.)
- **Security**: Server-side role checks on all protected routes
- **Performance**: Role fetched once per session, cached appropriately
- **Consistency**: Same auth pattern used across all admin routes

## Dependencies

- BetterAuth (existing)
- Drizzle ORM (existing)
- PostgreSQL (existing)
- shadcn/ui components (existing)

## Related Features

- Authentication system (existing)
- User profile (existing)
- Dashboard (existing)

## Out of Scope (Future)

- Granular permissions system
- Role-based feature flags
- Audit logging for admin actions
- Multiple admin levels
- Ban/suspend user functionality
