"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const CreateCampaignSchema = z.object({
  name: z.string().min(3, "Nom trop court").max(120).trim(),
  template_id: z.string().uuid("Template requis"),
  // Ciblage cohorte — au moins un critère
  target_department_ids: z.array(z.string().uuid()).optional(),
  target_roles: z
    .array(z.enum(["employee", "manager", "admin", "super_admin"]))
    .optional(),
  // Planification
  scheduled_at: z
    .string()
    .min(1, "Date requise")
    .refine((v) => new Date(v) > new Date(), {
      message: "La date doit être dans le futur",
    }),
});

export type CreateCampaignState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createCampaign(
  _prev: CreateCampaignState,
  formData: FormData
): Promise<CreateCampaignState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Non authentifié" };

  // Vérifier le rôle
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { message: "Accès non autorisé" };
  }

  if (!profile.organization_id) {
    return { message: "Votre profil n'est pas rattaché à une organisation. Contactez un super administrateur." };
  }

  // Parser et valider les champs
  const deptIds = formData.getAll("target_department_ids") as string[];
  const roles = formData.getAll("target_roles") as string[];

  const parsed = CreateCampaignSchema.safeParse({
    name: formData.get("name"),
    template_id: formData.get("template_id"),
    target_department_ids: deptIds.filter(Boolean),
    target_roles: roles.filter(Boolean),
    scheduled_at: formData.get("scheduled_at"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, template_id, target_department_ids, target_roles, scheduled_at } =
    parsed.data;

  // Construire la cible (target_cohort_filter JSONB)
  const target_cohort_filter: Record<string, unknown> = {};
  if (target_department_ids && target_department_ids.length > 0) {
    target_cohort_filter["departments"] = target_department_ids;
  }
  if (target_roles && target_roles.length > 0) {
    target_cohort_filter["roles"] = target_roles;
  }

  const { data: campaign, error } = await supabase
    .from("phishing_campaigns")
    .insert({
      name,
      template_id,
      organization_id: profile.organization_id,
      created_by: user.id,
      status: "scheduled",
      scheduled_at,
      target_cohort_filter: Object.keys(target_cohort_filter).length > 0 ? target_cohort_filter : {},
    })
    .select("id")
    .single();

  if (error || !campaign) {
    logger.error({ err: error }, "Failed to create campaign");
    const detail = error?.message ?? error?.details ?? "Erreur inconnue";
    return { message: `Erreur lors de la création de la campagne : ${detail}` };
  }

  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${campaign.id}`);
}
