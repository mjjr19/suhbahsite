import Stripe from "stripe";

// Placeholder key lets the app build/run before STRIPE_SECRET_KEY is
// configured. Any real checkout/webhook call will fail until it's set.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  { apiVersion: "2026-06-24.dahlia" },
);
