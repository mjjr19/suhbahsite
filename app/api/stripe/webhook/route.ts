import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { RegistrationConfirmationEmail } from "@/lib/email/templates/registration-confirmation";

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

function calculateAgeYears(dob: string): string {
  const ageMs = Date.now() - new Date(dob).getTime();
  return (ageMs / MS_PER_YEAR).toFixed(2);
}

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

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .insert({
        program_slug: metadata.programSlug,
        registered_at: new Date().toISOString(),
        child_name: metadata.playerName,
        child_age: metadata.playerDob ? calculateAgeYears(metadata.playerDob) : null,
        parent_name: metadata.parentName || null,
        parent_email: metadata.parentEmail.toLowerCase(),
        parent_phone: metadata.parentPhone || null,
        package_selected: metadata.packageLabel || metadata.programTitle || metadata.programSlug,
        payment_method: "stripe",
        payment_status: "paid",
        amount_paid_cents: session.amount_total ?? 0,
      })
      .select()
      .single();

    if (registrationError) {
      return NextResponse.json(
        { error: registrationError.message },
        { status: 500 },
      );
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      registration_id: registration.id,
      amount_cents: session.amount_total ?? 0,
      method: "stripe",
      paid_at: new Date().toISOString().slice(0, 10),
      notes: `Stripe Checkout session ${session.id}`,
    });

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    // Assign this registration to the sessions its tier covers. Partial
    // tiers pass the parent's chosen dates through metadata; anything else
    // (no tiers, or a tier with no sessionsIncluded limit) is treated as
    // full coverage — every session that currently exists for this program.
    // Known limitation: sessions added after this point won't retroactively
    // include already-registered full-coverage registrants.
    let sessionIds: string[];
    if (metadata.selectedSessionIds) {
      sessionIds = metadata.selectedSessionIds.split(",").filter(Boolean);
    } else {
      const { data: programSessions } = await supabase
        .from("sessions")
        .select("id")
        .eq("program_slug", metadata.programSlug)
        .eq("status", "scheduled");
      sessionIds = (programSessions ?? []).map((s) => s.id);
    }

    if (sessionIds.length > 0) {
      const { error: sessionAssignError } = await supabase
        .from("session_registrations")
        .insert(
          sessionIds.map((sessionId) => ({
            session_id: sessionId,
            registration_id: registration.id,
          })),
        );

      if (sessionAssignError) {
        // Don't fail the webhook over this — registration + payment already
        // succeeded. Log so it's visible without blocking Stripe's retry.
        console.error("Failed to assign session_registrations:", sessionAssignError);
      }
    }

    if (process.env.RESEND_API_KEY) {
      const amountFormatted = ((session.amount_total ?? 0) / 100).toLocaleString(
        "en-US",
        { style: "currency", currency: "USD" },
      );

      const { error: emailError } = await resend.emails.send({
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

      if (emailError) {
        // Don't fail the webhook over email delivery — the registration is
        // already saved. Log so it's visible without blocking Stripe's retry.
        console.error("Failed to send registration confirmation email:", emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
