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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/auth/login");

  let profile: { role?: string | null; onboarding_done?: boolean | null } | null = null;
  let profileError: { message?: string } | null = null;

  try {
    const result = await supabase
      .from("profiles")
      .select("role, onboarding_done")
      .eq("id", user.id)
      .maybeSingle();

    profile = result.data;
    profileError = result.error;
  } catch (err) {
    console.error("[EmployeeLayout] Profile lookup failed:", err);
  }

  if (!profile && !profileError) redirect("/onboarding");
  if (profile && !profile.onboarding_done) redirect("/onboarding");
  if (profileError) {
    console.error("[EmployeeLayout] Profile query error:", profileError.message);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* md: left padding = sidebar width (w-60 = 240px) so content clears the fixed sidebar */}
      <main className="flex-1 pb-20 md:pb-0 md:pl-60">{children}</main>

      {/* Navigation bottom (mobile) + fixed sidebar (desktop) */}
      <BottomNav role={profile?.role ?? "user"} />
    </div>
  );
}
