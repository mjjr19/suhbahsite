import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { checkFamilyEligibility } from "@/lib/family-eligibility";
import { isRateLimited } from "@/lib/rate-limit";

const familyCheckSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`family-check:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = familyCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const eligible = await checkFamilyEligibility(supabase, parsed.data.email);

  return NextResponse.json({ eligible });
}
