import { createClient } from "@/lib/supabase/server-client";
import { StaffInviteForm } from "@/components/admin/StaffInviteForm";

export default async function AdminStaffPage() {
  const supabase = createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, email, is_active, accepted_at")
    .order("invited_at", { ascending: true });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-foreground">Staff</h1>
      <p className="mt-2 text-muted-foreground">
        Invite a new staff member. They&rsquo;ll get a magic-link email to sign in.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <StaffInviteForm />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Current staff</h2>
        <ul className="mt-3 space-y-2">
          {(staff ?? []).map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm"
            >
              <span>
                {member.full_name}{" "}
                <span className="text-muted-foreground">({member.email})</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {member.accepted_at ? "Accepted" : "Pending"}
              </span>
            </li>
          ))}
          {(staff ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No staff yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
