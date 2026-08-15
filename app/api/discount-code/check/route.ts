import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const checkSchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Tighter than /api/family-check's bucket — an email isn't a secret, but a
  // financial-aid code is closer to a private credential given to one
  // family, so guessing shouldn't be cheap.
  if (isRateLimited(`discount-code-check:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = checkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("kind, percent_off, is_active, expires_at, max_uses, used_count")
    .eq("code", parsed.data.code.trim().toUpperCase())
    .maybeSingle();

  const valid =
    !!data &&
    data.is_active &&
    (data.expires_at == null || new Date(data.expires_at) > new Date()) &&
    (data.max_uses == null || data.used_count < data.max_uses);

  if (!valid) {
    return NextResponse.json({ valid: false });
  }

  // Financial aid codes are effectively private credentials given to one
  // family — confirm validity without letting a public endpoint reveal the
  // exact discount amount to anyone who guesses a code. Blanket codes are
  // meant to be shared, so their percentage is fine to show.
  if (data!.kind === "financial_aid") {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: true, percentOff: data!.percent_off });
}
