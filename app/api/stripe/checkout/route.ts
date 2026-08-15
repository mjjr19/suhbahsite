import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { client } from "@/lib/sanity/client";
import { programBySlugQuery } from "@/lib/sanity/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkFamilyEligibility } from "@/lib/family-eligibility";
import { calculateOrder } from "@/lib/pricing/calculateOrder";
import { sendRegistrationConfirmation } from "@/lib/email/sendRegistrationConfirmation";
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
  discountCode: z.string().optional(),
});

interface SessionAssignment {
  mode: "full" | "weekday" | "picked";
  weekday?: Weekday;
  sessionIds?: string[];
}

interface ReservedDiscountCode {
  id: string;
  percent_off: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration details." }, { status: 400 });
  }

  const { parentName, parentEmail, parentPhone, programSlug, children, discountCode } =
    parsed.data;

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

  // Reserve the code up front (atomic — see migration 0006) so a code's
  // remaining uses can't be over-redeemed by two checkout attempts started
  // minutes or hours apart, not just at the exact same instant.
  let reservedCode: ReservedDiscountCode | null = null;
  if (discountCode && discountCode.trim()) {
    const { data: reserved } = await supabase.rpc("reserve_discount_code", {
      p_code: discountCode,
    });
    // PostgREST serializes a NULL composite return (no matching row) as an
    // object with every field null, not a bare `null` — check the id, not
    // just truthiness of the object itself.
    if (!reserved || (reserved as ReservedDiscountCode).id == null) {
      return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
    }
    reservedCode = reserved as ReservedDiscountCode;
  }

  async function releaseCodeIfReserved() {
    if (reservedCode) {
      await supabase.rpc("release_discount_code", { p_id: reservedCode.id });
    }
  }

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
        await releaseCodeIfReserved();
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
        await releaseCodeIfReserved();
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
    reservedCode?.percent_off,
  );

  // A child landing at exactly $0 (only possible with a 100%-off code,
  // which applies uniformly to the whole order) is the valid full-comp
  // path below, not an error. Anything strictly between $0 and Stripe's
  // minimum is what actually needs rejecting.
  const tooCheap = order.children.some(
    (c) => c.finalPriceCents > 0 && c.finalPriceCents < STRIPE_MIN_CHARGE_CENTS,
  );
  if (tooCheap) {
    await releaseCodeIfReserved();
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
    codeDiscountCents: order.children[i].codeDiscountCents,
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
      discount_code_id: reservedCode?.id ?? null,
      discount_code_percent_off: reservedCode?.percent_off ?? null,
      children: pendingChildren,
      total_cents: order.totalCents,
    })
    .select()
    .single();

  if (pendingError || !pendingCheckout) {
    await releaseCodeIfReserved();
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }

  // Full comp (100%-off code): every child is $0, so there's nothing for
  // Stripe to charge. Skip Stripe entirely — process the registration
  // immediately via the same RPC the webhook uses (it's payment-method-aware
  // and doesn't care whether it's called from a webhook or here), send the
  // same confirmation email, and send the parent straight to the success
  // page instead of a Stripe redirect.
  if (order.totalCents === 0) {
    const { data: rpcResult, error: rpcError } = await supabase.rpc("consume_pending_checkout", {
      p_id: pendingCheckout.id,
    });

    if (rpcError || !rpcResult?.[0]?.claimed) {
      await releaseCodeIfReserved();
      return NextResponse.json(
        { error: "Could not complete this free registration. Please try again." },
        { status: 500 },
      );
    }

    await sendRegistrationConfirmation(pendingCheckout);

    return NextResponse.json({ url: "/programs/success" });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
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
  } catch {
    await releaseCodeIfReserved();
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }

  await supabase
    .from("pending_checkouts")
    .update({ stripe_session_id: session.id })
    .eq("id", pendingCheckout.id);

  return NextResponse.json({ url: session.url });
}
