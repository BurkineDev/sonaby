"use client";

import { getRiskLabel } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus,
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Info,
} from "lucide-react";

interface Props {
  score: number;
  delta: number | null;
  snapshotDate: string;
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat("fr-BF", {
    day: "numeric",
    month: "long",
  }).format(new Date(dateStr));
}

function RiskShieldIcon({ score, className }: { score: number; className?: string }) {
  if (score >= 86) return <ShieldCheck  className={className} aria-hidden="true" />;
  if (score >= 71) return <Shield       className={className} aria-hidden="true" />;
  if (score >= 51) return <Shield       className={className} aria-hidden="true" />;
  if (score >= 31) return <ShieldAlert  className={className} aria-hidden="true" />;
  return                   <ShieldX     className={className} aria-hidden="true" />;
}

export function ScoreCard({ score, delta, snapshotDate }: Props) {
  const scoreRounded = Math.round(score);
  const label = getRiskLabel(scoreRounded);

  const accentColor =
    scoreRounded >= 86 ? "#1ABC9C" :
    scoreRounded >= 71 ? "#27AE60" :
    scoreRounded >= 51 ? "#D4AC0D" :
    scoreRounded >= 31 ? "#E67E22" :
                          "#C0392B";

  const levelBg    = `${accentColor}22`;
  const levelBorder = `${accentColor}44`;

  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (scoreRounded / 100) * circumference;

  const deltaPositive = delta !== null && delta > 0;
  const deltaNegative = delta !== null && delta < 0;

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-slide-up"
      style={{
        background: "linear-gradient(145deg, #0D2250 0%, #163061 55%, #1F4080 100%)",
        boxShadow: "0 8px 32px rgba(13,34,80,0.30), 0 2px 8px rgba(13,34,80,0.20)",
      }}
    >
      {/* ── Shimmer top line ─────────────────────────────────────────── */}
      <div
        className="h-px w-full opacity-30"
        style={{ background: "linear-gradient(90deg, transparent, #E8A228, transparent)" }}
      />

      <div className="p-5">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(255,255,255,0.40)" }}
            >
              Score de vigilance
            </p>
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
              Mis à jour le {formatDateShort(snapshotDate)}
            </p>
          </div>

          {delta !== null && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: deltaPositive
                  ? "rgba(39,174,96,0.22)"
                  : deltaNegative
                  ? "rgba(192,57,43,0.22)"
                  : "rgba(255,255,255,0.10)",
                color: deltaPositive ? "#6EE7B7" : deltaNegative ? "#FCA5A5" : "rgba(255,255,255,0.60)",
                border: `1px solid ${deltaPositive ? "rgba(110,231,183,0.30)" : deltaNegative ? "rgba(252,165,165,0.30)" : "rgba(255,255,255,0.12)"}`,
              }}
              aria-label={`Évolution : ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} points`}
            >
              {deltaPositive
                ? <TrendingUp  className="w-3.5 h-3.5" aria-hidden="true" />
                : deltaNegative
                ? <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                : <Minus        className="w-3.5 h-3.5" aria-hidden="true" />}
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)} pts
            </div>
          )}
        </div>

        {/* ── Arc + infos ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-5">
          {/* Arc SVG circulaire */}
          <div className="relative shrink-0">
            {/* Halo glow derrière l'arc */}
            <div
              className="absolute inset-0 rounded-full opacity-20 blur-lg"
              style={{ backgroundColor: accentColor }}
            />
            <svg
              width="128"
              height="128"
              viewBox="0 0 128 128"
              role="img"
              aria-label={`Score de vigilance : ${scoreRounded} sur 100 — ${label}`}
            >
              {/* Track */}
              <circle
                cx="64" cy="64" r={r}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ transform: "rotate(-90deg)", transformOrigin: "64px 64px" }}
              />
              {/* Arc valeur — animé via CSS animation via strokeDashoffset */}
              <circle
                cx="64" cy="64" r={r}
                fill="none"
                stroke={accentColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "64px 64px",
                  transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: `drop-shadow(0 0 8px ${accentColor}80)`,
                }}
              />
              {/* Score central */}
              <text
                x="64" y="60"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize="30"
                fill="white"
              >
                {scoreRounded}
              </text>
              <text
                x="64" y="76"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="rgba(255,255,255,0.40)"
              >
                / 100
              </text>
            </svg>
          </div>

          {/* Infos droite */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Level badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                backgroundColor: levelBg,
                border: `1px solid ${levelBorder}`,
              }}
            >
              <span style={{ color: accentColor }} aria-hidden="true">
                <RiskShieldIcon score={scoreRounded} className="w-4 h-4 shrink-0" />
              </span>
              <span className="text-sm font-bold" style={{ color: accentColor }}>
                {label}
              </span>
            </div>

            {/* Barre de progression */}
            <div>
              <div
                className="w-full h-2 rounded-full mb-1.5"
                style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
                role="progressbar"
                aria-valuenow={scoreRounded}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${scoreRounded}% de vigilance`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${scoreRounded}%`,
                    backgroundColor: accentColor,
                    boxShadow: `0 0 10px ${accentColor}80`,
                    transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                <span>Critique</span>
                <span>Exemplaire</span>
              </div>
            </div>

            {/* Lien explication */}
            <a
              href="/employee/score"
              className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80 focus-visible:underline w-fit"
              style={{ color: "#E8A228" }}
              aria-label="Voir le détail de mon score"
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
              Voir le détail
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
