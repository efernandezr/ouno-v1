import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "./schema";

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Log password reset URL to terminal (no email integration yet)
      // eslint-disable-next-line no-console
      console.log(
        `\n${"=".repeat(60)}\nPASSWORD RESET REQUEST\nUser: ${user.email}\nReset URL: ${url}\n${"=".repeat(60)}\n`
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Log verification URL to terminal (no email integration yet)
      // eslint-disable-next-line no-console
      console.log(
        `\n${"=".repeat(60)}\nEMAIL VERIFICATION\nUser: ${user.email}\nVerification URL: ${url}\n${"=".repeat(60)}\n`
      );
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache session data for 5 minutes
    },
  },
  plugins: [
    customSession(async ({ user: sessionUser, session }) => {
      // Type assertion for session with extended properties
      const extendedSession = session as typeof session & { role?: string };

      // Check if role is already cached in session (avoids redundant DB queries)
      if (extendedSession.role) {
        return {
          user: { ...sessionUser, role: extendedSession.role },
          session: extendedSession,
        };
      }

      // Only query database if role is not already in session
      const [dbUser] = await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, sessionUser.id))
        .limit(1);

      const role = dbUser?.role ?? "user";

      // Store role in session for future requests (enables caching)
      return {
        user: { ...sessionUser, role },
        session: { ...extendedSession, role },
      };
    }),
  ],
});

// Export the auth type for client plugin typing
export type Auth = typeof auth;
