"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelSession } from "@/lib/actions/sessions";

export function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await cancelSession({ sessionId });
    setPending(false);
    if (!result.error) router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "Cancelling…" : "Cancel"}
    </Button>
  );
}
