/**
 * Seed Script for Referent Creators
 *
 * Run with: npx tsx src/lib/db/seed-referents.ts
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { allReferentProfiles } from "@/lib/referents/profiles";
import { referentCreators } from "@/lib/schema";

async function seedReferentCreators() {
  // Using console.warn for CLI script output (allowed by lint rules)
  console.warn("Seeding referent creators...");

  for (const profile of allReferentProfiles) {
    // Check if the referent already exists
    const existing = await db
      .select()
      .from(referentCreators)
      .where(eq(referentCreators.slug, profile.slug))
      .limit(1);

    if (existing.length > 0) {
      console.warn(`  ${profile.name} already exists, skipping...`);
      continue;
    }

    // Insert the referent
    await db.insert(referentCreators).values({
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      imageUrl: null, // Can be added later
      styleProfile: profile,
      isPreBuilt: true,
      createdByUserId: null,
    });

    console.warn(`  Created ${profile.name}`);
  }

  console.warn("Seeding complete!");
}

// Run the seed function
seedReferentCreators()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
