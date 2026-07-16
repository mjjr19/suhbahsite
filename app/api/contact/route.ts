import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resend, FROM_EMAIL, NOTIFICATIONS_EMAIL } from "@/lib/email/resend";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email is not configured yet." },
      { status: 503 },
    );
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFICATIONS_EMAIL,
    replyTo: email,
    subject: `New contact form message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  return NextResponse.json({ success: true });
}
