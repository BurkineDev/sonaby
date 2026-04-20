import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "./landing-page";

/**
 * Page racine :
 * - Si connecté → redirige vers le bon espace (admin ou employé)
 * - Si non connecté → affiche la landing page institutionnelle SONABHY
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) redirect("/onboarding");

    const adminRoles = ["admin", "rssi", "super_admin"] as const;
    if (adminRoles.includes(profile.role as (typeof adminRoles)[number])) {
      redirect("/admin");
    }

    redirect("/employee");
  }

  return <LandingPage />;
}
