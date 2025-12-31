import Link from "next/link";
import { Mic, ArrowRight, Sparkles, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                <Mic className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                VoiceDNA
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Stop typing prompts. Start talking ideas.
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Capture your authentic thinking through speech and transform it into
              polished content—preserving what makes <span className="font-semibold text-foreground">you</span> sound like <span className="font-semibold text-foreground">you</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border bg-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice-First Capture</h3>
              <p className="text-muted-foreground">
                Record your ideas naturally. No more staring at blank pages—just talk and let your thoughts flow.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Your Voice DNA</h3>
              <p className="text-muted-foreground">
                We learn your unique speaking patterns, vocabulary, and style to ensure the output sounds authentically you.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Polished Content</h3>
              <p className="text-muted-foreground">
                Transform rambling thoughts into structured blog posts, articles, and content ready to publish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Record your thoughts</h3>
                <p className="text-muted-foreground">Speak naturally for 2-5 minutes about your topic or idea.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Answer follow-up questions</h3>
                <p className="text-muted-foreground">AI asks clarifying questions to draw out more depth and detail.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Get polished content</h3>
                <p className="text-muted-foreground">Receive a blog post that sounds like you, not a generic AI.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-xl bg-muted/50 border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span>Voice to content in under 10 minutes</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
