import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  Users,
  MousePointerClick,
  Flag,
  KeyRound,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = { title: "Détail campagne" };
export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }
> = {
  draft: { label: "Brouillon", variant: "outline", icon: <Clock className="w-3 h-3" /> },
  scheduled: { label: "Planifiée", variant: "secondary", icon: <Calendar className="w-3 h-3" /> },
  running: { label: "En cours", variant: "default", icon: <Mail className="w-3 h-3" /> },
  completed: { label: "Terminée", variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Annulée", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode }> = {
  email: { label: "Email", icon: <Mail className="w-4 h-4" /> },
  sms: { label: "SMS", icon: <Smartphone className="w-4 h-4" /> },
  whatsapp: { label: "WhatsApp", icon: <MessageSquare className="w-4 h-4" /> },
};

const DIFFICULTY_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  easy: { label: "Facile", variant: "secondary" },
  medium: { label: "Moyen", variant: "default" },
  hard: { label: "Difficile", variant: "destructive" },
};

function pct(num: number, denom: number): string {
  if (denom === 0) return "—";
  return `${((num / denom) * 100).toFixed(1)} %`;
}

function durationLabel(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(0)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: campaign }, { data: events }] = await Promise.all([
    supabase
      .from("phishing_campaigns")
      .select(
        `
        id, name, status, target_cohort_filter, scheduled_at, sent_at, completed_at, created_at, approved_at,
        phishing_templates(name, channel, difficulty, sender_email, landing_page_slug, topic_tags, subject),
        profiles!phishing_campaigns_created_by_fkey(full_name)
      `
      )
      .eq("id", id)
      .single(),

    // Événements agrégés par type pour cette campagne
    supabase
      .from("phishing_events")
      .select("event_type, dwell_time_ms, occurred_at")
      .eq("campaign_id", id)
      .order("occurred_at", { ascending: false }),
  ]);

  if (!campaign) notFound();

  const template = campaign.phishing_templates as unknown as {
    name: string;
    channel: string;
    difficulty: string;
    sender_email: string | null;
    landing_page_slug: string | null;
    topic_tags: string[];
    subject: string | null;
  } | null;

  const creator = campaign.profiles as unknown as { full_name: string } | null;
  const statusMeta = STATUS_META[campaign.status] ?? STATUS_META["draft"]!;
  const channel = template ? CHANNEL_META[template.channel] ?? CHANNEL_META["email"]! : null;
  const diff = template ? DIFFICULTY_META[template.difficulty] ?? DIFFICULTY_META["medium"]! : null;

  // KPIs par type d'événement
  const counts = {
    delivered: 0,
    opened: 0,
    clicked: 0,
    submitted_credentials: 0,
    reported: 0,
  };

  const dwellTimes: number[] = [];

  for (const ev of events ?? []) {
    const t = ev.event_type as keyof typeof counts;
    if (t in counts) counts[t]++;
    if (t === "clicked" && ev.dwell_time_ms !== null) {
      dwellTimes.push(ev.dwell_time_ms);
    }
  }

  const avgDwell =
    dwellTimes.length > 0
      ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
      : null;

  // Cohort filter
  const filter = campaign.target_cohort_filter as {
    departments?: string[];
    roles?: string[];
    sites?: string[];
  } | null;
  const hasFilter =
    (filter?.departments?.length ?? 0) > 0 ||
    (filter?.roles?.length ?? 0) > 0 ||
    (filter?.sites?.length ?? 0) > 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Retour + titre */}
      <div className="flex items-start gap-3">
        <Link
          href="/admin/campaigns"
          className="mt-1 p-1.5 rounded-md hover:bg-bg-subtle transition-colors text-fg-subtle hover:text-fg-DEFAULT"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-fg-DEFAULT truncate">{campaign.name}</h1>
            <Badge variant={statusMeta.variant} className="gap-1">
              {statusMeta.icon}
              {statusMeta.label}
            </Badge>
          </div>
          <p className="text-sm text-fg-muted mt-0.5">
            Créée le {formatDate(campaign.created_at)}
            {creator ? ` par ${creator.full_name}` : ""}
          </p>
        </div>
      </div>

      {/* KPIs phishing */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="text-base font-semibold text-fg-DEFAULT mb-3">
          Résultats de la campagne
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Envois */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-fg-subtle text-xs font-medium uppercase tracking-wide">
              <Send className="w-3.5 h-3.5" />
              Envois
            </div>
            <p className="text-3xl font-bold font-mono text-fg-DEFAULT">{counts.delivered}</p>
            <p className="text-xs text-fg-subtle">emails livrés</p>
          </div>

          {/* Ouvertures */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-fg-subtle text-xs font-medium uppercase tracking-wide">
              <Mail className="w-3.5 h-3.5" />
              Ouvertures
            </div>
            <p className="text-3xl font-bold font-mono text-fg-DEFAULT">{counts.opened}</p>
            <p className="text-xs text-fg-subtle">{pct(counts.opened, counts.delivered)} des envois</p>
          </div>

          {/* Clics */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-risk-high">
              <MousePointerClick className="w-3.5 h-3.5" />
              Clics
            </div>
            <p
              className={`text-3xl font-bold font-mono ${
                counts.clicked === 0
                  ? "text-risk-low"
                  : counts.clicked / Math.max(counts.delivered, 1) < 0.1
                  ? "text-risk-medium"
                  : "text-risk-critical"
              }`}
            >
              {counts.clicked}
            </p>
            <p className="text-xs text-fg-subtle">{pct(counts.clicked, counts.delivered)} des envois</p>
          </div>

          {/* Identifiants soumis */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-risk-critical">
              <KeyRound className="w-3.5 h-3.5" />
              Identifiants
            </div>
            <p
              className={`text-3xl font-bold font-mono ${
                counts.submitted_credentials > 0 ? "text-risk-critical" : "text-risk-low"
              }`}
            >
              {counts.submitted_credentials}
            </p>
            <p className="text-xs text-fg-subtle">soumissions de credentials</p>
          </div>

          {/* Signalements */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-risk-low">
              <Flag className="w-3.5 h-3.5" />
              Signalements
            </div>
            <p
              className={`text-3xl font-bold font-mono ${
                counts.reported / Math.max(counts.delivered, 1) >= 0.3
                  ? "text-risk-low"
                  : counts.reported > 0
                  ? "text-risk-medium"
                  : "text-risk-high"
              }`}
            >
              {counts.reported}
            </p>
            <p className="text-xs text-fg-subtle">{pct(counts.reported, counts.delivered)} des envois</p>
          </div>
        </div>

        {/* Dwell Time */}
        {avgDwell !== null && (
          <div className="mt-3 bg-white rounded-xl border border-border p-4 flex items-center gap-4">
            <Clock className="w-5 h-5 text-fg-subtle shrink-0" />
            <div>
              <p className="text-sm font-medium text-fg-DEFAULT">
                Dwell Time moyen (clic) :{" "}
                <span className="font-mono font-bold">{durationLabel(avgDwell)}</span>
              </p>
              <p className="text-xs text-fg-subtle mt-0.5">
                Temps moyen entre la livraison et le premier clic. Objectif &gt; 5 min (lecture attentive).
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Grille métadonnées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Détails template */}
        <section className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-fg-DEFAULT">Template de simulation</h2>
          {template ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Nom</dt>
                <dd className="font-medium text-fg-DEFAULT text-right">{template.name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Canal</dt>
                <dd className="flex items-center gap-1.5 text-fg-DEFAULT">
                  {channel?.icon}
                  {channel?.label}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Difficulté</dt>
                <dd>
                  {diff && (
                    <Badge variant={diff.variant} className="text-xs">
                      {diff.label}
                    </Badge>
                  )}
                </dd>
              </div>
              {template.subject && (
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-subtle">Sujet</dt>
                  <dd className="text-fg-DEFAULT text-right truncate max-w-[200px]">
                    {template.subject}
                  </dd>
                </div>
              )}
              {template.sender_email && (
                <div className="flex justify-between gap-2">
                  <dt className="text-fg-subtle">Expéditeur</dt>
                  <dd className="font-mono text-xs text-fg-muted text-right">{template.sender_email}</dd>
                </div>
              )}
              {template.topic_tags.length > 0 && (
                <div className="flex justify-between gap-2 items-start">
                  <dt className="text-fg-subtle shrink-0">Tags</dt>
                  <dd className="flex flex-wrap gap-1 justify-end">
                    {template.topic_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-xs bg-bg-subtle text-fg-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-fg-muted">Template introuvable.</p>
          )}
        </section>

        {/* Détails planification + ciblage */}
        <section className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-fg-DEFAULT">Planification et ciblage</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-fg-subtle">Statut</dt>
              <dd>
                <Badge variant={statusMeta.variant} className="gap-1 text-xs">
                  {statusMeta.icon}
                  {statusMeta.label}
                </Badge>
              </dd>
            </div>
            {campaign.scheduled_at && (
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Planifiée le</dt>
                <dd className="text-fg-DEFAULT text-right">
                  {formatDateTime(campaign.scheduled_at)}
                </dd>
              </div>
            )}
            {campaign.sent_at && (
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Envoyée le</dt>
                <dd className="text-fg-DEFAULT text-right">{formatDateTime(campaign.sent_at)}</dd>
              </div>
            )}
            {campaign.completed_at && (
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Terminée le</dt>
                <dd className="text-fg-DEFAULT text-right">
                  {formatDateTime(campaign.completed_at)}
                </dd>
              </div>
            )}
            {campaign.approved_at && (
              <div className="flex justify-between gap-2">
                <dt className="text-fg-subtle">Approuvée le</dt>
                <dd className="text-fg-DEFAULT text-right">
                  {formatDateTime(campaign.approved_at)}
                </dd>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <dt className="text-fg-subtle mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Cohorte ciblée
              </dt>
              {!hasFilter ? (
                <dd className="text-sm text-fg-DEFAULT">Tous les employés consentants</dd>
              ) : (
                <dd className="space-y-1">
                  {(filter?.departments?.length ?? 0) > 0 && (
                    <p className="text-xs text-fg-muted">
                      Départements : {filter!.departments!.join(", ")}
                    </p>
                  )}
                  {(filter?.roles?.length ?? 0) > 0 && (
                    <p className="text-xs text-fg-muted">
                      Rôles : {filter!.roles!.join(", ")}
                    </p>
                  )}
                  {(filter?.sites?.length ?? 0) > 0 && (
                    <p className="text-xs text-fg-muted">
                      Sites : {filter!.sites!.join(", ")}
                    </p>
                  )}
                </dd>
              )}
            </div>
          </dl>
        </section>
      </div>

      {/* Bannière données insuffisantes */}
      {counts.delivered === 0 && campaign.status !== "draft" && campaign.status !== "scheduled" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Aucun événement enregistré pour cette campagne. L'Edge Function d'envoi n'a peut-être pas
            encore été exécutée, ou les événements sont en cours de traitement.
          </span>
        </div>
      )}

      {/* Mentions confidentialité */}
      <p className="text-xs text-fg-subtle">
        Les données présentées sont agrégées. Les événements individuels sont pseudonymisés dans les
        rapports. Toute consultation individuelle doit être justifiée et est tracée dans le journal
        d'audit.
      </p>
    </div>
  );
}
