"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";

/**
 * Admin badge displayed in the header for admin users.
 * Links to the admin panel.
 */
export function AdminBadge() {
  const { isAdmin, isPending } = useRole();

  // Don't render while loading or for non-admins
  if (isPending || !isAdmin) return null;

  return (
    <Link href="/admin">
      <Badge
        variant="outline"
        className="gap-1 border-primary/50 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    </Link>
  );
}
