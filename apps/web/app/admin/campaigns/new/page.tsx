import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CampaignWizard } from "./campaign-wizard";

export const metadata: Metadata = { title: "Nouvelle campagne de simulation" };

export default async function NewCampaignPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: departments }] = await Promise.all([
    supabase
      .from("phishing_templates")
      .select("id, name, channel, difficulty, topic_tags, subject")
      .eq("is_active", true)
      .order("difficulty", { ascending: true }),

    supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-sm text-fg-muted">
        <Link
          href="/admin/campaigns"
          className="flex items-center gap-1 hover:text-fg-DEFAULT transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Campagnes
        </Link>
        <span>/</span>
        <span className="text-fg-DEFAULT font-medium">Nouvelle campagne</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-fg-DEFAULT">Nouvelle simulation phishing</h1>
        <p className="text-sm text-fg-muted mt-1">
          Configurez votre campagne en 4 étapes. Seuls les utilisateurs consentants seront ciblés.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <CampaignWizard
          templates={templates ?? []}
          departments={departments ?? []}
        />
      </div>
    </div>
  );
}
