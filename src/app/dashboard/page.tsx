"use client";

import { Lock } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import {
  QuickActions,
  RecentContent,
  VoiceDNAStatus,
} from "@/components/dashboard";
import { useSessionContext } from "@/contexts/session-context";

export default function DashboardPage() {
  const { data: session, isPending } = useSessionContext();

  if (isPending) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your Ouno dashboard
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Header */}
        <header>
          <h1 className="text-2xl md:text-3xl font-bold">
            Hi {session.user.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to capture your thoughts?
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions + Recent Content */}
          <div className="lg:col-span-2 space-y-8">
            <QuickActions />
            <RecentContent />
          </div>

          {/* Right Column - Ouno Core Status */}
          <div className="lg:col-span-1">
            <VoiceDNAStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
