"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// ─── Mise à jour du rôle ──────────────────────────────────────────────────────

const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["employee", "manager", "admin"]),
});

export type ActionState = { error?: string; success?: string };

export async function updateUserRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "rssi", "super_admin"].includes(caller.role)) {
    return { error: "Accès non autorisé" };
  }

  const parsed = UpdateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Paramètres invalides" };
  }

  // Impossible de changer son propre rôle
  if (parsed.data.userId === user.id) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) {
    logger.error({ err: error }, "Failed to update user role");
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/admin/users");
  return { success: "Rôle mis à jour." };
}

// ─── Activation / désactivation ───────────────────────────────────────────────

const ToggleActiveSchema = z.object({
  userId: z.string().uuid(),
  active: z.enum(["true", "false"]),
});

export async function toggleUserActive(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!caller || !["admin", "rssi", "super_admin"].includes(caller.role)) {
    return { error: "Accès non autorisé" };
  }

  const parsed = ToggleActiveSchema.safeParse({
    userId: formData.get("userId"),
    active: formData.get("active"),
  });

  if (!parsed.success) return { error: "Paramètres invalides" };
  if (parsed.data.userId === user.id) {
    return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  const newActive = parsed.data.active === "true";

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: newActive })
    .eq("id", parsed.data.userId);

  if (error) {
    logger.error({ err: error }, "Failed to toggle user active");
    return { error: "Erreur lors de la mise à jour." };
  }

  revalidatePath("/admin/users");
  return { success: newActive ? "Utilisateur activé." : "Utilisateur désactivé." };
}
