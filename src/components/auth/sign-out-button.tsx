"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/session-context";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const { data: session, isPending } = useSessionContext();
  const router = useRouter();

  if (isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (!session) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
