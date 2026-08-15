"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deactivateDiscountCode } from "@/lib/actions/discounts";

export function DeactivateCodeButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await deactivateDiscountCode({ id });
    setPending(false);
    if (!result.error) router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "…" : "Deactivate"}
    </Button>
  );
}
