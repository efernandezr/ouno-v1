"use client";

import { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";

type SessionContextValue = ReturnType<typeof useSession>;

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

/**
 * SessionProvider Component
 *
 * Wraps the BetterAuth useSession hook to provide session data
 * to all child components. This eliminates duplicate useSession()
 * calls across components, reducing database queries from 5-7 to 1.
 *
 * Usage:
 * - Wrap your app in <SessionProvider>
 * - Use useSessionContext() hook in components instead of useSession()
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSessionContext Hook
 *
 * Custom hook to access session data from SessionContext.
 * Use this instead of useSession() from @/lib/auth-client to
 * avoid duplicate session queries.
 *
 * @returns Session data, loading state, and error
 *
 * @example
 * const { data: session, isPending } = useSessionContext();
 * if (isPending) return <Loading />;
 * if (!session) return <SignIn />;
 * return <Dashboard user={session.user} />;
 */
export function useSessionContext() {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error(
      "useSessionContext must be used within a SessionProvider"
    );
  }

  return context;
}
