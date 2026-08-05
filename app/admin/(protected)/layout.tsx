import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server-client";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/staff", label: "Staff" },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, is_active")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!staff) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
        <div className="font-display text-lg text-foreground">Suhbah Admin</div>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 text-xs text-muted-foreground">{staff.full_name}</p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
