/**
 * Referents API
 *
 * GET - List all available referent style profiles
 */

import { NextResponse } from "next/server";
import { allReferentProfiles } from "@/lib/referents/profiles";

export async function GET() {
  try {
    // Return referent profiles without sensitive prompt guidance
    const publicProfiles = allReferentProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      keyCharacteristics: profile.keyCharacteristics,
      tonalAttributes: profile.tonalAttributes,
    }));

    return NextResponse.json({
      referents: publicProfiles,
      count: publicProfiles.length,
    });
  } catch (error) {
    console.error("Error fetching referents:", error);
    return NextResponse.json(
      { error: "Failed to fetch referent profiles" },
      { status: 500 }
    );
  }
}
