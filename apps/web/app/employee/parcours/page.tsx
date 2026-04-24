import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/employee/module-card";
import { BookOpen, CheckCircle2, Play, AlertTriangle, Layers } from "lucide-react";

export const metadata: Metadata = { title: "Mon parcours — CyberGuard SONABHY" };

// ── Helpers ──────────────────────────────────────────────────────────────────

type ModuleRow = {
  id: string;
  title: string;
  kind: string;
  estimated_minutes: number;
  topic_tags: string[];
  difficulty?: string;
};

type CompletionRow = {
  module_id: string;
  status: string;
  score?: number | null;
  completed_at?: string | null;
  modules: ModuleRow | null;
};

function formatMinutes(total: number) {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Sous-composant : header de section ───────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  count,
  color,
  progress,
}: {
  icon: typeof BookOpen;
  label: string;
  count: number;
  color: string;
  progress?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-bold" style={{ color: "#0F1B36" }}>
          {label}
        </h2>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {count}
        </span>
      </div>
      {progress !== undefined && (
        <span className="text-xs font-semibold" style={{ color: "#A0AEC0" }}>
          {progress}%
        </span>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default async function ParcoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // ── Requêtes parallèles ──────────────────────────────────────────────────
  const [
    { data: inProgressRaw },
    { data: completedRaw },
    { data: jitRaw },
  ] = await Promise.all([
    supabase
      .from("module_completions")
      .select("module_id, status, modules(id, title, kind, estimated_minutes, topic_tags, difficulty)")
      .eq("user_id", user.id)
      .eq("status", "started")
      .order("started_at", { ascending: false }),

    supabase
      .from("module_completions")
      .select("module_id, status, score, completed_at, modules(id, title, kind, estimated_minutes, topic_tags, difficulty)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),

    supabase
      .from("module_completions")
      .select("module_id, status, modules(id, title, kind, estimated_minutes, topic_tags, difficulty)")
      .eq("user_id", user.id)
      .eq("status", "started")
      .eq("modules.kind", "jit_remediation"),
  ]);

  const inProgress  = (inProgressRaw ?? []) as unknown as CompletionRow[];
  const completed   = (completedRaw  ?? []) as unknown as CompletionRow[];
  const jitModules  = ((jitRaw ?? []) as unknown as CompletionRow[]).filter(
    (c) => c.modules?.kind === "jit_remediation"
  );

  const doneIds = [
    ...inProgress.map((c) => c.module_id),
    ...completed.map((c)  => c.module_id),
  ];

  const { data: availableRaw } = await supabase
    .from("modules")
    .select("id, title, kind, estimated_minutes, topic_tags, difficulty")
    .eq("is_published", true)
    .not("kind", "eq", "jit_remediation")
    .not("id", "in", doneIds.length > 0 ? `(${doneIds.join(",")})` : "(null)")
    .order("difficulty", { ascending: true })
    .limit(20);

  const available = (availableRaw ?? []) as ModuleRow[];

  // ── Stats globales ──────────────────────────────────────────────────────
  const totalModules   = inProgress.length + completed.length + available.length;
  const completedCount = completed.length;
  const completionPct  = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const totalTimeCompleted = completed.reduce((acc, c) => {
    const mins = c.modules?.estimated_minutes ?? 0;
    return acc + mins;
  }, 0);

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((acc, c) => acc + (c.score ?? 0), 0) / completed.length
        )
      : null;

  // ── Filtrer les modules en cours (hors JIT) ─────────────────────────────
  const inProgressNonJIT = inProgress.filter(
    (c) => c.modules?.kind !== "jit_remediation"
  );

  const isEmpty =
    inProgress.length === 0 &&
    available.length   === 0 &&
    completed.length   === 0;

  return (
    <div
      className="min-h-screen pb-6"
      style={{ backgroundColor: "#F0F2F8" }}
    >
      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div
        className="px-5 pt-8 pb-6"
        style={{
          background: "linear-gradient(135deg, #0D2250 0%, #163061 60%, #1F4080 100%)",
        }}
      >
        <div className="max-w-lg mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            Programme de formation
          </p>
          <h1 className="text-2xl font-bold text-white mb-5">Mon parcours</h1>

          {/* Stats card flottante */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-4">
              {/* Anneau de progression */}
              <div className="relative shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                  <circle
                    cx="32" cy="32" r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "32px 32px" }}
                  />
                  <circle
                    cx="32" cy="32" r="26"
                    fill="none"
                    stroke="#E8A228"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - completionPct / 100)}`}
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "32px 32px",
                      filter: "drop-shadow(0 0 4px rgba(232,162,40,0.6))",
                      transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                  <text
                    x="32" y="36"
                    textAnchor="middle"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                    fontSize="13"
                    fill="white"
                  >
                    {completionPct}%
                  </text>
                </svg>
              </div>

              {/* Compteurs */}
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-white font-mono leading-none">
                    {completedCount}
                    <span className="text-sm font-medium opacity-50">/{totalModules}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    modules
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white font-mono leading-none">
                    {totalTimeCompleted > 0 ? formatMinutes(totalTimeCompleted) : "—"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    complétés
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className="text-xl font-bold font-mono leading-none"
                    style={{ color: avgScore !== null ? "#E8A228" : "rgba(255,255,255,0.3)" }}
                  >
                    {avgScore !== null ? avgScore : "—"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    moy. quiz
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu principal ────────────────────────────────────────── */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-8">

        {/* ─ URGENTS (JIT) ─────────────────────────────────────────── */}
        {jitModules.length > 0 && (
          <section aria-labelledby="jit-heading">
            <SectionHeader
              icon={AlertTriangle}
              label="Formation urgente"
              count={jitModules.length}
              color="#E67E22"
            />

            {/* Bandeau d'alerte */}
            <div
              className="rounded-xl px-4 py-3 mb-3 flex items-center gap-3 text-sm font-medium"
              style={{
                backgroundColor: "rgba(230,126,34,0.10)",
                border: "1px solid rgba(230,126,34,0.30)",
                color: "#C0640A",
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              Un module prioritaire a été déclenché après une simulation de phishing.
            </div>

            <div className="space-y-3">
              {jitModules.map((c) => {
                const mod = c.modules;
                if (!mod) return null;
                return (
                  <ModuleCard
                    key={mod.id}
                    id={mod.id}
                    title={mod.title}
                    kind={mod.kind}
                    estimatedMinutes={mod.estimated_minutes}
                    topicTags={mod.topic_tags}
                    {...(mod.difficulty != null ? { difficulty: mod.difficulty } : {})}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ─ EN COURS ──────────────────────────────────────────────── */}
        {inProgressNonJIT.length > 0 && (
          <section aria-labelledby="inprogress-heading">
            <SectionHeader
              icon={Play}
              label="En cours"
              count={inProgressNonJIT.length}
              color="#163061"
            />
            <div className="space-y-3">
              {inProgressNonJIT.map((c) => {
                const mod = c.modules;
                if (!mod) return null;
                return (
                  <ModuleCard
                    key={mod.id}
                    id={mod.id}
                    title={mod.title}
                    kind={mod.kind}
                    estimatedMinutes={mod.estimated_minutes}
                    topicTags={mod.topic_tags}
                    {...(mod.difficulty != null ? { difficulty: mod.difficulty } : {})}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ─ DISPONIBLES ───────────────────────────────────────────── */}
        {available.length > 0 && (
          <section aria-labelledby="available-heading">
            <SectionHeader
              icon={Layers}
              label="Disponibles"
              count={available.length}
              color="#8B5CF6"
            />
            <div className="space-y-3">
              {available.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  kind={mod.kind}
                  estimatedMinutes={mod.estimated_minutes}
                  topicTags={mod.topic_tags}
                  {...(mod.difficulty != null ? { difficulty: mod.difficulty } : {})}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─ COMPLÉTÉS ─────────────────────────────────────────────── */}
        {completed.length > 0 && (
          <section aria-labelledby="completed-heading">
            <div className="mb-3">
              <SectionHeader
                icon={CheckCircle2}
                label="Complétés"
                count={completed.length}
                color="#27AE60"
                progress={completionPct}
              />
              {/* Barre de complétion globale */}
              <div className="w-full h-1.5 rounded-full mt-1" style={{ backgroundColor: "#E4E8F0" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${completionPct}%`,
                    background: "linear-gradient(90deg, #27AE60, #1ABC9C)",
                    transition: "width 1s ease-out",
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {completed.map((c) => {
                const mod = c.modules;
                if (!mod) return null;
                const scoreVal = c.score != null ? c.score : undefined;
                return (
                  <div key={mod.id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <ModuleCard
                      id={mod.id}
                      title={mod.title}
                      kind={mod.kind}
                      estimatedMinutes={mod.estimated_minutes}
                      topicTags={mod.topic_tags}
                      {...(mod.difficulty != null ? { difficulty: mod.difficulty } : {})}
                      completed
                      {...(scoreVal != null ? { score: scoreVal } : {})}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─ État vide ─────────────────────────────────────────────── */}
        {isEmpty && (
          <div className="text-center py-16 space-y-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)" }}
            >
              <BookOpen className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: "#0F1B36" }}>
                Aucun module disponible
              </p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "#718096" }}>
                La DSI publiera bientôt de nouveaux contenus de formation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
