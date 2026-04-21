import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ScoreCard } from "@/components/employee/score-card";
import { ModuleCard } from "@/components/employee/module-card";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Tableau de bord — CyberGuard SONABHY" };

type DashboardModule = {
  id: string;
  title: string;
  kind: string;
  estimated_minutes: number;
  topic_tags: string[];
};

type EmployeeProfile = {
  full_name?: string | null;
  departments?: { name?: string | null } | Array<{ name?: string | null }> | null;
};

type EmployeeScore = {
  score?: number | string | null;
  quiz_component?: number | string | null;
  phishing_component?: number | string | null;
  engagement_component?: number | string | null;
  snapshot_date?: string | null;
};

type EmployeeCompletion = {
  modules?: unknown;
};

function toNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeModule(value: unknown): DashboardModule | null {
  const row = Array.isArray(value) ? value[0] : value;

  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return null;
  }

  return {
    id: record.id,
    title: typeof record.title === "string" ? record.title : "Module de formation",
    kind: typeof record.kind === "string" ? record.kind : "micro_lesson",
    estimated_minutes:
      typeof record.estimated_minutes === "number" ? record.estimated_minutes : 5,
    topic_tags: Array.isArray(record.topic_tags)
      ? record.topic_tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

function getDepartmentName(departments: EmployeeProfile["departments"]) {
  const department = Array.isArray(departments) ? departments[0] : departments;
  return department?.name ?? "SONABHY";
}

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profile: EmployeeProfile | null = null;
  let scores: EmployeeScore[] = [];
  let modules: EmployeeCompletion[] = [];

  try {
    const [profileResult, scoreResult, moduleResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, departments(name)")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("risk_scores")
        .select("score, quiz_component, phishing_component, engagement_component, snapshot_date")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: false })
        .limit(2),

      supabase
        .from("module_completions")
        .select("modules(id, title, kind, estimated_minutes, topic_tags)")
        .eq("user_id", user.id)
        .in("status", ["started"])
        .limit(3),
    ]);

    if (profileResult.error) {
      console.error("[EmployeeDashboard] Profile query error:", profileResult.error.message);
    }
    if (scoreResult.error) {
      console.error("[EmployeeDashboard] Scores query error:", scoreResult.error.message);
    }
    if (moduleResult.error) {
      console.error("[EmployeeDashboard] Modules query error:", moduleResult.error.message);
    }

    profile = profileResult.data as EmployeeProfile | null;
    scores = Array.isArray(scoreResult.data) ? (scoreResult.data as EmployeeScore[]) : [];
    modules = Array.isArray(moduleResult.data)
      ? (moduleResult.data as EmployeeCompletion[])
      : [];
  } catch (err) {
    console.error("[EmployeeDashboard] Dashboard queries failed:", err);
  }

  const currentScore  = scores?.[0];
  const previousScore = scores?.[1];
  const currentScoreValue =
    currentScore?.score !== undefined && currentScore?.score !== null
      ? toNumber(currentScore.score)
      : null;
  const currentQuizComponent = toNumber(currentScore?.quiz_component);
  const currentPhishingComponent =
    currentScore?.phishing_component !== undefined &&
    currentScore?.phishing_component !== null
      ? toNumber(currentScore.phishing_component)
      : null;
  const scoreDelta =
    currentScore && previousScore
      ? toNumber(currentScore.score) - toNumber(previousScore.score)
      : null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "vous";
  const deptName = getDepartmentName(profile?.departments);

  let suggestedModules: unknown[] = [];

  if (!modules || modules.length === 0) {
    try {
      const { data, error } = await supabase
          .from("modules")
          .select("id, title, kind, estimated_minutes, topic_tags")
          .eq("is_published", true)
          .eq("kind", "micro_lesson")
          .limit(3);

      if (error) {
        console.error("[EmployeeDashboard] Suggested modules query error:", error.message);
      }

      suggestedModules = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("[EmployeeDashboard] Suggested modules lookup failed:", err);
    }
  }

  const activeModules = (modules ?? [])
    .map((item) =>
      normalizeModule((item as { modules?: unknown }).modules)
    )
    .filter((mod): mod is DashboardModule => mod !== null);
  const suggestedModuleList = suggestedModules
    .map((item) => normalizeModule(item))
    .filter((mod): mod is DashboardModule => mod !== null);
  const dashboardModules =
    activeModules.length > 0 ? activeModules : suggestedModuleList;

  // Calcul heure locale pour message de bienvenue contextuel
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FC" }}>
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div
        className="px-5 pt-8 pb-10"
        style={{
          background: "linear-gradient(135deg, #163061 0%, #1F3F7A 60%, #2F5696 100%)",
        }}
      >
        <div className="max-w-lg mx-auto">
          {/* Salutation */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {deptName}
              </p>
              <h1 className="text-2xl font-bold text-white">
                {greeting}, {firstName} 👋
              </h1>
            </div>
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
            >
              {firstName[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.60)" }}
          >
            Programme de sensibilisation cybersécurité
          </p>
        </div>
      </div>

      {/* ── Score Card (chevauche le header) ──────────────────────────────── */}
      <div className="px-5 -mt-4 max-w-lg mx-auto">
        {currentScoreValue !== null ? (
          <ScoreCard
            score={currentScoreValue}
            delta={scoreDelta}
            snapshotDate={currentScore?.snapshot_date ?? new Date().toISOString()}
          />
        ) : (
          <div
            className="rounded-2xl p-6 text-center shadow-md"
            style={{ background: "linear-gradient(135deg, #163061 0%, #1F3F7A 100%)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <Shield className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Votre score n'est pas encore calculé
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
              Complétez votre premier module et attendez le calcul nocturne pour voir votre score de vigilance.
            </p>
          </div>
        )}
      </div>

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">

        {/* Modules */}
        <section aria-labelledby="modules-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="modules-heading" className="section-heading">
              {activeModules.length > 0 ? "En cours" : "Recommandés pour vous"}
            </h2>
            <Link
              href="/employee/parcours"
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: "#C98B1A" }}
            >
              Voir tout
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {dashboardModules.map((mod) => (
              <ModuleCard
                key={mod.id}
                id={mod.id}
                title={mod.title}
                kind={mod.kind}
                estimatedMinutes={mod.estimated_minutes}
                topicTags={mod.topic_tags}
              />
            ))}
            {dashboardModules.length === 0 && (
              <div
                className="rounded-xl border bg-white p-5 text-sm text-fg-muted shadow-sm"
                style={{ borderColor: "#DDE2EE" }}
              >
                Votre espace est prêt. Les modules de formation apparaîtront ici dès
                qu'ils seront publiés ou assignés.
              </div>
            )}
          </div>
        </section>

        {/* Mini-stats si score disponible */}
        {currentScoreValue !== null && (
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="section-heading mb-4">
              Détail de votre score
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Quiz */}
              <div
                className="rounded-xl p-4 bg-white border shadow-sm"
                style={{ borderColor: "#DDE2EE" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(22,48,97,0.08)" }}
                  >
                    <Sparkles
                      className="w-3.5 h-3.5"
                      style={{ color: "#163061" }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide">
                    Quiz
                  </p>
                </div>
                <p
                  className="text-3xl font-bold font-mono"
                  style={{ color: "#163061" }}
                >
                  {Math.round(currentQuizComponent)}
                </p>
                <p className="text-xs text-fg-subtle mt-0.5">/ 100 points</p>
                <div className="mt-3 w-full h-1.5 rounded-full" style={{ backgroundColor: "#E4E8F0" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(currentQuizComponent)}%`,
                      backgroundColor: "#163061",
                    }}
                  />
                </div>
              </div>

              {/* Phishing */}
              <div
                className="rounded-xl p-4 bg-white border shadow-sm"
                style={{ borderColor: "#DDE2EE" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(39,174,96,0.08)" }}
                  >
                    <Shield
                      className="w-3.5 h-3.5"
                      style={{ color: "#27AE60" }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide">
                    Vigilance
                  </p>
                </div>
                <p
                  className="text-3xl font-bold font-mono"
                  style={{
                    color:
                      currentPhishingComponent !== null
                        ? "#27AE60"
                        : "#A0AEC0",
                  }}
                >
                  {currentPhishingComponent !== null
                    ? Math.round(currentPhishingComponent)
                    : "—"}
                </p>
                <p className="text-xs text-fg-subtle mt-0.5">/ 100 points</p>
                {currentPhishingComponent !== null && (
                  <div className="mt-3 w-full h-1.5 rounded-full" style={{ backgroundColor: "#E4E8F0" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(currentPhishingComponent)}%`,
                        backgroundColor: "#27AE60",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
