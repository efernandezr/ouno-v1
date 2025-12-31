"use client";

import Link from "next/link";
import { Lock, Mic, FileText } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
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
              Please sign in to access your VoiceDNA dashboard
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to VoiceDNA</h1>
          <p className="text-muted-foreground mt-2">
            Hi {session.user.name?.split(" ")[0] || "there"}! Ready to capture your thoughts?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/record"
            className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Start Recording</h2>
                <p className="text-sm text-muted-foreground">
                  Capture a new voice session
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/content"
            className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Content Library</h2>
                <p className="text-sm text-muted-foreground">
                  View your generated content
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Placeholder for Voice DNA Status */}
        <div className="p-6 rounded-xl border bg-muted/30">
          <h3 className="font-semibold mb-2">Voice DNA Status</h3>
          <p className="text-sm text-muted-foreground">
            Complete your first recording to start building your Voice DNA profile.
          </p>
        </div>
      </div>
    </div>
  );
}
