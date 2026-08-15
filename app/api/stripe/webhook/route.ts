import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendRegistrationConfirmation } from "@/lib/email/sendRegistrationConfirmation";

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

    if (result?.claimed) {
      await sendRegistrationConfirmation(pendingCheckout);
    }
  }

  return NextResponse.json({ received: true });
}
