/**
 * pdf-report.tsx — Document PDF rapport CyberGuard SONABHY
 *
 * Rendu côté serveur uniquement via @react-pdf/renderer.
 * NE PAS importer dans des composants "use client".
 *
 * Contenu :
 *   1. En-tête : logo texte + métadonnées rapport
 *   2. Résumé exécutif : 4 KPI cards
 *   3. Évolution CMI 30 jours (SVG sparkline)
 *   4. Scores par département (tableau)
 *   5. Top 5 modules (tableau)
 *   6. Activité campagnes
 *   7. Pied de page : confidentialité + WendTech
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Line,
  Polyline,
  Rect,
  G,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;         // YYYY-MM-DD
  cmi: number | null;  // 0–100 (score brut CMI)
  click_rate: number | null;   // 0–100 (% — provient de mv_org_kpis_daily.click_rate_pct)
  report_rate: number | null;  // 0–100 (% — provient de mv_org_kpis_daily.report_rate_pct)
}

export interface DeptScore {
  department_name: string | null;
  user_count: number | null;
  avg_score: number | null;
  median_score: number | null;
}

export interface TopModule {
  title: string;
  kind: string;
  completion_count: number | null;
  avg_score: number | null;
}

export interface ReportDocumentProps {
  generatedAt: string;         // ISO string
  periodDays: number;          // 30
  cmi: number | null;
  cmiDelta: number | null;
  clickRate: number | null;    // 0–1 fraction
  reportRate: number | null;   // 0–1 fraction
  completionRate: number | null;
  userCount: number;
  totalDelivered: number;
  totalClicked: number;
  totalReported: number;
  totalCampaigns: number;
  completedCampaigns: number;
  trendData: TrendPoint[];
  deptScores: DeptScore[];
  topModules: TopModule[];
}

// ─── Palette (cohérente avec Tailwind design system) ─────────────────────────

const C = {
  primary: "#2563EB",      // blue-600
  success: "#16A34A",      // green-600
  warning: "#CA8A04",      // yellow-600
  danger: "#DC2626",       // red-600
  critical: "#7C3AED",     // violet-600
  fg: "#111827",           // gray-900
  fgMuted: "#6B7280",      // gray-500
  fgSubtle: "#9CA3AF",     // gray-400
  border: "#E5E7EB",       // gray-200
  bgSubtle: "#F9FAFB",     // gray-50
  white: "#FFFFFF",
  // Confidentiel header
  headerBg: "#1E3A5F",
  headerFg: "#FFFFFF",
} as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.fg,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  // En-tête
  header: {
    backgroundColor: C.headerBg,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flexDirection: "column", gap: 4 },
  headerOrg: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.white },
  headerTitle: { fontSize: 11, color: "#CBD5E1", marginTop: 4 },
  headerRight: { alignItems: "flex-end" },
  headerDate: { fontSize: 9, color: "#94A3B8" },
  headerPeriod: { fontSize: 9, color: "#94A3B8", marginTop: 2 },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.fg,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1 solid ${C.border}`,
  },

  // KPI cards (4 colonnes)
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  kpiCard: {
    flex: 1,
    backgroundColor: C.bgSubtle,
    borderRadius: 6,
    padding: 12,
    border: `1 solid ${C.border}`,
  },
  kpiLabel: { fontSize: 7.5, color: C.fgMuted, textTransform: "uppercase", marginBottom: 6 },
  kpiValue: { fontSize: 24, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  kpiSub: { fontSize: 7.5, color: C.fgMuted },

  // Table
  table: {
    border: `1 solid ${C.border}`,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.bgSubtle,
    borderBottom: `1 solid ${C.border}`,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottom: `0.5 solid ${C.border}`,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottom: `0.5 solid ${C.border}`,
    backgroundColor: "#FAFAFA",
  },
  thCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.fgMuted,
    textTransform: "uppercase",
  },
  tdCell: { fontSize: 9, color: C.fg },
  tdMuted: { fontSize: 9, color: C.fgMuted },

  // Activité campagnes (3 blocs)
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: C.bgSubtle,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.fg, marginBottom: 4 },
  statLabel: { fontSize: 8, color: C.fgMuted, textAlign: "center" },

  // Confidentialité
  confidBanner: {
    backgroundColor: "#FEF9C3",
    border: `1 solid #FEF08A`,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  confidText: { fontSize: 8, color: "#713F12" },

  // Pied de page
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5 solid ${C.border}`,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: C.fgSubtle },

  // Chart container
  chartBox: {
    border: `1 solid ${C.border}`,
    borderRadius: 6,
    backgroundColor: C.white,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  chartLegend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
    paddingLeft: 40,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 2, borderRadius: 1 },
  legendText: { fontSize: 7.5, color: C.fgMuted },

  // Level badge inline
  badge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },

  // Delta inline
  deltaPos: { fontSize: 8, color: C.success },
  deltaNeg: { fontSize: 8, color: C.danger },
  deltaNeut: { fontSize: 8, color: C.fgMuted },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null | undefined, decimals = 0): string {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(decimals)} %`;
}

function num(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(decimals);
}

function frDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function frDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Ouagadougou",
  });
}

function riskLevel(score: number | null): {
  label: string;
  color: string;
  bg: string;
} {
  if (score === null) return { label: "—", color: C.fgMuted, bg: C.bgSubtle };
  if (score >= 85) return { label: "Excellent", color: "#14532D", bg: "#DCFCE7" };
  if (score >= 70) return { label: "Faible risque", color: C.success, bg: "#F0FDF4" };
  if (score >= 50) return { label: "Risque modéré", color: C.warning, bg: "#FEFCE8" };
  if (score >= 30) return { label: "Risque élevé", color: "#C2410C", bg: "#FFF7ED" };
  return { label: "Critique", color: C.danger, bg: "#FEF2F2" };
}

function cmiColor(v: number | null): string {
  if (v === null) return C.fg;
  if (v >= 85) return C.success;
  if (v >= 70) return "#16A34A";
  if (v >= 50) return C.warning;
  if (v >= 30) return "#C2410C";
  return C.danger;
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    micro_lesson: "Micro-leçon",
    quiz: "Quiz",
    jit_remediation: "JIT",
    awareness_video: "Vidéo",
    scenario: "Scénario",
  };
  return map[kind] ?? kind;
}

// ─── SVG Sparkline (CMI 30 jours) ────────────────────────────────────────────

const CHART_W = 450;
const CHART_H = 100;
const PAD_L = 36;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 20;
const INNER_W = CHART_W - PAD_L - PAD_R;
const INNER_H = CHART_H - PAD_T - PAD_B;

function buildPolyline(points: Array<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function CmiSparkline({ data }: { data: TrendPoint[] }) {
  const validPoints = data.filter((d) => d.cmi !== null);
  if (validPoints.length < 2) {
    return (
      <View style={S.chartBox}>
        <Text style={[S.sectionTitle, { marginBottom: 0 }]}>
          Données insuffisantes (moins de 2 points)
        </Text>
      </View>
    );
  }

  const n = data.length;
  const xStep = n > 1 ? INNER_W / (n - 1) : INNER_W;

  // CMI line — Y: 0 (top) = 100, INNER_H (bottom) = 0
  const cmiPoints = data
    .map((d, i) => (d.cmi !== null ? {
      x: PAD_L + i * xStep,
      y: PAD_T + INNER_H - (d.cmi / 100) * INNER_H,
    } : null))
    .filter(Boolean) as Array<{ x: number; y: number }>;

  // Click rate line (fraction 0–1 → pct 0–100 on same axis)
  const clickPoints = data
    .map((d, i) => (d.click_rate !== null ? {
      x: PAD_L + i * xStep,
      y: PAD_T + INNER_H - ((d.click_rate) / 100) * INNER_H,
    } : null))
    .filter(Boolean) as Array<{ x: number; y: number }>;

  // Reference lines at CMI 85, 70, 30
  const refY = (val: number) => (PAD_T + INNER_H - (val / 100) * INNER_H).toFixed(1);

  // X axis labels (first, middle, last)
  const labelIndices = [0, Math.floor((n - 1) / 2), n - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );

  return (
    <View style={S.chartBox}>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Reference lines */}
        <G>
          {/* 85 — vert */}
          <Line
            x1={PAD_L} y1={refY(85)} x2={CHART_W - PAD_R} y2={refY(85)}
            stroke="#86EFAC" strokeWidth={0.7} strokeDasharray="3 3"
          />
          {/* 70 — jaune */}
          <Line
            x1={PAD_L} y1={refY(70)} x2={CHART_W - PAD_R} y2={refY(70)}
            stroke="#FDE047" strokeWidth={0.7} strokeDasharray="3 3"
          />
          {/* 30 — rouge */}
          <Line
            x1={PAD_L} y1={refY(30)} x2={CHART_W - PAD_R} y2={refY(30)}
            stroke="#FCA5A5" strokeWidth={0.7} strokeDasharray="3 3"
          />
        </G>

        {/* Axes */}
        <Line
          x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + INNER_H}
          stroke={C.border} strokeWidth={0.8}
        />
        <Line
          x1={PAD_L} y1={PAD_T + INNER_H} x2={CHART_W - PAD_R} y2={PAD_T + INNER_H}
          stroke={C.border} strokeWidth={0.8}
        />

        {/* Y axis labels */}
        {[100, 85, 70, 50, 30, 0].map((v) => (
          <G key={v}>
            <Rect
              x={0} y={(PAD_T + INNER_H - (v / 100) * INNER_H) - 4}
              width={PAD_L - 2} height={8}
              fill={C.white}
            />
          </G>
        ))}

        {/* CMI polyline (blue) */}
        {cmiPoints.length >= 2 && (
          <Polyline
            points={buildPolyline(cmiPoints)}
            stroke={C.primary}
            strokeWidth={2}
            fill="none"
          />
        )}

        {/* Click rate polyline (red dashed) */}
        {clickPoints.length >= 2 && (
          <Polyline
            points={buildPolyline(clickPoints)}
            stroke={C.danger}
            strokeWidth={1}
            fill="none"
            strokeDasharray="3 2"
          />
        )}

        {/* X axis date labels */}
        {labelIndices.map((i) => {
          const d = data[i];
          if (!d) return null;
          const x = PAD_L + i * xStep;
          return (
            <G key={i}>
              <Rect
                x={x - 16} y={PAD_T + INNER_H + 4}
                width={32} height={12}
                fill={C.white}
              />
            </G>
          );
        })}
      </Svg>

      {/* Date labels (text below SVG — @react-pdf doesn't support foreignObject) */}
      <View style={{ flexDirection: "row", paddingLeft: PAD_L, paddingRight: PAD_R }}>
        {labelIndices.map((i, li) => {
          const d = data[i];
          if (!d) return null;
          return (
            <Text
              key={i}
              style={{
                fontSize: 7,
                color: C.fgMuted,
                flex: li === 0 ? 0 : li === labelIndices.length - 1 ? 0 : 1,
                textAlign: li === 0 ? "left" : li === labelIndices.length - 1 ? "right" : "center",
              }}
            >
              {frDate(d.date)}
            </Text>
          );
        })}
      </View>

      {/* Légende */}
      <View style={S.chartLegend}>
        <View style={S.legendItem}>
          <View style={[S.legendDot, { backgroundColor: C.primary }]} />
          <Text style={S.legendText}>CMI</Text>
        </View>
        <View style={S.legendItem}>
          <View style={[S.legendDot, { backgroundColor: C.danger }]} />
          <Text style={S.legendText}>Taux de clic (%)</Text>
        </View>
        <View style={S.legendItem}>
          <View style={[S.legendDot, { backgroundColor: "#86EFAC", height: 1 }]} />
          <Text style={S.legendText}>Seuil 85</Text>
        </View>
        <View style={S.legendItem}>
          <View style={[S.legendDot, { backgroundColor: "#FDE047", height: 1 }]} />
          <Text style={S.legendText}>Seuil 70</Text>
        </View>
        <View style={S.legendItem}>
          <View style={[S.legendDot, { backgroundColor: "#FCA5A5", height: 1 }]} />
          <Text style={S.legendText}>Seuil 30</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function ReportDocument({
  generatedAt,
  periodDays,
  cmi,
  cmiDelta,
  clickRate,
  reportRate,
  completionRate,
  userCount,
  totalDelivered,
  totalClicked,
  totalReported,
  totalCampaigns,
  completedCampaigns,
  trendData,
  deptScores,
  topModules,
}: ReportDocumentProps) {
  const periodEnd = new Date(generatedAt);
  const periodStart = new Date(generatedAt);
  periodStart.setDate(periodStart.getDate() - periodDays);

  const periodStr = `${frDate(periodStart.toISOString())} — ${frDate(periodEnd.toISOString())}`;

  return (
    <Document
      title="Rapport CyberGuard SONABHY"
      author="WendTech"
      subject="Rapport de maturité cybersécurité"
      keywords="SONABHY cybersécurité rapport confidentiel"
    >
      <Page size="A4" style={S.page}>
        {/* ─── En-tête ─── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerOrg}>SONABHY</Text>
            <Text style={S.headerTitle}>Rapport de maturité cybersécurité</Text>
            <Text style={[S.headerTitle, { marginTop: 8, fontSize: 9 }]}>
              CyberGuard · Lot 2 — Sensibilisation
            </Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.headerDate}>Généré le {frDateTime(generatedAt)}</Text>
            <Text style={S.headerPeriod}>Période : {periodStr}</Text>
            <Text style={[S.headerPeriod, { marginTop: 6 }]}>
              {userCount} utilisateurs · données agrégées
            </Text>
          </View>
        </View>

        {/* ─── Bannière confidentialité ─── */}
        <View style={S.confidBanner}>
          <Text style={S.confidText}>
            CONFIDENTIEL — Ce document est destiné exclusivement à la Direction Générale et au RSSI de SONABHY.
            Toutes les données présentées sont agrégées par cohorte ; aucune information nominative n'est exposée.
            Distribution non autorisée interdite.
          </Text>
        </View>

        {/* ─── KPI cards ─── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Indicateurs clés (dernière mesure)</Text>
          <View style={S.kpiRow}>
            {/* CMI */}
            <View style={S.kpiCard}>
              <Text style={S.kpiLabel}>Cyber Maturity Index</Text>
              <Text style={[S.kpiValue, { color: cmiColor(cmi) }]}>
                {cmi !== null ? cmi.toFixed(1) : "—"}
              </Text>
              {cmiDelta !== null && (
                <Text style={cmiDelta > 0 ? S.deltaPos : cmiDelta < 0 ? S.deltaNeg : S.deltaNeut}>
                  {cmiDelta > 0 ? "+" : ""}{cmiDelta.toFixed(1)} pts
                </Text>
              )}
              <Text style={S.kpiSub}>sur 100 points</Text>
            </View>

            {/* Taux de clic */}
            <View style={S.kpiCard}>
              <Text style={S.kpiLabel}>Taux de clic phishing</Text>
              <Text style={[S.kpiValue, {
                color: clickRate === null ? C.fg :
                  clickRate < 0.1 ? C.success :
                  clickRate < 0.3 ? C.warning : C.danger,
              }]}>
                {pct(clickRate)}
              </Text>
              <Text style={S.kpiSub}>{totalClicked} clics / {totalDelivered} envois</Text>
            </View>

            {/* Taux de signalement */}
            <View style={S.kpiCard}>
              <Text style={S.kpiLabel}>Taux de signalement</Text>
              <Text style={[S.kpiValue, {
                color: reportRate === null ? C.fg :
                  reportRate >= 0.3 ? C.success :
                  reportRate >= 0.1 ? C.warning : C.danger,
              }]}>
                {pct(reportRate)}
              </Text>
              <Text style={S.kpiSub}>{totalReported} signalements</Text>
            </View>

            {/* Complétion */}
            <View style={S.kpiCard}>
              <Text style={S.kpiLabel}>Taux de complétion</Text>
              <Text style={[S.kpiValue, {
                color: completionRate === null ? C.fg :
                  completionRate >= 0.7 ? C.success :
                  completionRate >= 0.4 ? C.warning : C.danger,
              }]}>
                {pct(completionRate)}
              </Text>
              <Text style={S.kpiSub}>modules de formation</Text>
            </View>
          </View>
        </View>

        {/* ─── Graphique tendance ─── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>
            Évolution CMI sur {periodDays} jours
          </Text>
          <CmiSparkline data={trendData} />
        </View>

        {/* ─── Scores par département ─── */}
        {deptScores.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>
              Score moyen par département ({deptScores.length})
            </Text>
            <View style={S.table}>
              <View style={S.tableHeader}>
                <Text style={[S.thCell, { flex: 3 }]}>Département</Text>
                <Text style={[S.thCell, { flex: 1, textAlign: "right" }]}>Utilisateurs</Text>
                <Text style={[S.thCell, { flex: 1, textAlign: "right" }]}>Score moyen</Text>
                <Text style={[S.thCell, { flex: 1, textAlign: "right" }]}>Médiane</Text>
                <Text style={[S.thCell, { flex: 2, textAlign: "right" }]}>Niveau</Text>
              </View>
              {deptScores.map((dept, i) => {
                const level = riskLevel(dept.avg_score);
                return (
                  <View key={dept.department_name ?? i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.tdCell, { flex: 3, fontFamily: "Helvetica-Bold" }]}>
                      {dept.department_name ?? "—"}
                    </Text>
                    <Text style={[S.tdMuted, { flex: 1, textAlign: "right" }]}>
                      {dept.user_count ?? "—"}
                    </Text>
                    <Text style={[S.tdCell, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", color: level.color }]}>
                      {num(dept.avg_score)}
                    </Text>
                    <Text style={[S.tdMuted, { flex: 1, textAlign: "right" }]}>
                      {num(dept.median_score)}
                    </Text>
                    <View style={{ flex: 2, alignItems: "flex-end" }}>
                      <View style={[S.badge, { backgroundColor: level.bg }]}>
                        <Text style={{ color: level.color, fontSize: 7.5, fontFamily: "Helvetica-Bold" }}>
                          {level.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Top 5 modules ─── */}
        {topModules.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Top {topModules.length} modules (par complétion)</Text>
            <View style={S.table}>
              <View style={S.tableHeader}>
                <Text style={[S.thCell, { flex: 5 }]}>Module</Text>
                <Text style={[S.thCell, { flex: 2 }]}>Type</Text>
                <Text style={[S.thCell, { flex: 1, textAlign: "right" }]}>Complétions</Text>
                <Text style={[S.thCell, { flex: 1, textAlign: "right" }]}>Score moy.</Text>
              </View>
              {topModules.map((mod, i) => (
                <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.tdCell, { flex: 5 }]} numberOfLines={1}>{mod.title}</Text>
                  <Text style={[S.tdMuted, { flex: 2 }]}>{kindLabel(mod.kind)}</Text>
                  <Text style={[S.tdCell, { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                    {mod.completion_count ?? "—"}
                  </Text>
                  <Text style={[S.tdMuted, { flex: 1, textAlign: "right" }]}>
                    {num(mod.avg_score)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Activité campagnes ─── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Activité campagnes (période)</Text>
          <View style={S.statsRow}>
            {[
              { label: "Campagnes lancées", value: totalCampaigns },
              { label: "Campagnes terminées", value: completedCampaigns },
              { label: "Emails livrés", value: totalDelivered },
              { label: "Clics enregistrés", value: totalClicked },
              { label: "Signalements", value: totalReported },
            ].map((stat) => (
              <View key={stat.label} style={S.statBox}>
                <Text style={S.statValue}>{stat.value}</Text>
                <Text style={S.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Pied de page ─── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            CyberGuard SONABHY · Rapport confidentiel · données agrégées
          </Text>
          <Text style={S.footerText}>
            Généré par WendTech ·{" "}
            <Text
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} / ${totalPages}`
              }
            />
          </Text>
        </View>
      </Page>
    </Document>
  );
}
