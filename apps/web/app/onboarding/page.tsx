import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = {
  title: "Bienvenue — Configuration de votre compte",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, onboarding_done")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_done) redirect("/");

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <OnboardingWizard
          userId={user.id}
          email={user.email ?? ""}
          existingName={profile?.full_name ?? ""}
        />
      </div>
    </main>
  );
}
