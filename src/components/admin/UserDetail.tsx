"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Mic,
  FileText,
  Brain,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/lib/roles";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  emailVerified: boolean;
  onboardingStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  sessionCount: number;
  sampleCount: number;
  hasVoiceDNA: boolean;
  calibrationScore: number;
  voiceSessionsAnalyzed: number;
  writingSamplesAnalyzed: number;
}

interface UserDetailProps {
  userId: string;
}

export function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");

  // Check if viewing own profile (cannot change own role)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isOwnProfile = currentUserId === userId;

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("User not found");
          router.push("/admin/users");
          return;
        }
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
      setStats(data.stats);
      setSelectedRole(data.user.role);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  // Fetch current user ID for self-demotion check
  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session?.user?.id) {
          setCurrentUserId(data.session.user.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user || newRole === user.role) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      const data = await response.json();
      setUser((prev) => (prev ? { ...prev, role: data.user.role } : null));
      setSelectedRole(data.user.role);
      toast.success(`Role updated to ${data.user.role}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
      // Reset to original role
      setSelectedRole(user.role);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const onboardingStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      voice_intro: "Voice Intro",
      follow_ups: "Follow-ups",
      samples: "Writing Samples",
      complete: "Complete",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <UserDetailSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Users
      </Link>

      {/* User header */}
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
          <AvatarImage
            src={user.image || ""}
            alt={user.name}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="text-xl sm:text-2xl">
            {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{user.name}</h1>
            {user.role === "admin" && (
              <Badge
                variant="outline"
                className="border-primary/50 text-primary"
              >
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{user.email}</span>
              {user.emailVerified ? (
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              Joined {formatDate(user.createdAt)}
            </div>
          </div>
        </div>

        {/* Role selector */}
        <div className="w-full sm:w-auto sm:text-right mt-2 sm:mt-0">
          <label className="text-sm font-medium block mb-2">Role</label>
          <Select
            value={selectedRole}
            onValueChange={(value) => handleRoleChange(value as UserRole)}
            disabled={saving || isOwnProfile}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {isOwnProfile && (
            <p className="text-xs text-muted-foreground mt-1">
              Cannot change own role
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Voice Sessions"
            value={stats.sessionCount}
            description="Total recordings"
            icon={Mic}
          />
          <StatCard
            title="Writing Samples"
            value={stats.sampleCount}
            description="Uploaded samples"
            icon={FileText}
          />
          <StatCard
            title="Ouno Core"
            value={stats.hasVoiceDNA ? "Active" : "Not created"}
            description={
              stats.hasVoiceDNA
                ? `Score: ${stats.calibrationScore}`
                : "No profile yet"
            }
            icon={Brain}
          />
          <StatCard
            title="Onboarding"
            value={onboardingStatusLabel(user.onboardingStatus)}
            description="Current progress"
            icon={CheckCircle}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-start gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
