"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// ─── Mise à jour du profil ────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, "Nom trop court").max(100).trim(),
});

export type ProfileActionState = { error?: string; success?: string };

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = UpdateProfileSchema.safeParse({
    full_name: formData.get("full_name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Données invalides" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (error) {
    logger.error({ err: error }, "Failed to update profile");
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/employee/profil");
  return { success: "Profil mis à jour." };
}

// ─── Mise à jour du consentement ──────────────────────────────────────────────

const ConsentSchema = z.object({
  scope: z.enum(["phishing_simulation", "behavior_analytics", "individual_reporting"]),
  granted: z.enum(["true", "false"]),
});

export async function updateConsent(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const parsed = ConsentSchema.safeParse({
    scope: formData.get("scope"),
    granted: formData.get("granted"),
  });

  if (!parsed.success) {
    return { error: "Paramètres invalides" };
  }

  const granted = parsed.data.granted === "true";

  // Insérer un nouveau enregistrement (append-only — la table est immuable)
  const { error } = await supabase.from("security_consents").insert({
    user_id: user.id,
    scope: parsed.data.scope,
    granted,
    ip_address: null, // côté Edge Function seulement
    user_agent: null,
  });

  if (error) {
    logger.error({ err: error }, "Failed to update consent");
    return { error: "Erreur lors de la mise à jour du consentement." };
  }

  revalidatePath("/employee/profil");
  return {
    success: granted
      ? "Consentement accordé."
      : "Consentement retiré. Cette modification prend effet immédiatement.",
  };
}
