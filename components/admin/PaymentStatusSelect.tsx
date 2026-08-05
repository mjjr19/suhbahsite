"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePaymentStatus } from "@/lib/actions/registrations";

const STATUSES = ["unpaid", "partial", "paid"] as const;

export function PaymentStatusSelect({
  registrationId,
  currentStatus,
}: {
  registrationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(value: string) {
    setError(null);
    const result = await updatePaymentStatus({
      registrationId,
      status: value as (typeof STATUSES)[number],
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Select defaultValue={currentStatus} onValueChange={handleChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
