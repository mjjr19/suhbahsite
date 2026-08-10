import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { getCurrentStaff } from "@/lib/supabase/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusSelect } from "@/components/admin/PaymentStatusSelect";
import { RecordPaymentForm } from "@/components/admin/RecordPaymentForm";
import { formatCents } from "@/lib/utils";

export default async function AdminRegistrationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const staff = await getCurrentStaff();
  if (staff?.role !== "admin") redirect("/admin");

  const supabase = createClient();
  const { data: registration } = await supabase
    .from("registrations")
    .select("*, payments(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!registration) notFound();

  const payments = [...(registration.payments ?? [])].sort(
    (a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl text-foreground">
          {registration.child_name}
        </h1>
        <Badge
          variant={
            registration.payment_status === "paid"
              ? "default"
              : registration.payment_status === "partial"
                ? "secondary"
                : "outline"
          }
        >
          {registration.payment_status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Child &amp; Registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Age: {registration.child_age || "—"}</p>
          <p>Package: {registration.package_selected || "—"}</p>
          <p>
            {registration.program_slug
              ? `Program: ${registration.program_slug}`
              : `Season ID: ${registration.season_id || "—"}`}
          </p>
          <p>
            Registered:{" "}
            {registration.registered_at
              ? new Date(registration.registered_at).toLocaleDateString()
              : "—"}
          </p>
          {registration.legacy_registration_id && (
            <p className="text-muted-foreground">
              Legacy ID: {registration.legacy_registration_id}
            </p>
          )}
          {registration.data_quality_flags && (
            <p className="text-destructive">
              Data quality: {registration.data_quality_flags}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent / Guardian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{registration.parent_name || "—"}</p>
          <p>{registration.parent_email || "—"}</p>
          <p>{registration.parent_phone || "—"}</p>
          <p>{registration.address || "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{registration.emergency_contact_name || "—"}</p>
          <p>{registration.emergency_contact_phone || "—"}</p>
          <p>{registration.emergency_contact_email || "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {!registration.allergies && !registration.medications ? (
            <p className="text-muted-foreground">None noted</p>
          ) : (
            <>
              {registration.allergies && <p>Allergies: {registration.allergies}</p>}
              {registration.medications && (
                <p>Medications: {registration.medications}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <PaymentStatusSelect
            registrationId={registration.id}
            currentStatus={registration.payment_status}
          />
          <p>Amount paid: {formatCents(registration.amount_paid_cents)}</p>
          {registration.payment_method && (
            <p>Method: {registration.payment_method}</p>
          )}
          {registration.zelle_payer_name && (
            <p>Zelle payer: {registration.zelle_payer_name}</p>
          )}
          {registration.discount_notes && (
            <p>Discount notes: {registration.discount_notes}</p>
          )}
          {registration.receipt_url && (
            <p>
              <a
                href={registration.receipt_url}
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                Receipt
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments Ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md border border-border px-4 py-2 text-sm"
              >
                <span>
                  {new Date(p.paid_at).toLocaleDateString()}{" "}
                  <Badge variant="outline">{p.method}</Badge>
                  {p.notes && (
                    <span className="ml-2 text-muted-foreground">{p.notes}</span>
                  )}
                </span>
                <span>{formatCents(p.amount_cents)}</span>
              </li>
            ))}
            {payments.length === 0 && (
              <li className="text-sm text-muted-foreground">
                No payments recorded yet.
              </li>
            )}
          </ul>
          <RecordPaymentForm registrationId={registration.id} />
        </CardContent>
      </Card>
    </div>
  );
}
