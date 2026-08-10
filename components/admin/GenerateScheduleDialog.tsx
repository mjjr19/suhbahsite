"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { generateSessions } from "@/lib/actions/sessions";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function GenerateScheduleDialog({
  programs,
}: {
  programs: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [programSlug, setProgramSlug] = useState(programs[0]?.slug ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [labelPrefix, setLabelPrefix] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleWeekday(day: number, checked: boolean) {
    setWeekdays((prev) => (checked ? [...prev, day] : prev.filter((d) => d !== day)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    if (!programSlug) {
      setError("Choose a program.");
      setSending(false);
      return;
    }

    const result = await generateSessions({
      programSlug,
      startDate,
      endDate,
      weekdays,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      labelPrefix: labelPrefix.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      setSending(false);
      return;
    }

    setStartDate("");
    setEndDate("");
    setWeekdays([]);
    setStartTime("");
    setEndTime("");
    setLabelPrefix("");
    setSending(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate schedule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate session dates</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="program">Program</Label>
            <Select value={programSlug} onValueChange={setProgramSlug}>
              <SelectTrigger id="program">
                <SelectValue placeholder="Choose a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Repeats on</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {WEEKDAYS.map((day) => (
                <label key={day.value} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={weekdays.includes(day.value)}
                    onChange={(e) => toggleWeekday(day.value, e.target.checked)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="labelPrefix">Label prefix (optional)</Label>
            <Input
              id="labelPrefix"
              placeholder="e.g. Fall Camp"
              value={labelPrefix}
              onChange={(e) => setLabelPrefix(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={sending}>
              {sending ? "Generating…" : "Generate sessions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
