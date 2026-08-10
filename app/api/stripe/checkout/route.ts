import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { client } from "@/lib/sanity/client";
import { programBySlugQuery } from "@/lib/sanity/queries";
import { createClient } from "@/lib/supabase/server-client";
import type { Program, ProgramPricingTier } from "@/types";

const checkoutSchema = z.object({
  playerName: z.string().min(2),
  playerDob: z.string().min(1),
  parentName: z.string().min(2),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(7),
  programSlug: z.string().min(1),
  packageLabel: z.string().optional(),
  selectedSessionIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration details." },
      { status: 400 },
    );
  }

  const {
    playerName,
    playerDob,
    parentName,
    parentEmail,
    parentPhone,
    programSlug,
    packageLabel,
    selectedSessionIds,
  } = parsed.data;

  const program = await client.fetch<Program | null>(programBySlugQuery, {
    slug: programSlug,
  });

  if (!program || !program.active) {
    return NextResponse.json(
      { error: "This program is not available for registration." },
      { status: 404 },
    );
  }

  let unitAmount = program.price;
  let tier: ProgramPricingTier | undefined;
  if (program.pricingTiers && program.pricingTiers.length > 0) {
    tier = program.pricingTiers.find((t) => t.label === packageLabel);
    if (!tier) {
      return NextResponse.json(
        { error: "Please select a valid package." },
        { status: 400 },
      );
    }
    unitAmount = tier.price;
  }

  // Never trust the client's picked dates or whether this tier "needs" a
  // picker at all — the program page is ISR (revalidate=60) and could be
  // stale by the time the parent submits. Re-derive everything here.
  let confirmedSessionIds: string[] | undefined;
  if (tier?.sessionsIncluded != null) {
    const supabase = createClient();
    const { data: availableSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("program_slug", programSlug)
      .eq("status", "scheduled");
    const availableIds = new Set((availableSessions ?? []).map((s) => s.id));

    if (tier.sessionsIncluded < availableIds.size) {
      const picked = selectedSessionIds ?? [];
      const allValid = picked.every((id) => availableIds.has(id));
      if (picked.length !== tier.sessionsIncluded || !allValid) {
        return NextResponse.json(
          { error: `Please select exactly ${tier.sessionsIncluded} session date(s).` },
          { status: 400 },
        );
      }
      confirmedSessionIds = picked;
    }
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: parentEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: program.title,
            description: program.summary,
          },
        },
      },
    ],
    metadata: {
      programSlug,
      programTitle: program.title,
      playerName,
      playerDob,
      parentName,
      parentEmail,
      parentPhone,
      ...(program.pricingTiers && program.pricingTiers.length > 0
        ? { packageLabel: packageLabel! }
        : {}),
      ...(confirmedSessionIds ? { selectedSessionIds: confirmedSessionIds.join(",") } : {}),
    },
    success_url: `${origin}/programs/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/programs/${programSlug}`,
  });

  return NextResponse.json({ url: session.url });
}
