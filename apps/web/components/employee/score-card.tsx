import { getRiskLabel, formatDate } from "@/lib/utils";
import { Info, TrendingUp, TrendingDown, Minus, ShieldCheck } from "lucide-react";

interface Props {
  score: number;
  delta: number | null;
  snapshotDate: string;
}

/**
 * Score Card — design premium SONABHY pour l'espace employé.
 * Affiche le Risk Score avec arc circulaire SVG, bande de risque et évolution.
 * Spec : 08-ui-ux-spec.md §4.1
 */
export function ScoreCard({ score, delta, snapshotDate }: Props) {
  const scoreRounded = Math.round(score);
  const label = getRiskLabel(scoreRounded);

  // Couleurs selon le niveau de risque
  const accentColor =
    scoreRounded <= 30 ? "#C0392B" :
    scoreRounded <= 50 ? "#E67E22" :
    scoreRounded <= 70 ? "#D4AC0D" :
    scoreRounded <= 85 ? "#27AE60" :
                          "#1ABC9C";

  const levelBg =
    scoreRounded <= 30 ? "rgba(192,57,43,0.08)" :
    scoreRounded <= 50 ? "rgba(230,126,34,0.08)" :
    scoreRounded <= 70 ? "rgba(212,172,13,0.08)" :
    scoreRounded <= 85 ? "rgba(39,174,96,0.08)" :
                          "rgba(26,188,156,0.08)";

  // ── Arc circulaire SVG ───────────────────────────────────────────────────
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (scoreRounded / 100) * circumference;

  // Delta
  const deltaPositive = delta !== null && delta > 0;
  const deltaNegative = delta !== null && delta < 0;

  return (
    <div
      className="rounded-2xl shadow-md overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #163061 0%, #1F3F7A 100%)",
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Votre score de vigilance
            </p>
            <p className="text-sm font-medium text-white mt-0.5">
              Mis à jour le {formatDate(snapshotDate)}
            </p>
          </div>

          {/* Badge delta */}
          {delta !== null && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: deltaPositive
                  ? "rgba(39,174,96,0.25)"
                  : deltaNegative
                  ? "rgba(192,57,43,0.25)"
                  : "rgba(255,255,255,0.12)",
                color: deltaPositive ? "#6EE7B7" : deltaNegative ? "#FCA5A5" : "rgba(255,255,255,0.7)",
              }}
              aria-label={`Évolution : ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} points`}
            >
              {deltaPositive ? (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : deltaNegative ? (
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)} pts
            </div>
          )}
        </div>

        {/* Contenu principal : arc + score */}
        <div className="flex items-center gap-6">
          {/* Arc SVG circulaire */}
          <div className="relative shrink-0">
            <svg
              width="128"
              height="128"
              viewBox="0 0 128 128"
              role="img"
              aria-label={`Score de vigilance : ${scoreRounded} sur 100 — ${label}`}
            >
              {/* Fond arc */}
              <circle
                cx="64"
                cy="64"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={0}
                style={{ transform: "rotate(-90deg)", transformOrigin: "64px 64px" }}
              />
              {/* Arc valeur */}
              <circle
                cx="64"
                cy="64"
                r={r}
                fill="none"
                stroke={accentColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "64px 64px",
                  transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: `drop-shadow(0 0 6px ${accentColor}60)`,
                }}
              />
              {/* Score central */}
              <text
                x="64"
                y="57"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize="28"
                fill="white"
              >
                {scoreRounded}
              </text>
              <text
                x="64"
                y="74"
                textAnchor="middle"
                fontSize="12"
                fill="rgba(255,255,255,0.55)"
              >
                / 100
              </text>
            </svg>
          </div>

          {/* Infos droite */}
          <div className="flex-1 min-w-0">
            {/* Niveau */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{ backgroundColor: levelBg, border: `1px solid ${accentColor}40` }}
            >
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{ color: accentColor }}
                aria-hidden="true"
              />
              <span className="text-sm font-bold" style={{ color: accentColor }}>
                {label}
              </span>
            </div>

            {/* Barre de progression */}
            <div
              className="w-full h-2 rounded-full mb-2"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              role="progressbar"
              aria-valuenow={scoreRounded}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${scoreRounded}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}80`,
                }}
              />
            </div>

            <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>Critique</span>
              <span>Exemplaire</span>
            </div>

            {/* Lien explication */}
            <a
              href="/employee/score"
              className="flex items-center gap-1 mt-3 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ color: "#E8A228" }}
              aria-label="Comment est calculé mon score ?"
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
              Comment est calculé mon score ?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
