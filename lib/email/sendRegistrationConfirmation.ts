import { client } from "@/lib/sanity/client";
import { programBySlugQuery } from "@/lib/sanity/queries";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { RegistrationConfirmationEmail } from "@/lib/email/templates/registration-confirmation";
import type { Program } from "@/types";

interface PendingCheckoutForEmail {
  program_slug: string;
  parent_name: string | null;
  parent_email: string;
  total_cents: number;
  children: { playerName: string }[];
}

/**
 * Shared by the webhook (paid orders) and the checkout route's $0 full-comp
 * path — same email, same "don't fail the caller over delivery" posture,
 * just two different callers reaching payment completion differently.
 */
export async function sendRegistrationConfirmation(pendingCheckout: PendingCheckoutForEmail) {
  if (!process.env.RESEND_API_KEY) return;

  const program = await client.fetch<Program | null>(programBySlugQuery, {
    slug: pendingCheckout.program_slug,
  });

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
      players: pendingCheckout.children.map((c) => c.playerName),
      programTitle: program?.title || pendingCheckout.program_slug,
      amountFormatted,
    }),
  });

  if (emailError) {
    // Don't fail the caller over email delivery — the registration is
    // already saved either way. Log so it's visible without blocking.
    console.error("Failed to send registration confirmation email:", emailError);
  }
}
