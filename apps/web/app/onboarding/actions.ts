"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { z } from "zod";

const OnboardingSchema = z.object({
  fullName: z.string().min(2, "Nom trop court").max(100, "Nom trop long").trim(),
  consents: z.object({
    phishing_simulation: z.boolean(),
    behavior_analytics: z.boolean(),
    individual_reporting: z.boolean(),
  }),
});

type OnboardingInput = z.infer<typeof OnboardingSchema>;

/**
 * Server Action : finalise l'onboarding.
 * - Crée ou met à jour le profil
 * - Insère les consentements (append-only)
 * - Marque onboarding_done = true
 */
export async function completeOnboarding(
  input: OnboardingInput
): Promise<{ error?: string }> {
  const parsed = OnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }

  const { fullName, consents } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session invalide. Reconnectez-vous." };
  }

  // V1 mono-tenant : l'ID de SONABHY est fixe et connu.
  // On évite la query RLS sur organizations pendant l'onboarding
  // (l'utilisateur n'a pas encore de profil à ce stade).
  const SONABHY_ORG_ID = "00000000-0000-0000-0000-000000000001";

  // Upsert du profil
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      organization_id: SONABHY_ORG_ID,
      email: user.email ?? "",
      full_name: fullName,
      onboarding_done: true,
      enrolled_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    logger.error({ userId: user.id, error: profileError.message }, "[Onboarding] Erreur profil");
    return { error: "Erreur lors de la création du profil. Réessayez." };
  }

  // Insérer les consentements (append-only, loi 010-2004 BF)
  const consentScopes = [
    ["phishing_simulation", consents.phishing_simulation],
    ["behavior_analytics", consents.behavior_analytics],
    ["individual_reporting", consents.individual_reporting],
  ] as const;

  for (const [scope, granted] of consentScopes) {
    const { error: consentError } = await supabase.from("security_consents").insert({
      user_id: user.id,
      scope,
      granted,
    });

    if (consentError) {
      logger.warn(
        { userId: user.id, scope, error: consentError.message },
        "[Onboarding] Erreur consentement"
      );
      // Non bloquant — on continue (sera réessayé ou revu en profil)
    }
  }

  logger.info({ userId: user.id, fullName }, "[Onboarding] Inscription finalisée");
  return {};
}
