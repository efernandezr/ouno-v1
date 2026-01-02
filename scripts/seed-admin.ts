#!/usr/bin/env npx tsx
/**
 * Seed script to set the initial admin user.
 * Usage: pnpm db:seed-admin
 *
 * This script is idempotent - safe to run multiple times.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { user } from "../src/lib/schema";

const ADMIN_EMAIL = "efernandezr@gmail.com";

async function seedAdmin() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error("❌ POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  console.log(`🔍 Looking for user: ${ADMIN_EMAIL}`);

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Check if user exists
    const [existingUser] = await db
      .select({ id: user.id, role: user.role, name: user.name })
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1);

    if (!existingUser) {
      console.log(`❌ User ${ADMIN_EMAIL} not found in database.`);
      console.log("   Please register an account with this email first.");
      await client.end();
      process.exit(0);
    }

    if (existingUser.role === "admin") {
      console.log(`✅ User ${existingUser.name} (${ADMIN_EMAIL}) is already an admin.`);
      await client.end();
      process.exit(0);
    }

    // Update role to admin
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, existingUser.id));

    console.log(`✅ Successfully set ${existingUser.name} (${ADMIN_EMAIL}) as admin!`);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedAdmin();
