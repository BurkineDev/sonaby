import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

const ADMIN_ROLES = ["admin", "rssi", "super_admin"] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
    redirect("/employee");
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F9FC" }}>
      <AdminSidebar role={profile.role} fullName={profile.full_name} />
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
