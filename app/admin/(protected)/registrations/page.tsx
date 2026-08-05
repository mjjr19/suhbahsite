import Link from "next/link";
import { createClient } from "@/lib/supabase/server-client";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "paid") return "default";
  if (status === "partial") return "secondary";
  return "outline";
}

export default async function AdminRegistrationsPage() {
  const supabase = createClient();
  const { data: registrations } = await supabase
    .from("registrations")
    .select(
      "id, child_name, parent_name, parent_email, payment_status, amount_paid_cents, package_selected, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Registrations</h1>
      <p className="mt-2 text-muted-foreground">
        All player registrations, newest first.
      </p>

      <ul className="mt-8 space-y-2">
        {(registrations ?? []).map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/registrations/${r.id}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              <span>
                <span className="font-medium text-foreground">{r.child_name}</span>{" "}
                <span className="text-muted-foreground">
                  ({r.parent_name || "—"}
                  {r.parent_email ? `, ${r.parent_email}` : ""})
                </span>
                {r.package_selected && (
                  <span className="text-muted-foreground"> — {r.package_selected}</span>
                )}
              </span>
              <span className="flex items-center gap-3">
                <Badge variant={statusBadgeVariant(r.payment_status)}>
                  {r.payment_status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatCents(r.amount_paid_cents)}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {(registrations ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No registrations yet.</li>
        )}
      </ul>
    </div>
  );
}
