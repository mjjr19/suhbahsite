"use client";

import { useMemo, useState } from "react";
import { useController, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
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
import { calculateOrder } from "@/lib/pricing/calculateOrder";
import type { Program, ProgramPricingTier, ProgramSession } from "@/types";

const MAX_CHILDREN = 10;

const childSchema = z.object({
  playerName: z.string().min(2, "Enter the player's full name"),
  playerDob: z.string().min(1, "Date of birth is required"),
  packageLabel: z.string().optional(),
  selectedSessionIds: z.array(z.string()).optional(),
});

const baseRegistrationSchema = z.object({
  parentName: z.string().min(2, "Enter your full name"),
  parentEmail: z.string().email("Enter a valid email"),
  parentPhone: z.string().min(7, "Enter a valid phone number"),
  discountCode: z.string().optional(),
  children: z.array(childSchema).min(1).max(MAX_CHILDREN),
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
  const [familyEligible, setFamilyEligible] = useState(false);
  const [checkingFamily, setCheckingFamily] = useState(false);
  const [codeStatus, setCodeStatus] = useState<
    { valid: true; percentOff?: number } | { valid: false } | null
  >(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const tiers = useMemo(() => program.pricingTiers ?? [], [program.pricingTiers]);

  const registrationSchema = useMemo(
    () =>
      baseRegistrationSchema.superRefine((data, ctx) => {
        data.children.forEach((child, index) => {
          const tier = tiers.find((t) => t.label === child.packageLabel);
          const needed = tier?.sessionsIncluded;
          if (needed != null && needed < sessions.length) {
            const picked = child.selectedSessionIds?.length ?? 0;
            if (picked !== needed) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["children", index, "selectedSessionIds"],
                message: `Select exactly ${needed} session${needed === 1 ? "" : "s"} for this package.`,
              });
            }
          }
        });
      }),
    [tiers, sessions],
  );

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      children: [
        { playerName: "", playerDob: "", packageLabel: tiers[0]?.label, selectedSessionIds: [] },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "children" });
  const watchedChildren = useWatch({ control: form.control, name: "children" });

  async function handleEmailBlur(email: string) {
    if (!z.string().email().safeParse(email).success) {
      setFamilyEligible(false);
      return;
    }
    setCheckingFamily(true);
    try {
      const res = await fetch("/api/family-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setFamilyEligible(!!data.eligible);
    } catch {
      setFamilyEligible(false);
    } finally {
      setCheckingFamily(false);
    }
  }

  async function handleCodeBlur(code: string) {
    if (!code.trim()) {
      setCodeStatus(null);
      return;
    }
    setCheckingCode(true);
    try {
      const res = await fetch("/api/discount-code/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setCodeStatus(data.valid ? { valid: true, percentOff: data.percentOff } : { valid: false });
    } catch {
      setCodeStatus({ valid: false });
    } finally {
      setCheckingCode(false);
    }
  }

  const order = useMemo(() => {
    const inputs = watchedChildren.map((child) => {
      const tier = tiers.find((t) => t.label === child.packageLabel);
      const basePriceCents = tiers.length > 0 ? tier?.price ?? program.price : program.price;
      return { basePriceCents };
    });
    const codePercentOff = codeStatus?.valid ? codeStatus.percentOff : undefined;
    return calculateOrder(inputs, familyEligible, codePercentOff);
  }, [watchedChildren, tiers, program.price, familyEligible, codeStatus]);

  async function onSubmit(values: RegistrationValues) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, programSlug: program.slug }),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="space-y-4">
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
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      handleEmailBlur(e.target.value);
                    }}
                  />
                </FormControl>
                {checkingFamily && (
                  <p className="text-xs text-muted-foreground">Checking for SuhbahFamily discount…</p>
                )}
                {familyEligible && !checkingFamily && (
                  <p className="text-xs font-medium text-primary">
                    ✓ SuhbahFamily discount applied
                  </p>
                )}
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
          <FormField
            control={form.control}
            name="discountCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promo or financial aid code (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter a code"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      handleCodeBlur(e.target.value);
                    }}
                  />
                </FormControl>
                {checkingCode && (
                  <p className="text-xs text-muted-foreground">Checking code…</p>
                )}
                {codeStatus?.valid && !checkingCode && (
                  <p className="text-xs font-medium text-primary">
                    {codeStatus.percentOff != null
                      ? `✓ Code applied — ${codeStatus.percentOff}% off`
                      : "✓ Code applied — your final price will be shown after you submit"}
                  </p>
                )}
                {codeStatus?.valid === false && !checkingCode && (
                  <p className="text-xs text-destructive">That code isn&rsquo;t valid.</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {index === 0 ? "Player" : `Sibling ${index + 1}`}
                </h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`children.${index}.playerName`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Player&rsquo;s Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ibrahim Ahmed" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`children.${index}.playerDob`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormLabel>Player&rsquo;s Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tiers.length > 0 && (
                <ChildPackageFields
                  control={form.control}
                  index={index}
                  tiers={tiers}
                  sessions={sessions}
                />
              )}
            </div>
          ))}
        </div>

        {fields.length < MAX_CHILDREN && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              append({
                playerName: "",
                playerDob: "",
                packageLabel: tiers[0]?.label,
                selectedSessionIds: [],
              })
            }
          >
            Add sibling
          </Button>
        )}

        {tiers.length > 0 && (
          <div className="space-y-1 rounded-md bg-muted px-4 py-3 text-sm text-foreground">
            {order.children.map((child, i) => (
              <div key={i} className="flex items-center justify-between text-muted-foreground">
                <span>{watchedChildren[i]?.playerName || `Player ${i + 1}`}</span>
                <span>{formatPrice(child.basePriceCents)}</span>
              </div>
            ))}
            {order.children.some((c) => c.siblingDiscountCents > 0) && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Sibling discount</span>
                <span>
                  −{formatPrice(order.children.reduce((s, c) => s + c.siblingDiscountCents, 0))}
                </span>
              </div>
            )}
            {order.children.some((c) => c.familyDiscountCents > 0) && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>SuhbahFamily discount</span>
                <span>
                  −{formatPrice(order.children.reduce((s, c) => s + c.familyDiscountCents, 0))}
                </span>
              </div>
            )}
            {order.children.some((c) => c.codeDiscountCents > 0) && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Code discount</span>
                <span>
                  −{formatPrice(order.children.reduce((s, c) => s + c.codeDiscountCents, 0))}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.totalCents)}</span>
            </div>
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

function ChildPackageFields({
  control,
  index,
  tiers,
  sessions,
}: {
  control: Control<RegistrationValues>;
  index: number;
  tiers: ProgramPricingTier[];
  sessions: ProgramSession[];
}) {
  const packageLabel = useWatch({ control, name: `children.${index}.packageLabel` });
  const selectedTier = tiers.find((t) => t.label === packageLabel) ?? tiers[0];
  const needsSessionPicker =
    selectedTier?.sessionsIncluded != null && selectedTier.sessionsIncluded < sessions.length;

  const { field: sessionField } = useController({
    control,
    name: `children.${index}.selectedSessionIds`,
  });
  const selectedSessionIds = sessionField.value ?? [];

  function toggleSession(sessionId: string, checked: boolean) {
    const next = checked
      ? [...selectedSessionIds, sessionId]
      : selectedSessionIds.filter((id) => id !== sessionId);
    sessionField.onChange(next);
  }

  return (
    <>
      <FormField
        control={control}
        name={`children.${index}.packageLabel`}
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

      {needsSessionPicker && (
        <FormField
          control={control}
          name={`children.${index}.selectedSessionIds`}
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
    </>
  );
}
