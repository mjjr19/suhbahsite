import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server-client";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { SignOutButton } from "@/components/portal/SignOutButton";

export const metadata: Metadata = {
  title: "Parent Portal",
};

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "paid") return "default";
  if (status === "partial") return "secondary";
  return "outline";
}

export default async function PortalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const { data: registrations } = await supabase
    .from("registrations")
    .select(
      "id, child_name, package_selected, payment_status, amount_paid_cents, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-foreground">My Registrations</h1>
        <SignOutButton />
      </div>
      <p className="mt-2 text-muted-foreground">
        Registrations and payment status for {user.email}.
      </p>

      <ul className="mt-8 space-y-2">
        {(registrations ?? []).map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm"
          >
            <span>
              <span className="font-medium text-foreground">{r.child_name}</span>
              {r.package_selected && (
                <span className="text-muted-foreground"> — {r.package_selected}</span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <Badge variant={statusBadgeVariant(r.payment_status)}>
                {r.payment_status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatPrice(r.amount_paid_cents)}
              </span>
            </span>
          </li>
        ))}
        {(registrations ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">
            No registrations found for this account yet. If you just
            registered, try refreshing in a minute, or{" "}
            <Link href="/contact" className="underline">
              contact us
            </Link>{" "}
            if this seems wrong.
          </li>
        )}
      </ul>
    </div>
  );
}
