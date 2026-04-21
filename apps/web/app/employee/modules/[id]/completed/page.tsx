import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, Star, Clock, ArrowRight, Layers, Home } from "lucide-react";
import { getRiskLabel } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getScoreColor(s: number) {
  if (s >= 86) return "#1ABC9C";
  if (s >= 71) return "#27AE60";
  if (s >= 51) return "#D4AC0D";
  if (s >= 31) return "#E67E22";
  return "#C0392B";
}

function calcXP(score: number, minutes: number) {
  return Math.round((score / 100) * minutes * 5);
}

function formatSeconds(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function getMotivation(score: number): string {
  if (score >= 86) return "Exemplaire ! Votre vigilance cyber est un modèle pour vos collègues.";
  if (score >= 71) return "Très bien ! Continuez sur cette lancée et votre score progressera encore.";
  if (score >= 51) return "Bon début ! Relisez les points clés pour consolider vos acquis.";
  if (score >= 31) return "Du progrès est possible. Refaire ce module vous aidera à vous améliorer.";
  return "Ne vous découragez pas — chaque formation renforce votre défense. Réessayez !";
}

export default async function ModuleCompletedPage({ params }: PageProps) {
  const { id: moduleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: module }, { data: completion }] = await Promise.all([
    supabase
      .from("modules")
      .select("title, kind, estimated_minutes")
      .eq("id", moduleId)
      .single(),
    supabase
      .from("module_completions")
      .select("score, time_spent_seconds, completed_at")
      .eq("user_id", user?.id ?? "")
      .eq("module_id", moduleId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const score   = Math.round(completion?.score ?? 100);
  const timeSec = completion?.time_spent_seconds ?? 0;
  const xp      = calcXP(score, module?.estimated_minutes ?? 5);
  const color   = getScoreColor(score);
  const label   = getRiskLabel(score);
  const motivation = getMotivation(score);

  // Arc SVG pour le score ring
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (score / 100) * circ;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 md:pb-8"
      style={{ background: "linear-gradient(160deg, #0B1933 0%, #163061 50%, #1F4080 100%)" }}
    >
      {/* ── Glow décoratif derrière le cercle ─────────────────────── */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: `${color}25` }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm space-y-6 animate-fade-slide-up">

        {/* ── Cercle de succès ──────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative animate-ring-expand"
            style={{ animationDelay: "100ms" }}
          >
            {/* Halo animé */}
            <div
              className="absolute inset-0 rounded-full animate-glow-gold"
              style={{ backgroundColor: `${color}20` }}
            />
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              role="img"
              aria-label={`Score : ${score} sur 100`}
            >
              {/* Track */}
              <circle
                cx="60" cy="60" r={r}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
              />
              {/* Arc score */}
              <circle
                cx="60" cy="60" r={r}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dashOffset}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "60px 60px",
                  filter: `drop-shadow(0 0 8px ${color}90)`,
                  transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
              {/* Check icon central */}
              <foreignObject x="18" y="18" width="84" height="84">
                <div className="w-full h-full flex items-center justify-center">
                  <CheckCircle2
                    className="w-10 h-10 animate-pop-in"
                    style={{ color, animationDelay: "300ms" }}
                    aria-hidden="true"
                  />
                </div>
              </foreignObject>
            </svg>
          </div>

          {/* Titre + sous-titre */}
          <div className="text-center animate-fade-slide-up delay-200">
            <h1 className="text-2xl font-bold text-white">Module terminé !</h1>
            {module?.title && (
              <p className="text-sm mt-1 px-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                {module.title}
              </p>
            )}
          </div>
        </div>

        {/* ── Stats card ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden animate-fade-slide-up delay-300"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Score principal */}
          <div className="px-5 pt-5 pb-4 text-center border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className="text-4xl font-bold font-mono"
                style={{ color }}
              >
                {score}
              </span>
              <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.40)" }}>
                / 100
              </span>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}35` }}
            >
              {label}
            </span>
          </div>

          {/* Métriques secondaires */}
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.40)" }} aria-hidden="true" />
                <span className="text-sm font-bold text-white">
                  {timeSec > 0 ? formatSeconds(timeSec) : `${module?.estimated_minutes ?? "—"} min`}
                </span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Temps passé</p>
            </div>

            <div className="px-4 py-4 text-center border-l" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="w-4 h-4" style={{ color: "#E8A228" }} aria-hidden="true" />
                <span className="text-sm font-bold" style={{ color: "#E8A228" }}>
                  +{xp} XP
                </span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Points gagnés</p>
            </div>
          </div>
        </div>

        {/* ── Message motivationnel ─────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3.5 text-center animate-fade-slide-up delay-400"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            {motivation}
          </p>
        </div>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="space-y-3 animate-fade-slide-up delay-500">
          <Link
            href="/employee/parcours"
            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #E8A228, #C98B1A)",
              color: "white",
              boxShadow: "0 4px 20px rgba(232,162,40,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(232,162,40,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(232,162,40,0.35)";
            }}
          >
            <Layers className="w-4 h-4" aria-hidden="true" />
            Voir tous mes modules
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <Link
            href="/employee"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
