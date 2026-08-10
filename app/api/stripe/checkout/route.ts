import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { client } from "@/lib/sanity/client";
import { programBySlugQuery } from "@/lib/sanity/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkFamilyEligibility } from "@/lib/family-eligibility";
import { calculateOrder } from "@/lib/pricing/calculateOrder";
import type { Program, ProgramPricingTier, Weekday } from "@/types";

const MAX_CHILDREN = 10;
const STRIPE_MIN_CHARGE_CENTS = 50;

const childInputSchema = z.object({
  playerName: z.string().min(2),
  playerDob: z.string().min(1),
  packageLabel: z.string().optional(),
  selectedSessionIds: z.array(z.string()).optional(),
});

const checkoutSchema = z.object({
  parentName: z.string().min(2),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(7),
  programSlug: z.string().min(1),
  children: z.array(childInputSchema).min(1).max(MAX_CHILDREN),
});

interface SessionAssignment {
  mode: "full" | "weekday" | "picked";
  weekday?: Weekday;
  sessionIds?: string[];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details." }, { status: 400 });
  }

  const { parentName, parentEmail, parentPhone, programSlug, children } = parsed.data;

  const program = await client.fetch<Program | null>(programBySlugQuery, {
    slug: programSlug,
  });

  if (!program || !program.active) {
    return NextResponse.json(
      { error: "This program is not available for registration." },
      { status: 404 },
    );
  }

  const supabase = createServiceRoleClient();

  const { data: availableSessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("program_slug", programSlug)
    .eq("status", "scheduled");
  const availableIds = new Set((availableSessions ?? []).map((s) => s.id));

  const resolvedChildren: {
    playerName: string;
    playerDob: string;
    packageLabel?: string;
    basePriceCents: number;
    sessionAssignment: SessionAssignment;
  }[] = [];

  for (const child of children) {
    let tier: ProgramPricingTier | undefined;
    let basePriceCents = program.price;

    if (program.pricingTiers && program.pricingTiers.length > 0) {
      tier = program.pricingTiers.find((t) => t.label === child.packageLabel);
      if (!tier) {
        return NextResponse.json(
          { error: `Please select a valid package for ${child.playerName || "each player"}.` },
          { status: 400 },
        );
      }
      basePriceCents = tier.price;
    }

    let sessionAssignment: SessionAssignment = { mode: "full" };

    if (tier?.sessionsIncluded != null && tier.sessionsIncluded < availableIds.size) {
      const picked = child.selectedSessionIds ?? [];
      const allValid = picked.every((id) => availableIds.has(id));
      if (picked.length !== tier.sessionsIncluded || !allValid) {
        return NextResponse.json(
          {
            error: `Please select exactly ${tier.sessionsIncluded} session date(s) for ${child.playerName || "each player"}.`,
          },
          { status: 400 },
        );
      }
      sessionAssignment = { mode: "picked", sessionIds: picked };
    } else if (tier?.weekdayFilter) {
      sessionAssignment = { mode: "weekday", weekday: tier.weekdayFilter };
    }

    resolvedChildren.push({
      playerName: child.playerName,
      playerDob: child.playerDob,
      packageLabel: tier?.label,
      basePriceCents,
      sessionAssignment,
    });
  }

  // Never trust a client-claimed discount — re-check the same way
  // /api/family-check does.
  const suhbahFamilyEligible = await checkFamilyEligibility(supabase, parentEmail);

  const order = calculateOrder(
    resolvedChildren.map((c) => ({ basePriceCents: c.basePriceCents })),
    suhbahFamilyEligible,
  );

  const tooCheap = order.children.find((c) => c.finalPriceCents < STRIPE_MIN_CHARGE_CENTS);
  if (tooCheap) {
    return NextResponse.json(
      { error: "One or more registrations fell below the minimum charge amount." },
      { status: 400 },
    );
  }

  const pendingChildren = resolvedChildren.map((c, i) => ({
    playerName: c.playerName,
    playerDob: c.playerDob,
    packageLabel: c.packageLabel,
    sessionAssignment: c.sessionAssignment,
    basePriceCents: c.basePriceCents,
    siblingDiscountCents: order.children[i].siblingDiscountCents,
    familyDiscountCents: order.children[i].familyDiscountCents,
    finalPriceCents: order.children[i].finalPriceCents,
  }));

  const { data: pendingCheckout, error: pendingError } = await supabase
    .from("pending_checkouts")
    .insert({
      program_slug: programSlug,
      parent_name: parentName,
      parent_email: parentEmail.toLowerCase(),
      parent_phone: parentPhone,
      suhbah_family_applied: suhbahFamilyEligible,
      children: pendingChildren,
      total_cents: order.totalCents,
    })
    .select()
    .single();

  if (pendingError || !pendingCheckout) {
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: parentEmail,
    line_items: pendingChildren.map((c) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: c.finalPriceCents,
        product_data: {
          name: `${program.title} — ${c.playerName}`,
          description: c.packageLabel ?? program.summary,
        },
      },
    })),
    metadata: {
      pendingCheckoutId: pendingCheckout.id,
    },
    success_url: `${origin}/programs/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/programs/${programSlug}`,
  });

  await supabase
    .from("pending_checkouts")
    .update({ stripe_session_id: session.id })
    .eq("id", pendingCheckout.id);

  return NextResponse.json({ url: session.url });
}
