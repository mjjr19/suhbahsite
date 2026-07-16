import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripe } from "@/lib/stripe/client";

export const metadata: Metadata = {
  title: "Registration Confirmed",
};

export default async function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  const session = sessionId
    ? await stripe.checkout.sessions.retrieve(sessionId).catch(() => null)
    : null;

  const amountFormatted = session?.amount_total
    ? (session.amount_total / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    : null;

  return (
    <section className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-3xl text-foreground">
          You&rsquo;re Registered!
        </h1>
        <p className="mt-4 text-muted-foreground">
          {session?.metadata?.playerName
            ? `${session.metadata.playerName} is registered for ${session.metadata.programTitle ?? "the program"}.`
            : "Your registration was received."}{" "}
          A confirmation email is on its way.
        </p>
        {amountFormatted && (
          <p className="mt-2 font-semibold text-foreground">
            Amount paid: {amountFormatted}
          </p>
        )}
        <Button asChild className="mt-8">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
