import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { CsvImporter } from "./csv-importer";

export const metadata: Metadata = { title: "Import utilisateurs CSV" };

export default async function ImportUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/employee");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg-DEFAULT mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Gestion des utilisateurs
        </Link>

        <h1 className="text-2xl font-bold text-fg-DEFAULT">Import CSV utilisateurs</h1>
        <p className="text-sm text-fg-muted mt-1">
          Importez jusqu'à 5 000 utilisateurs SONABHY depuis un fichier CSV.
          Un email d'invitation est envoyé automatiquement à chaque nouvel utilisateur.
        </p>
      </div>

      {/* Avertissement sécurité */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Bonnes pratiques</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Le fichier CSV ne doit pas contenir de mots de passe.</li>
            <li>Validez toujours en dry-run avant l'import réel.</li>
            <li>Les imports sont tracés dans l'audit log.</li>
            <li>Maximum 5 000 lignes par import. Fractionner si nécessaire.</li>
          </ul>
        </div>
      </div>

      <CsvImporter />
    </div>
  );
}
