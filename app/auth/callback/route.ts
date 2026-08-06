import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      // First login after an invite: link this auth user to their staff row
      // by email, and stamp accepted_at. No-op on subsequent logins since
      // auth_user_id is already set.
      const adminClient = createServiceRoleClient();
      await adminClient
        .from("staff")
        .update({
          auth_user_id: data.user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("email", data.user.email.toLowerCase())
        .is("auth_user_id", null);

      // First login for a parent: link any guest-checkout registrations made
      // with this email to this auth user, so RLS can scope the portal
      // dashboard to them. Case-insensitive match because parent_email on
      // older rows isn't normalized (new rows are lowercased at insert time
      // in the Stripe webhook). No-op once already backfilled.
      await adminClient
        .from("registrations")
        .update({ auth_user_id: data.user.id })
        .ilike("parent_email", data.user.email)
        .is("auth_user_id", null);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
