"use client";

import Link from "next/link";
import { AdminBadge } from "@/components/auth/AdminBadge";
import { UserProfile } from "@/components/auth/user-profile";
import { OunoLogo } from "@/components/brand/OunoLogo";
import { useSession } from "@/lib/auth-client";
import { ModeToggle } from "./ui/mode-toggle";

export function SiteHeader() {
  const { data: session } = useSession();

  // Link to dashboard if logged in, otherwise to landing page
  const logoHref = session?.user ? "/dashboard" : "/";

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
        <nav
          className="container mx-auto px-4 py-4 flex justify-between items-center"
          aria-label="Main navigation"
        >
          <h1 className="text-2xl font-bold">
            <Link
              href={logoHref}
              className="hover:opacity-80 transition-opacity"
              aria-label={session?.user ? "Ouno - Go to dashboard" : "Ouno - Go to homepage"}
            >
              <OunoLogo size="md" />
            </Link>
          </h1>
          <div className="flex items-center gap-4" role="group" aria-label="User actions">
            <AdminBadge />
            <UserProfile />
            <ModeToggle />
          </div>
        </nav>
      </header>
    </>
  );
}
