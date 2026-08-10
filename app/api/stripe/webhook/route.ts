import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { client } from "@/lib/sanity/client";
import { programBySlugQuery } from "@/lib/sanity/queries";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { RegistrationConfirmationEmail } from "@/lib/email/templates/registration-confirmation";
import type { Program } from "@/types";

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
    const pendingCheckoutId = session.metadata?.pendingCheckoutId;

    if (!pendingCheckoutId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: pendingCheckout } = await supabase
      .from("pending_checkouts")
      .select("*")
      .eq("id", pendingCheckoutId)
      .maybeSingle();

    if (!pendingCheckout) {
      // Nothing to do — unknown id, or already cleaned up. Ack so Stripe
      // stops retrying.
      return NextResponse.json({ received: true });
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "consume_pending_checkout",
      { p_id: pendingCheckoutId },
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    const result = rpcResult?.[0];

    if (result?.claimed && process.env.RESEND_API_KEY) {
      const program = await client.fetch<Program | null>(programBySlugQuery, {
        slug: pendingCheckout.program_slug,
      });

      const children = pendingCheckout.children as { playerName: string }[];
      const amountFormatted = (pendingCheckout.total_cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });

      const { error: emailError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: pendingCheckout.parent_email,
        subject: "You're registered with Suhbah Soccer!",
        react: RegistrationConfirmationEmail({
          parentName: pendingCheckout.parent_name || "there",
          players: children.map((c) => c.playerName),
          programTitle: program?.title || pendingCheckout.program_slug,
          amountFormatted,
        }),
      });

      if (emailError) {
        // Don't fail the webhook over email delivery — registrations are
        // already saved. Log so it's visible without blocking Stripe's retry.
        console.error("Failed to send registration confirmation email:", emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
