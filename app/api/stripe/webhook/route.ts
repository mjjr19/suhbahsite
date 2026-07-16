import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient, getOrCreateParentUser } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { RegistrationConfirmationEmail } from "@/lib/email/templates/registration-confirmation";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata?.parentEmail || !metadata?.playerName || !metadata?.programSlug) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const parentUserId = await getOrCreateParentUser(metadata.parentEmail);

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        parent_user_id: parentUserId,
        full_name: metadata.playerName,
        date_of_birth: metadata.playerDob || null,
      })
      .select()
      .single();

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    const { error: registrationError } = await supabase
      .from("registrations")
      .insert({
        player_id: player.id,
        program_slug: metadata.programSlug,
        stripe_session_id: session.id,
        stripe_payment_status: "paid",
        amount_cents: session.amount_total,
      });

    if (registrationError) {
      return NextResponse.json(
        { error: registrationError.message },
        { status: 500 },
      );
    }

    if (process.env.RESEND_API_KEY) {
      const amountFormatted = ((session.amount_total ?? 0) / 100).toLocaleString(
        "en-US",
        { style: "currency", currency: "USD" },
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: metadata.parentEmail,
        subject: "You're registered with Suhbah Soccer!",
        react: RegistrationConfirmationEmail({
          parentName: metadata.parentName || "there",
          playerName: metadata.playerName,
          programTitle: metadata.programTitle || metadata.programSlug,
          amountFormatted,
        }),
      });
    }
  }

  return NextResponse.json({ received: true });
}
