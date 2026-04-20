import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Calendar, Users, CheckCircle, Clock, XCircle } from "lucide-react";

export const metadata: Metadata = { title: "Gestion des campagnes" };

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  draft: { label: "Brouillon", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  scheduled: { label: "Planifiée", variant: "secondary", icon: <Calendar className="w-3 h-3" /> },
  running: { label: "En cours", variant: "default", icon: <Mail className="w-3 h-3" /> },
  completed: { label: "Terminée", variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Annulée", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("phishing_campaigns")
    .select(`
      id, name, status, scheduled_at, sent_at, completed_at, created_at,
      phishing_templates(name, channel, difficulty),
      profiles!phishing_campaigns_created_by_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      {/* Entête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg-DEFAULT">Campagnes de simulation</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            Planifiez et suivez vos simulations de phishing
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle campagne
          </Link>
        </Button>
      </div>

      {/* Liste des campagnes */}
      {!campaigns || campaigns.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-12 text-center space-y-3">
          <Mail className="w-10 h-10 text-fg-subtle mx-auto" />
          <p className="text-fg-muted">Aucune campagne créée.</p>
          <Button asChild>
            <Link href="/admin/campaigns/new">Créer la première campagne</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-subtle border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Campagne
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden md:table-cell">
                  Canal / Difficulté
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                  Planifiée le
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                  Créée par
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((campaign) => {
                const statusMeta = STATUS_META[campaign.status] ?? STATUS_META["draft"]!;
                const template = campaign.phishing_templates as unknown as { name: string; channel: string; difficulty: string } | null;
                const creator = campaign.profiles as unknown as { full_name: string } | null;

                return (
                  <tr key={campaign.id} className="hover:bg-bg-subtle transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg-DEFAULT">{campaign.name}</p>
                      {template && (
                        <p className="text-xs text-fg-subtle">{template.name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMeta.variant} className="gap-1">
                        {statusMeta.icon}
                        {statusMeta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-fg-muted capitalize">
                      {template?.channel ?? "—"} · {template?.difficulty ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-fg-muted">
                      {campaign.scheduled_at ? formatDate(campaign.scheduled_at) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-fg-muted">
                      {creator?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="text-primary-600 hover:underline text-xs font-medium"
                      >
                        Détail →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
