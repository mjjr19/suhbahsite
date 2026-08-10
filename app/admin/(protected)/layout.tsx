import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStaff } from "@/lib/supabase/staff";

const NAV = [
  { href: "/admin", label: "Dashboard", adminOnly: false },
  { href: "/admin/schedule", label: "Schedule", adminOnly: false },
  { href: "/admin/registrations", label: "Registrations", adminOnly: true },
  { href: "/admin/staff", label: "Staff", adminOnly: true },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();

  if (!staff) redirect("/admin/login");

  const nav = NAV.filter((item) => !item.adminOnly || staff.role === "admin");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
        <div className="font-display text-lg text-foreground">Suhbah Admin</div>
        <nav className="mt-6 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-xs text-muted-foreground">
          {staff.fullName} · {staff.role}
        </p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
