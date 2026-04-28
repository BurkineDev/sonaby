import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/admin/kpi-card";
import { CmiGauge } from "@/components/admin/cmi-gauge";
import { DeptRankingCard } from "@/components/admin/dept-ranking-card";
import { formatDateTime } from "@/lib/utils";
import { BarChart3, Users2, ShieldCheck, Flame } from "lucide-react";

export const metadata: Metadata = { title: "Tableau de bord direction — SONABHY" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: globalScore }, , { data: deptScores }] =
    await Promise.all([
      supabase
        .from("cohort_scores")
        .select(
          "cyber_maturity_index, avg_score, phishing_click_rate, phishing_report_rate, completion_rate, user_count, snapshot_date"
        )
        .is("department_id", null)
        .order("snapshot_date", { ascending: false })
        .limit(2),

      supabase
        .from("mv_org_kpis_daily")
        .select("day, click_rate_pct, report_rate_pct, delivered, clicked, reported")
        .order("day", { ascending: false })
        .limit(90),

      supabase
        .from("mv_dept_scores_latest")
        .select("department_id, department_name, user_count, avg_score, median_score")
        .order("avg_score", { ascending: false }),
    ]);

  const latest   = globalScore?.[0];
  const previous = globalScore?.[1];

  const cmi = latest?.cyber_maturity_index ?? null;
  const cmiDelta =
    latest && previous
      ? parseFloat(
          (
            (latest.cyber_maturity_index ?? 0) -
            (previous.cyber_maturity_index ?? 0)
          ).toFixed(1)
        )
      : null;

  const clickRate =
    latest?.phishing_click_rate
      ? (latest.phishing_click_rate * 100).toFixed(1)
      : null;
  const reportRate =
    latest?.phishing_report_rate
      ? (latest.phishing_report_rate * 100).toFixed(1)
      : null;
  const completionRate =
    latest?.completion_rate
      ? (latest.completion_rate * 100).toFixed(1)
      : null;

  const now = new Date();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FC" }}>
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div
        className="px-4 py-6 sm:px-8 sm:py-8"
        style={{
          background: "linear-gradient(135deg, #163061 0%, #1F3F7A 60%, #2F5696 100%)",
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            {/* Surtitre */}
            <div className="flex items-center gap-2 mb-2">
              <Flame
                className="w-4 h-4"
                style={{ color: "#E8A228" }}
                aria-hidden="true"
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#E8A228" }}
              >
                Société Nationale Burkinabè des Hydrocarbures
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white">
              Tableau de bord direction
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
              CyberGuard · Programme de sensibilisation Lot 2 · {formatDateTime(now)}
            </p>
          </div>

          {/* Badge Comex-ready */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(201,139,26,0.18)",
              border: "1px solid rgba(201,139,26,0.40)",
              color: "#F5C842",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Comex-ready
          </div>
        </div>

        {/* ── Métriques rapides dans le header ── */}
        {latest && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-3.5 h-3.5" style={{ color: "#E8A228" }} aria-hidden="true" />
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>CMI Global</p>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {Math.round(cmi ?? 0)}
                <span className="text-sm font-normal ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>/100</span>
              </p>
            </div>

            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users2 className="w-3.5 h-3.5" style={{ color: "#E8A228" }} aria-hidden="true" />
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Utilisateurs actifs</p>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {latest.user_count ?? 0}
              </p>
            </div>

            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#E8A228" }} aria-hidden="true" />
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Taux complétion</p>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {completionRate ?? "—"}
                {completionRate && <span className="text-sm font-normal ml-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>%</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <div className="px-4 py-6 sm:px-8 sm:py-8 space-y-8">

        {/* Ligne 1 : CMI jauge + KPIs phishing */}
        <div>
          <h2 className="section-heading mb-5">Indicateurs de maturité cyber</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <CmiGauge
                value={cmi ?? 0}
                delta={cmiDelta}
                label="Cyber Maturity Index"
                description="Score composite 0–100 représentant la maturité cyber de l'organisation SONABHY"
              />
            </div>

            <KpiCard
              label="Taux de clic phishing"
              value={clickRate ? parseFloat(clickRate) : null}
              unit="%"
              delta={null}
              deltaPeriod="vs trimestre précédent"
              description="Proportion d'employés ayant cliqué sur une simulation d'hameçonnage"
              invertDelta={true}
              target="< 5 % à T+12 mois"
              accentColor="red"
            />

            <KpiCard
              label="Taux de signalement"
              value={reportRate ? parseFloat(reportRate) : null}
              unit="%"
              delta={null}
              deltaPeriod="vs trimestre précédent"
              description="Proportion d'employés ayant signalé spontanément un email suspect (Report Rate)"
              invertDelta={false}
              target="≥ 35 % à T+12 mois"
              accentColor="green"
            />
          </div>
        </div>

        {/* Ligne 2 : Classements départements */}
        {deptScores && deptScores.length > 0 && (
          <div>
            <h2 className="section-heading mb-5">Performance par département</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DeptRankingCard
                title="Meilleure progression"
                departments={[...deptScores]
                  .sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0))
                  .slice(0, 3)}
                showAsBest
              />
              <DeptRankingCard
                title="Zones à renforcer"
                departments={[...deptScores]
                  .sort((a, b) => (a.avg_score ?? 0) - (b.avg_score ?? 0))
                  .slice(0, 3)}
                showAsBest={false}
              />
            </div>
          </div>
        )}

        {/* Pas de données */}
        {!latest && (
          <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(22,48,97,0.08)" }}
            >
              <BarChart3 className="w-7 h-7" style={{ color: "#163061" }} aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-fg-DEFAULT mb-2">
              Aucune donnée disponible
            </p>
            <p className="text-sm text-fg-muted max-w-sm mx-auto">
              Les KPIs seront calculés après le premier snapshot nocturne (02h15 UTC).
              Lancez une campagne et patientez jusqu'au lendemain matin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
