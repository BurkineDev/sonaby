import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModuleForm } from "./module-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Nouveau module de formation" };

export default async function NewModulePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rssi", "super_admin"].includes(profile.role)) {
    redirect("/employee");
  }

  const { data: learningPaths } = await supabase
    .from("learning_paths")
    .select("id, title")
    .eq("is_active", true)
    .order("title");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          href="/admin/content"
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg-DEFAULT mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux contenus
        </Link>
        <h1 className="text-2xl font-bold text-fg-DEFAULT">Nouveau module</h1>
        <p className="text-sm text-fg-muted mt-1">
          Créez un module de formation. Le contenu est structuré en blocs JSON —{" "}
          un template est préchargé selon le type choisi.
        </p>
      </div>

      <ModuleForm learningPaths={learningPaths ?? []} />
    </div>
  );
}
