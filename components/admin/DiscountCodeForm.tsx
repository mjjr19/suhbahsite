"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDiscountCode } from "@/lib/actions/discounts";

export function DiscountCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"blanket" | "financial_aid">("financial_aid");
  const [percentOff, setPercentOff] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    const percent = parseInt(percentOff, 10);
    if (!percent || percent < 1 || percent > 100) {
      setError("Enter a percent off between 1 and 100.");
      setSending(false);
      return;
    }

    const result = await createDiscountCode({
      code,
      kind,
      percentOff: percent,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      expiresAt: expiresAt || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      setSending(false);
      return;
    }

    setCode("");
    setPercentOff("");
    setMaxUses("");
    setExpiresAt("");
    setNotes("");
    setSending(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          placeholder="e.g. EARLYBIRD10"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="kind">Kind</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as "blanket" | "financial_aid")}>
          <SelectTrigger id="kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="financial_aid">Financial aid (one family)</SelectItem>
            <SelectItem value="blanket">Blanket promo (anyone)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="percentOff">Percent off (1–100)</Label>
        <Input
          id="percentOff"
          type="number"
          min="1"
          max="100"
          required
          value={percentOff}
          onChange={(e) => setPercentOff(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="maxUses">Max uses (optional, blank = unlimited)</Label>
        <Input
          id="maxUses"
          type="number"
          min="1"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="expiresAt">Expires (optional)</Label>
        <Input
          id="expiresAt"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="e.g. Financial aid for the Ahmed family, approved 8/15"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sending}>
        {sending ? "Creating…" : "Create code"}
      </Button>
    </form>
  );
}
