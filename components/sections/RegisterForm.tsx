"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import type { Program } from "@/types";

const registrationSchema = z.object({
  playerName: z.string().min(2, "Enter the player's full name"),
  playerDob: z.string().min(1, "Date of birth is required"),
  parentName: z.string().min(2, "Enter your full name"),
  parentEmail: z.string().email("Enter a valid email"),
  parentPhone: z.string().min(7, "Enter a valid phone number"),
  packageLabel: z.string().optional(),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

export function RegisterForm({ program }: { program: Program }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tiers = program.pricingTiers ?? [];

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      playerName: "",
      playerDob: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      packageLabel: tiers[0]?.label,
    },
  });

  const selectedLabel = form.watch("packageLabel");
  const selectedTier = tiers.find((t) => t.label === selectedLabel) ?? tiers[0];
  const totalPrice = tiers.length > 0 ? selectedTier?.price ?? program.price : program.price;

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
