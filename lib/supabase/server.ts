import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for use in API routes only (Stripe webhook, etc).
 * Bypasses Row Level Security — never expose this client or its key to the browser.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Finds the auth user matching `email`, creating one if it doesn't exist yet.
 * Lets Phase 1 guest checkout register a player without the parent signing in,
 * while keeping `players.parent_user_id` a valid auth.users reference that the
 * same parent can later access via Phase 2 magic-link login (matched by email).
 */
export async function getOrCreateParentUser(email: string) {
  const supabase = createServiceRoleClient();

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

  if (!createError && created.user) {
    return created.user.id;
  }

  // User likely already exists — page through admin listUsers to find them.
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  throw new Error(`Could not find or create a user for ${email}`);
}
