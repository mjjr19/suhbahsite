import { createClient } from "@/lib/supabase/server-client";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user?.email}. Registrations, payments, and schedule
        management are coming in the next phases.
      </p>
    </div>
  );
}
