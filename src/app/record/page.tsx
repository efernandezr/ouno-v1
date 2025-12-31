import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mic, Zap, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

/**
 * Recording Mode Selection Page
 *
 * Users choose between Quick (2 min) and Guided (5 min) recording modes.
 */
export default async function RecordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
              <Mic className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Start Recording
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose how you want to capture your thoughts. Both modes transcribe
            your voice and help transform it into polished content.
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Mode */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Up to 2 minutes</span>
                </div>
              </div>
              <CardTitle>Quick Capture</CardTitle>
              <CardDescription>
                Perfect for capturing a single idea, insight, or thought
                before it escapes. No prompts, just pure spontaneous expression.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Immediate recording start
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  No preparation needed
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Best for single ideas
                </li>
              </ul>
              <Button asChild className="w-full gap-2">
                <Link href="/record/quick">
                  Start Quick Capture
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Guided Mode */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Up to 5 minutes</span>
                </div>
              </div>
              <CardTitle>Guided Session</CardTitle>
              <CardDescription>
                AI prompts help you explore your idea in depth. Great for
                developing blog posts, articles, or deeper explorations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  AI-powered follow-up questions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Structured exploration
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Best for complete articles
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/record/guided">
                  Start Guided Session
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tips */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Tip: Find a quiet space and speak naturally. Your authentic voice
            is what makes your content unique.
          </p>
        </div>
      </div>
    </main>
  );
}
