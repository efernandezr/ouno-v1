"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: <Home className="h-5 w-5" />,
  },
  {
    href: "/record",
    label: "Record",
    icon: <Mic className="h-5 w-5" />,
  },
  {
    href: "/content",
    label: "Library",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    href: "/settings/voice-dna",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

/**
 * BottomNav Component
 *
 * Mobile-first bottom navigation bar.
 * Shows on small screens, hidden on desktop (md+).
 * Uses fixed positioning with safe area insets for iOS.
 */
export function BottomNav() {
  const pathname = usePathname();

  // Don't show on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
    return null;
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-md border-t",
        "pb-safe md:hidden" // Hidden on desktop
      )}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <ul className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1",
                  "transition-colors touch-manipulation",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "transition-transform",
                    isActive && "scale-110"
                  )}
                >
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
