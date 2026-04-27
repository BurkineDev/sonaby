"use server";

/**
 * Server Actions — Gestion des modules de contenu
 * Protégées par vérification de rôle admin/rssi/super_admin côté Supabase (RLS).
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ModuleBodySchema } from "@/lib/shared";

// ─── Schéma de création d'un module ──────────────────────────────────────────

const TOPIC_TAGS = [
  "phishing_email", "phishing_sms", "phishing_whatsapp",
  "mobile_money", "credentials_management", "mfa_usage",
  "physical_security", "usb_and_removable", "travel_security",
  "byod", "secure_comms", "data_classification",
  "incident_reporting", "social_engineering", "supply_chain", "executive_fraud",
] as const;

const CreateModuleSchema = z.object({
  title: z.string().min(3, "Titre trop court (min 3 car)").max(120, "Titre trop long"),
  kind: z.enum(["micro_lesson", "quiz", "video", "scenario", "jit_remediation"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimated_minutes: z.coerce.number().int().min(1).max(60),
  topic_tags: z.array(z.enum(TOPIC_TAGS)).min(1, "Au moins un tag requis"),
  learning_path_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || undefined),
  body: ModuleBodySchema,
  is_published: z.boolean().default(false),
});

export type CreateModuleState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  moduleId?: string;
};

export async function createModule(
  _prev: CreateModuleState,
  formData: FormData
): Promise<CreateModuleState> {
  const supabase = await createClient();

  // Vérification d'authentification et de rôle
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rssi", "super_admin"].includes(profile.role)) {
    return { error: "Accès non autorisé" };
  }

  if (!profile.organization_id) {
    return { error: "Votre profil n'est pas rattaché à une organisation. Contactez un super administrateur." };
  }

  // Parser le body JSON depuis le formulaire
  let bodyRaw: unknown;
  try {
    bodyRaw = JSON.parse(formData.get("body") as string);
  } catch {
    return { error: "Le contenu du module est invalide (JSON malformé)" };
  }

  // Parser les topic_tags (JSON array)
  let topicTagsRaw: unknown;
  try {
    topicTagsRaw = JSON.parse(formData.get("topic_tags") as string);
  } catch {
    return { error: "Les tags sont invalides" };
  }

  const raw = {
    title: formData.get("title"),
    kind: formData.get("kind"),
    difficulty: formData.get("difficulty"),
    estimated_minutes: formData.get("estimated_minutes"),
    topic_tags: topicTagsRaw,
    learning_path_id: formData.get("learning_path_id"),
    body: bodyRaw,
    is_published: formData.get("is_published") === "true",
  };

  const parsed = CreateModuleSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    // Construire un message lisible qui liste les premiers problèmes
    const fieldMessages = Object.entries(flat.fieldErrors)
      .map(([f, msgs]) => `${f}: ${(msgs as string[]).join(", ")}`)
      .join(" | ");
    const formMessages = flat.formErrors.join(" | ");
    const detail = [fieldMessages, formMessages].filter(Boolean).join(" | ");
    return {
      error: `Données invalides${detail ? ` — ${detail}` : ""}`,
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  const { data, error } = await supabase
    .from("modules")
    .insert({
      organization_id: profile.organization_id,
      title: parsed.data.title,
      kind: parsed.data.kind,
      difficulty: parsed.data.difficulty,
      estimated_minutes: parsed.data.estimated_minutes,
      topic_tags: parsed.data.topic_tags,
      learning_path_id: parsed.data.learning_path_id ?? null,
      body: parsed.data.body as unknown as Record<string, unknown>,
      is_published: parsed.data.is_published,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createModule]", error);
    // Retourner le message Supabase pour faciliter le débogage
    const detail = error?.message ?? error?.details ?? "Erreur inconnue";
    return { error: `Erreur lors de la création du module : ${detail}` };
  }

  revalidatePath("/admin/content");
  redirect(`/admin/content/${data.id}`);
}

// ─── Mise à jour du statut de publication ─────────────────────────────────────

export async function toggleModulePublished(
  moduleId: string,
  published: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await supabase
    .from("modules")
    .update({ is_published: published })
    .eq("id", moduleId);

  if (error) return { error: error.message };

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${moduleId}`);
  return {};
}

// ─── Suppression (soft : is_published = false + archivage) ────────────────────

export async function archiveModule(moduleId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rssi", "super_admin"].includes(profile.role)) {
    return { error: "Accès non autorisé — rôle admin requis" };
  }

  const { error } = await supabase
    .from("modules")
    .update({ is_published: false })
    .eq("id", moduleId);

  if (error) return { error: error.message };

  revalidatePath("/admin/content");
  return {};
}
