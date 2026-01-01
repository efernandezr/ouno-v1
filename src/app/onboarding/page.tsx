/**
 * Onboarding Page
 *
 * Voice-based onboarding wizard that guides users through:
 * 1. Voice Introduction - Record initial voice sample
 * 2. Follow-up Questions - Answer generated questions
 * 3. Writing Samples - Optionally upload existing content
 * 4. Referent Selection - Choose style influences
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { auth } from "@/lib/auth";
import { getUserOnboardingStatus } from "@/lib/db/users";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get current onboarding status
  const status = await getUserOnboardingStatus(session.user.id);

  // If already complete, redirect to dashboard
  if (status === "complete") {
    redirect("/dashboard");
  }

  // Map status to step index
  const stepFromStatus: Record<string, number> = {
    not_started: 0,
    voice_intro: 1,
    follow_ups: 2,
    samples: 3,
    complete: 4,
  };

  const initialStep = stepFromStatus[status] ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container max-w-2xl mx-auto py-8 px-4 pb-24 md:pb-8">
        <OnboardingWizard
          userId={session.user.id}
          initialStep={initialStep}
          userName={session.user.name || "there"}
        />
      </main>
    </div>
  );
}
