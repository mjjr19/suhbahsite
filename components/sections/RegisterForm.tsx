"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { Program, ProgramSession } from "@/types";

const baseRegistrationSchema = z.object({
  playerName: z.string().min(2, "Enter the player's full name"),
  playerDob: z.string().min(1, "Date of birth is required"),
  parentName: z.string().min(2, "Enter your full name"),
  parentEmail: z.string().email("Enter a valid email"),
  parentPhone: z.string().min(7, "Enter a valid phone number"),
  packageLabel: z.string().optional(),
  selectedSessionIds: z.array(z.string()).optional(),
});

type RegistrationValues = z.infer<typeof baseRegistrationSchema>;

function formatSessionLabel(session: ProgramSession) {
  const date = format(new Date(`${session.sessionDate}T00:00:00`), "EEE, MMM d");
  return session.startTime ? `${date} · ${session.startTime.slice(0, 5)}` : date;
}

export function RegisterForm({
  program,
  sessions,
}: {
  program: Program;
  sessions: ProgramSession[];
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tiers = useMemo(() => program.pricingTiers ?? [], [program.pricingTiers]);

  const registrationSchema = useMemo(
    () =>
      baseRegistrationSchema.superRefine((data, ctx) => {
        const tier = tiers.find((t) => t.label === data.packageLabel);
        const needed = tier?.sessionsIncluded;
        if (needed != null && needed < sessions.length) {
          const picked = data.selectedSessionIds?.length ?? 0;
          if (picked !== needed) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["selectedSessionIds"],
              message: `Select exactly ${needed} session${needed === 1 ? "" : "s"} for this package.`,
            });
          }
        }
      }),
    [tiers, sessions],
  );

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      playerName: "",
      playerDob: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      packageLabel: tiers[0]?.label,
      selectedSessionIds: [],
    },
  });

  const selectedLabel = form.watch("packageLabel");
  const selectedTier = tiers.find((t) => t.label === selectedLabel) ?? tiers[0];
  const totalPrice = tiers.length > 0 ? selectedTier?.price ?? program.price : program.price;
  const needsSessionPicker =
    selectedTier?.sessionsIncluded != null && selectedTier.sessionsIncluded < sessions.length;
  const selectedSessionIds = form.watch("selectedSessionIds") ?? [];

  function toggleSession(sessionId: string, checked: boolean) {
    const current = form.getValues("selectedSessionIds") ?? [];
    const next = checked
      ? [...current, sessionId]
      : current.filter((id) => id !== sessionId);
    form.setValue("selectedSessionIds", next, { shouldValidate: true });
  }

  async function onSubmit(values: RegistrationValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          selectedSessionIds: needsSessionPicker ? values.selectedSessionIds : undefined,
          programSlug: program.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="playerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player&rsquo;s Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Ibrahim Ahmed" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="playerDob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player&rsquo;s Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent/Guardian Name</FormLabel>
              <FormControl>
                <Input placeholder="Amina Ahmed" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tiers.length > 0 && (
          <FormField
            control={form.control}
            name="packageLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select a package</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a package" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.label} value={tier.label}>
                        {tier.label} — {formatPrice(tier.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {needsSessionPicker && (
          <FormField
            control={form.control}
            name="selectedSessionIds"
            render={() => (
              <FormItem>
                <FormLabel>
                  Choose {selectedTier?.sessionsIncluded} session
                  {selectedTier?.sessionsIncluded === 1 ? "" : "s"}
                </FormLabel>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
                  {sessions.map((session) => (
                    <label
                      key={session.id}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={selectedSessionIds.includes(session.id)}
                        onChange={(e) => toggleSession(session.id, e.target.checked)}
                      />
                      {formatSessionLabel(session)}
                    </label>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No session dates are available yet.
                    </p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {tiers.length > 0 && (
          <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3 text-sm font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Redirecting to payment…" : "Register & Pay"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You&rsquo;ll be redirected to Stripe to complete payment securely.
        </p>
      </form>
    </Form>
  );
}
