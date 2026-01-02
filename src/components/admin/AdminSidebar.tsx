"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-56 md:shrink-0">
      {/* Mobile: horizontal tabs */}
      <div className="md:sticky md:top-24">
        <h2 className="hidden md:block text-sm font-semibold text-muted-foreground mb-4 px-3">
          Admin Panel
        </h2>
        <nav className="flex md:flex-col gap-1 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
