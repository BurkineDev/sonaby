/**
 * GET /admin/reports/export
 *
 * Route Handler Next.js — génère et stream un PDF rapport direction.
 *
 * Sécurité :
 *   - Vérifie l'authentification et le rôle admin/super_admin
 *   - Toutes les données sont agrégées (RLS garantit l'isolation org)
 *   - Aucune donnée nominative n'est exposée
 *
 * Technologie :
 *   - @react-pdf/renderer (server-side uniquement, Node.js runtime)
 *   - renderToBuffer() → Buffer → NextResponse binary
 *
 * Paramètre GET optionnel :
 *   - ?days=30  (défaut 30, max 90)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "./pdf-report";
import React from "react";

// Force Node.js runtime (pas d'Edge — @react-pdf/renderer requiert Node)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  // ─── 1. Auth & rôle ──────────────────────────────────────────────────────

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rssi", "super_admin"].includes(profile.role)) {
    return new NextResponse("Accès non autorisé — rôle admin requis", {
      status: 403,
    });
  }

  const orgId = profile.organization_id as string;

  // ─── 2. Paramètres ───────────────────────────────────────────────────────

  const url = new URL(request.url);
  const rawDays = parseInt(url.searchParams.get("days") ?? "30", 10);
  const periodDays = Math.min(90, Math.max(7, isNaN(rawDays) ? 30 : rawDays));

  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const sinceStr = since.toISOString().split("T")[0]!;

  // ─── 3. Requêtes Supabase (parallèles) ───────────────────────────────────

  const [
    { data: cmiHistory },
    { data: phishingHistory },
    { data: latestGlobal },
    { data: deptScores },
    { data: campaignStats },
    { data: topModulesRaw },
  ] = await Promise.all([
    // Historique CMI (org entière, période)
    supabase
      .from("cohort_scores")
      .select(
        "snapshot_date, cyber_maturity_index, phishing_click_rate, phishing_report_rate"
      )
      .eq("organization_id", orgId)
      .is("department_id", null)
      .gte("snapshot_date", sinceStr)
      .order("snapshot_date", { ascending: true }),

    // KPIs phishing quotidiens (période)
    supabase
      .from("mv_org_kpis_daily")
      .select("day, click_rate_pct, report_rate_pct, delivered, clicked, reported")
      .gte("day", sinceStr)
      .order("day", { ascending: true }),

    // 2 derniers snapshots globaux (pour delta CMI)
    supabase
      .from("cohort_scores")
      .select(
        "cyber_maturity_index, phishing_click_rate, phishing_report_rate, completion_rate, user_count"
      )
      .eq("organization_id", orgId)
      .is("department_id", null)
      .order("snapshot_date", { ascending: false })
      .limit(2),

    // Scores par département (derniers)
    supabase
      .from("mv_dept_scores_latest")
      .select("department_name, user_count, avg_score, median_score")
      .order("avg_score", { ascending: false }),

    // Campagnes sur la période
    supabase
      .from("phishing_campaigns")
      .select("status")
      .eq("organization_id", orgId)
      .gte("created_at", since.toISOString()),

    // Top 5 modules par complétion (depuis module_completions)
    supabase
      .from("module_completions")
      .select(
        "module_id, score, modules!inner(title, kind)"
      )
      .eq("status", "completed")
      .gte("completed_at", since.toISOString())
      .order("module_id"),
  ]);

  // ─── 4. Agréger top modules ───────────────────────────────────────────────

  // Agrégation manuelle — group by module_id
  type ModuleAgg = {
    title: string;
    kind: string;
    completion_count: number;
    score_sum: number;
  };

  const moduleMap = new Map<string, ModuleAgg>();

  for (const row of topModulesRaw ?? []) {
    const mod = row.modules as unknown as { title: string; kind: string } | null;
    if (!mod || !row.module_id) continue;

    const existing = moduleMap.get(row.module_id);
    if (existing) {
      existing.completion_count++;
      existing.score_sum += row.score ?? 0;
    } else {
      moduleMap.set(row.module_id, {
        title: mod.title,
        kind: mod.kind,
        completion_count: 1,
        score_sum: row.score ?? 0,
      });
    }
  }

  const topModules = Array.from(moduleMap.values())
    .sort((a, b) => b.completion_count - a.completion_count)
    .slice(0, 5)
    .map((m) => ({
      title: m.title,
      kind: m.kind,
      completion_count: m.completion_count,
      avg_score: m.completion_count > 0 ? m.score_sum / m.completion_count : null,
    }));

  // ─── 5. Composer les props du document ───────────────────────────────────

  const current = latestGlobal?.[0];
  const previous = latestGlobal?.[1];

  const cmi = current?.cyber_maturity_index ?? null;
  const cmiPrev = previous?.cyber_maturity_index ?? null;
  const cmiDelta = cmi !== null && cmiPrev !== null ? cmi - cmiPrev : null;

  const totalDelivered = (phishingHistory ?? []).reduce(
    (s, r) => s + (r.delivered ?? 0),
    0
  );
  const totalClicked = (phishingHistory ?? []).reduce(
    (s, r) => s + (r.clicked ?? 0),
    0
  );
  const totalReported = (phishingHistory ?? []).reduce(
    (s, r) => s + (r.reported ?? 0),
    0
  );

  // Fusionner CMI history avec phishing rates
  const trendData = (cmiHistory ?? []).map((row) => {
    const ph = (phishingHistory ?? []).find((p) => p.day === row.snapshot_date);
    return {
      date: row.snapshot_date,
      cmi: row.cyber_maturity_index ?? null,
      click_rate: ph?.click_rate_pct ?? null,
      report_rate: ph?.report_rate_pct ?? null,
    };
  });

  const props = {
    generatedAt: new Date().toISOString(),
    periodDays,
    cmi,
    cmiDelta,
    clickRate: current?.phishing_click_rate ?? null,
    reportRate: current?.phishing_report_rate ?? null,
    completionRate: current?.completion_rate ?? null,
    userCount: current?.user_count ?? 0,
    totalDelivered,
    totalClicked,
    totalReported,
    totalCampaigns: campaignStats?.length ?? 0,
    completedCampaigns:
      campaignStats?.filter((c) => c.status === "completed").length ?? 0,
    trendData,
    deptScores: (deptScores ?? []).slice(0, 10), // max 10 depts dans le PDF
    topModules,
  };

  // ─── 6. Générer le PDF ───────────────────────────────────────────────────

  let pdfBuffer: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfBuffer = await (renderToBuffer as any)(
      React.createElement(ReportDocument as any, props)
    );
  } catch (err) {
    console.error("[PDF export] renderToBuffer error:", err);
    return new NextResponse("Erreur lors de la génération du PDF", {
      status: 500,
    });
  }

  // ─── 7. Audit log (export de données — traçabilité obligatoire) ──────────
  // Fire-and-forget — on ne bloque pas le téléchargement si l'insert échoue.
  supabase
    .from("audit_log")
    .insert({
      actor_id: user.id,
      organization_id: orgId,
      action: "report.export_pdf",
      target_type: "report",
      target_id: null,
      metadata: {
        period_days: periodDays,
        user_count: props.userCount,
        dept_count: props.deptScores.length,
        generated_at: props.generatedAt,
      },
    })
    .then(({ error }) => {
      if (error) console.error("[PDF export] audit_log insert error:", error.message);
    });

  // ─── 8. Stream le PDF ────────────────────────────────────────────────────

  const dateStr = new Date().toISOString().split("T")[0]!;
  const filename = `rapport-cyberguard-sonabhy-${dateStr}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
      // Pas de cache — données temps réel
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
