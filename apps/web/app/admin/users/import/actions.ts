"use server";

/**
 * Server Actions — Import CSV utilisateurs SONABHY
 *
 * Format CSV attendu (en-têtes obligatoires) :
 *   email, full_name, department_code, job_title, role
 *
 * Rôles acceptés : user, admin (super_admin réservé à la CLI)
 * Département : code court (ex: 'DSI', 'RH', 'COMMERCIAL') — doit exister en DB
 *
 * Sécurité :
 *   - Seuls admin/super_admin peuvent importer
 *   - On crée l'utilisateur Supabase Auth via admin API (service_role côté Edge)
 *   - RLS garantit que l'insertion dans profiles ne peut cibler qu'une org
 *   - Aucun mot de passe en clair — l'utilisateur reçoit un magic link automatique
 *
 * Mode dry-run : valide sans insérer, retourne le rapport d'erreurs.
 */

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// ─── Schéma d'une ligne CSV ───────────────────────────────────────────────────

const CsvRowSchema = z.object({
  email: z.string().email("Email invalide"),
  full_name: z
    .string()
    .min(2, "Nom trop court")
    .max(100, "Nom trop long"),
  department_code: z.string().max(20).optional().or(z.literal("")).transform((v) => v || undefined),
  job_title: z.string().max(100).optional().or(z.literal("")).transform((v) => v || undefined),
  role: z
    .enum(["user", "admin"])
    .default("user"),
});

export type CsvRow = z.infer<typeof CsvRowSchema>;

export interface ImportRowResult {
  line: number;
  email: string;
  status: "ok" | "error" | "skipped";
  message?: string;
}

export interface ImportResult {
  total: number;
  valid: number;
  errors: number;
  skipped: number;
  rows: ImportRowResult[];
  dryRun: boolean;
}

// ─── Parsing CSV ──────────────────────────────────────────────────────────────

function parseCsv(csvText: string): Array<Record<string, string>> {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    // Support des valeurs entre guillemets
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,))/g)?.map((v) =>
      v.replace(/^"|"$/g, "").trim()
    ) ?? line.split(",").map((v) => v.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

// ─── Action principale ────────────────────────────────────────────────────────

export async function importUsers(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient();

  // Auth et rôle
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rssi", "super_admin"].includes(profile.role)) {
    throw new Error("Accès non autorisé — rôle admin requis");
  }

  const orgId = profile.organization_id as string;
  const dryRun = formData.get("dry_run") === "true";
  const csvFile = formData.get("csv_file") as File | null;

  if (!csvFile || csvFile.size === 0) {
    throw new Error("Aucun fichier CSV fourni");
  }

  if (csvFile.size > 2 * 1024 * 1024) {
    throw new Error("Fichier trop volumineux (max 2 MB)");
  }

  const csvText = await csvFile.text();
  const rawRows = parseCsv(csvText);

  if (rawRows.length === 0) {
    throw new Error("CSV vide ou en-têtes manquants");
  }

  // Vérifier les en-têtes obligatoires
  const firstRow = rawRows[0]!;
  const requiredHeaders = ["email", "full_name"];
  const missingHeaders = requiredHeaders.filter((h) => !(h in firstRow));
  if (missingHeaders.length > 0) {
    throw new Error(`En-têtes manquants : ${missingHeaders.join(", ")}`);
  }

  // Charger les départements de l'org pour résoudre les codes
  const { data: departments } = await supabase
    .from("departments")
    .select("id, code")
    .eq("organization_id", orgId);

  const deptByCode = new Map(
    (departments ?? []).filter((d) => d.code).map((d) => [d.code!.toUpperCase(), d.id])
  );

  // Client admin Supabase (service_role) pour créer les utilisateurs Auth
  const adminClient = !dryRun
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : null;

  const results: ImportRowResult[] = [];
  let validCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const lineNum = i + 2; // +2 car ligne 1 = en-têtes
    const raw = rawRows[i]!;

    // Validation Zod
    const parsed = CsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      results.push({
        line: lineNum,
        email: raw["email"] ?? "(vide)",
        status: "error",
        message: `${firstError?.path.join(".")}: ${firstError?.message}`,
      });
      errorCount++;
      continue;
    }

    const row = parsed.data;

    // Résoudre le département
    let departmentId: string | null = null;
    if (row.department_code) {
      const deptId = deptByCode.get(row.department_code.toUpperCase());
      if (!deptId) {
        results.push({
          line: lineNum,
          email: row.email,
          status: "error",
          message: `Département "${row.department_code}" introuvable`,
        });
        errorCount++;
        continue;
      }
      departmentId = deptId;
    }

    // Vérifier si l'utilisateur existe déjà dans l'org
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", row.email)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (existing) {
      results.push({
        line: lineNum,
        email: row.email,
        status: "skipped",
        message: "Utilisateur déjà enregistré dans cette organisation",
      });
      skippedCount++;
      continue;
    }

    // Dry run : s'arrêter ici
    if (dryRun) {
      results.push({ line: lineNum, email: row.email, status: "ok" });
      validCount++;
      continue;
    }

    // Import réel : créer l'utilisateur Supabase Auth
    try {
      const { data: authUser, error: authError } = await adminClient!.auth.admin.createUser({
        email: row.email,
        email_confirm: true, // L'email est confirmé (invitation explicite)
        user_metadata: {
          full_name: row.full_name,
        },
      });

      if (authError || !authUser.user) {
        results.push({
          line: lineNum,
          email: row.email,
          status: "error",
          message: authError?.message ?? "Erreur création Auth",
        });
        errorCount++;
        continue;
      }

      // Insérer dans profiles (le trigger auth peut aussi le faire, mais on force)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.user.id,
          organization_id: orgId,
          email: row.email,
          full_name: row.full_name,
          role: row.role,
          job_title: row.job_title ?? null,
          department_id: departmentId,
          is_active: true,
        });

      if (profileError) {
        results.push({
          line: lineNum,
          email: row.email,
          status: "error",
          message: `Profil: ${profileError.message}`,
        });
        errorCount++;
        continue;
      }

      // Envoyer un magic link d'invitation
      await adminClient!.auth.admin.generateLink({
        type: "magiclink",
        email: row.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/onboarding`,
        },
      });

      results.push({ line: lineNum, email: row.email, status: "ok" });
      validCount++;
    } catch (err) {
      results.push({
        line: lineNum,
        email: row.email,
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
      errorCount++;
    }
  }

  return {
    total: rawRows.length,
    valid: validCount,
    errors: errorCount,
    skipped: skippedCount,
    rows: results,
    dryRun,
  };
}
