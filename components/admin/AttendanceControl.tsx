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
import { markAttendance } from "@/lib/actions/attendance";

const STATUSES = ["unmarked", "present", "absent", "excused"] as const;

export function AttendanceControl({
  sessionRegistrationId,
  currentStatus,
}: {
  sessionRegistrationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(value: string) {
    setError(null);
    const result = await markAttendance({
      sessionRegistrationId,
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
        <SelectTrigger className="w-32">
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
