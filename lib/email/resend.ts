import { Resend } from "resend";

// Placeholder key lets the app build/run before RESEND_API_KEY is configured.
// Call sites check for the real env var before actually sending mail.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Suhbah Soccer <onboarding@resend.dev>";
export const NOTIFICATIONS_EMAIL =
  process.env.CONTACT_NOTIFICATIONS_EMAIL || "suhbahsoccer@gmail.com";
