import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CmiTrendChart } from "./cmi-trend-chart";
import { TrendBadge } from "@/components/employee/trend-badge";
import { ShieldAlert, TrendingUp, Users, Activity, Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Rapports direction" };
export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(decimals)} %`;
}

function num(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(1);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. Évolution CMI sur 90 jours (à partir des cohort_scores)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const since = ninetyDaysAgo.toISOString().split("T")[0]!;

  const [
    { data: cmiHistory },
    { data: phishingHistory },
    { data: latestGlobal },
    { data: deptScores },
    { data: campaignStats },
  ] = await Promise.all([
    // CMI historique
    supabase
      .from("cohort_scores")
      .select("snapshot_date, cyber_maturity_index, avg_score, phishing_click_rate, phishing_report_rate, completion_rate, user_count")
      .is("department_id", null)
      .gte("snapshot_date", since)
      .order("snapshot_date", { ascending: true }),

    // Phishing KPIs quotidiens
    supabase
      .from("mv_org_kpis_daily")
      .select("day, click_rate_pct, report_rate_pct, delivered, clicked, reported")
      .gte("day", since)
      .order("day", { ascending: true }),

    // Dernier snapshot global (2 pour delta)
    supabase
      .from("cohort_scores")
      .select("snapshot_date, cyber_maturity_index, avg_score, phishing_click_rate, phishing_report_rate, completion_rate, user_count")
      .is("department_id", null)
      .order("snapshot_date", { ascending: false })
      .limit(2),

    // Scores par département (derniers)
    supabase
      .from("mv_dept_scores_latest")
      .select("department_name, user_count, avg_score, median_score")
      .order("avg_score", { ascending: false }),

    // Statistiques campagnes
    supabase
      .from("phishing_campaigns")
      .select("status, completed_at")
      .gte("created_at", since),
  ]);

  const current = latestGlobal?.[0];
  const previous = latestGlobal?.[1];

  const cmi = current?.cyber_maturity_index ?? null;
  const cmiPrev = previous?.cyber_maturity_index ?? null;
  const cmiDelta = cmi !== null && cmiPrev !== null ? cmi - cmiPrev : null;

  const clickRate = current?.phishing_click_rate ?? null;
  const reportRate = current?.phishing_report_rate ?? null;
  const completionRate = current?.completion_rate ?? null;
  const userCount = current?.user_count ?? 0;

  // Assembler les données pour le chart
  const chartData = (cmiHistory ?? []).map((row) => {
    const phishRow = (phishingHistory ?? []).find((p) => p.day === row.snapshot_date);
    return {
      date: row.snapshot_date,
      cmi: row.cyber_maturity_index,
      click_rate: phishRow?.click_rate_pct ?? null,
      report_rate: phishRow?.report_rate_pct ?? null,
    };
  });

  // Totaux campagnes
  const totalCampaigns = campaignStats?.length ?? 0;
  const completedCampaigns = campaignStats?.filter((c) => c.status === "completed").length ?? 0;

  // Totaux phishing (90j)
  const totalDelivered = (phishingHistory ?? []).reduce((sum, r) => sum + (r.delivered ?? 0), 0);
  const totalClicked = (phishingHistory ?? []).reduce((sum, r) => sum + (r.clicked ?? 0), 0);
  const totalReported = (phishingHistory ?? []).reduce((sum, r) => sum + (r.reported ?? 0), 0);

  return (
    <div className="p-6 space-y-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg-DEFAULT">Rapports direction</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            Vue agrégée sur 90 jours — {userCount} utilisateurs · données anonymisées par cohorte
          </p>
        </div>
        {/* Export PDF */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/reports/export?days=30"
            className="flex items-center gap-2 text-sm font-medium border border-border rounded-lg px-3 py-2 hover:bg-bg-subtle transition-colors text-fg-DEFAULT"
            aria-label="Télécharger le rapport PDF (30 jours)"
            title="Télécharger le rapport PDF — 30 derniers jours"
          >
            <Download className="w-4 h-4" />
            PDF 30j
          </Link>
          <Link
            href="/admin/reports/export?days=90"
            className="flex items-center gap-2 text-sm font-medium border border-border rounded-lg px-3 py-2 hover:bg-bg-subtle transition-colors text-fg-DEFAULT"
            aria-label="Télécharger le rapport PDF (90 jours)"
            title="Télécharger le rapport PDF — 90 derniers jours"
          >
            <Download className="w-4 h-4" />
            PDF 90j
          </Link>
        </div>
      </div>

      {/* Bannière */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 flex gap-2 text-sm text-primary-800">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-primary-600" />
        <span>
          Toutes les données présentées sont agrégées par cohorte. Aucune information nominative n&apos;est exposée dans ce rapport conformément à la politique de confidentialité SONABHY.
        </span>
      </div>

      {/* KPI cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="text-base font-semibold text-fg-DEFAULT mb-4">
          Indicateurs clés (dernière mesure)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CMI */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-1">
            <div className="flex items-center gap-2 text-fg-subtle text-xs font-medium uppercase tracking-wide">
              <TrendingUp className="w-3.5 h-3.5" />
              Cyber Maturity Index
            </div>
            <p className="text-4xl font-bold font-mono text-fg-DEFAULT">
              {cmi !== null ? cmi.toFixed(1) : "—"}
            </p>
            {cmiDelta !== null && (
              <TrendBadge delta={cmiDelta} invertColors={false} />
            )}
            <p className="text-xs text-fg-subtle">sur 100 points</p>
          </div>

          {/* Taux de clic */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-1">
            <div className="flex items-center gap-2 text-fg-subtle text-xs font-medium uppercase tracking-wide">
              <Activity className="w-3.5 h-3.5" />
              Taux de clic phishing
            </div>
            <p className={`text-4xl font-bold font-mono ${
              clickRate === null ? "text-fg-DEFAULT" :
              clickRate < 0.1 ? "text-risk-low" :
              clickRate < 0.3 ? "text-risk-medium" : "text-risk-critical"
            }`}>
              {pct(clickRate, 0)}
            </p>
            <p className="text-xs text-fg-subtle">{totalClicked} clics / {totalDelivered} envois (90j)</p>
          </div>

          {/* Taux de signalement */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-1">
            <div className="flex items-center gap-2 text-fg-subtle text-xs font-medium uppercase tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5" />
              Taux de signalement
            </div>
            <p className={`text-4xl font-bold font-mono ${
              reportRate === null ? "text-fg-DEFAULT" :
              reportRate >= 0.3 ? "text-risk-low" :
              reportRate >= 0.1 ? "text-risk-medium" : "text-risk-critical"
            }`}>
              {pct(reportRate, 0)}
            </p>
            <p className="text-xs text-fg-subtle">{totalReported} signalements (90j)</p>
          </div>

          {/* Complétion modules */}
          <div className="bg-white rounded-xl border border-border p-5 space-y-1">
            <div className="flex items-center gap-2 text-fg-subtle text-xs font-medium uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              Taux de complétion
            </div>
            <p className={`text-4xl font-bold font-mono ${
              completionRate === null ? "text-fg-DEFAULT" :
              completionRate >= 0.7 ? "text-risk-low" :
              completionRate >= 0.4 ? "text-risk-medium" : "text-risk-high"
            }`}>
              {pct(completionRate, 0)}
            </p>
            <p className="text-xs text-fg-subtle">modules de formation</p>
          </div>
        </div>
      </section>

      {/* Graphique d'évolution */}
      <section aria-labelledby="trend-heading" className="bg-white rounded-xl border border-border p-6">
        <h2 id="trend-heading" className="text-base font-semibold text-fg-DEFAULT mb-1">
          Évolution sur 90 jours
        </h2>
        <p className="text-xs text-fg-subtle mb-4">
          CMI (axe gauche) · Taux de clic et signalement en % (axe droit) — lignes pointillées : seuils de risque
        </p>
        <CmiTrendChart data={chartData} />
      </section>

      {/* Scores par département */}
      <section aria-labelledby="dept-heading">
        <h2 id="dept-heading" className="text-base font-semibold text-fg-DEFAULT mb-4">
          Score moyen par département
        </h2>
        {!deptScores || deptScores.length === 0 ? (
          <p className="text-sm text-fg-muted">Données insuffisantes.</p>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                    Département
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                    Utilisateurs
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                    Score moyen
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                    Médiane
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide text-right">
                    Niveau
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deptScores.map((dept) => {
                  const avg = dept.avg_score ?? 0;
                  const level =
                    avg >= 85 ? { label: "Excellent", color: "text-risk-excellent", bg: "bg-green-100" } :
                    avg >= 70 ? { label: "Faible risque", color: "text-risk-low", bg: "bg-green-50" } :
                    avg >= 50 ? { label: "Risque modéré", color: "text-risk-medium", bg: "bg-yellow-50" } :
                    avg >= 30 ? { label: "Risque élevé", color: "text-risk-high", bg: "bg-orange-50" } :
                    { label: "Critique", color: "text-risk-critical", bg: "bg-red-50" };

                  return (
                    <tr key={dept.department_name} className="hover:bg-bg-subtle">
                      <td className="px-4 py-3 font-medium text-fg-DEFAULT">
                        {dept.department_name}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {dept.user_count ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-fg-DEFAULT">
                            {num(dept.avg_score)}
                          </span>
                          <div className="flex-1 bg-bg-subtle rounded-full h-1.5 max-w-[80px]">
                            <div
                              className="h-1.5 rounded-full bg-primary-500 transition-all"
                              style={{ width: `${Math.min(100, avg)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-fg-muted">
                        {num(dept.median_score)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.color} ${level.bg}`}
                        >
                          {level.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Résumé campagnes */}
      <section aria-labelledby="campaigns-heading" className="bg-white rounded-xl border border-border p-6">
        <h2 id="campaigns-heading" className="text-base font-semibold text-fg-DEFAULT mb-4">
          Activité campagnes (90 jours)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          {[
            { label: "Campagnes lancées", value: totalCampaigns },
            { label: "Terminées", value: completedCampaigns },
            { label: "Emails envoyés", value: totalDelivered },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-bg-subtle p-4">
              <p className="text-3xl font-bold font-mono text-fg-DEFAULT">{stat.value}</p>
              <p className="text-xs text-fg-subtle mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
