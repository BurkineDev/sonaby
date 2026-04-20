import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/employee/bottom-nav";

export default async function EmployeeLayout({
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
    .select("role, onboarding_done, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_done) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Contenu principal — avec padding pour la bottom nav mobile */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Navigation bottom (mobile) */}
      <BottomNav role={profile.role} />
    </div>
  );
}
