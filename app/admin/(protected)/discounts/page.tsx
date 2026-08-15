import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { getCurrentStaff } from "@/lib/supabase/staff";
import { Badge } from "@/components/ui/badge";
import { DiscountCodeForm } from "@/components/admin/DiscountCodeForm";
import { DeactivateCodeButton } from "@/components/admin/DeactivateCodeButton";

export default async function AdminDiscountsPage() {
  const currentStaff = await getCurrentStaff();
  if (currentStaff?.role !== "admin") redirect("/admin");

  const supabase = createClient();
  const { data: codes } = await supabase
    .from("discount_codes")
    .select("id, code, kind, percent_off, max_uses, used_count, expires_at, is_active, notes")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-foreground">Discounts</h1>
      <p className="mt-2 text-muted-foreground">
        Create a blanket promo code or a one-off financial aid code for a specific family.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <DiscountCodeForm />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">Existing codes</h2>
        <ul className="mt-3 space-y-2">
          {(codes ?? []).map((c) => (
            <li key={c.id} className="rounded-md border border-border px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{c.code}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={c.kind === "financial_aid" ? "secondary" : "outline"}>
                    {c.kind === "financial_aid" ? "Financial aid" : "Blanket"}
                  </Badge>
                  {!c.is_active && <Badge variant="outline">Inactive</Badge>}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-muted-foreground">
                <span>
                  {c.percent_off}% off · {c.used_count} used
                  {c.max_uses != null ? ` / ${c.max_uses} max` : ""}
                  {c.expires_at ? ` · expires ${c.expires_at}` : ""}
                </span>
                {c.is_active && <DeactivateCodeButton id={c.id} />}
              </div>
              {c.notes && <p className="mt-1 text-muted-foreground">{c.notes}</p>}
            </li>
          ))}
          {(codes ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No codes yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
