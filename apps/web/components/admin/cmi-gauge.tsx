"use client";

import { getRiskLabel } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  value: number;
  delta: number | null;
  label: string;
  description: string;
}

/**
 * Jauge CMI premium — design SONABHY.
 * Arc semi-circulaire avec gradient navy→or, valeur centrale prominente.
 */
export function CmiGauge({ value, delta, label, description }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const levelLabel = getRiskLabel(clamped);

  // ── Arc SVG ───────────────────────────────────────────────────────────────
  const radius = 64;
  const cx = 84;
  const cy = 84;

  function polarToCartesian(
    centerX: number,
    centerY: number,
    r: number,
    angleInDeg: number
  ) {
    const rad = ((angleInDeg - 90) * Math.PI) / 180;
    return { x: centerX + r * Math.cos(rad), y: centerY + r * Math.sin(rad) };
  }

  function describeArc(
    x: number,
    y: number,
    r: number,
    startDeg: number,
    endDeg: number
  ) {
    const start = polarToCartesian(x, y, r, endDeg);
    const end   = polarToCartesian(x, y, r, startDeg);
    const large = endDeg - startDeg <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
  }

  const startAngle = -180;
  const endAngle   = -180 + (clamped / 100) * 180;

  const trackPath = describeArc(cx, cy, radius, -180, 0);
  const valuePath = describeArc(cx, cy, radius, startAngle, endAngle);

  // Couleur de l'arc selon le niveau
  const arcColor =
    clamped <= 30 ? "#C0392B" :
    clamped <= 50 ? "#E67E22" :
    clamped <= 70 ? "#D4AC0D" :
    clamped <= 85 ? "#27AE60" :
                    "#1ABC9C";

  // Couleur du texte niveau
  const levelColor =
    clamped <= 30 ? "text-red-600" :
    clamped <= 50 ? "text-orange-600" :
    clamped <= 70 ? "text-yellow-700" :
    clamped <= 85 ? "text-green-700" :
                    "text-teal-700";

  // Delta indicator
  const deltaIcon =
    delta === null ? null :
    delta > 0  ? <TrendingUp  className="w-3.5 h-3.5" aria-hidden="true" /> :
    delta < 0  ? <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" /> :
                 <Minus        className="w-3.5 h-3.5" aria-hidden="true" />;

  const deltaBg =
    delta === null   ? "" :
    delta > 0        ? "bg-emerald-50 text-emerald-700" :
    delta < 0        ? "bg-red-50 text-red-700" :
                       "bg-bg-muted text-fg-subtle";

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Barre colorée en haut */}
      <div className="h-1 w-full" style={{ backgroundColor: "#163061" }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-semibold text-fg-subtle uppercase tracking-widest">
            {label}
          </p>
          {delta !== null && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${deltaBg}`}>
              {deltaIcon}
              {delta >= 0 ? "+" : ""}{delta} pts
            </span>
          )}
        </div>

        {/* SVG Gauge */}
        <div className="flex flex-col items-center mt-2">
          <svg
            width="168"
            height="96"
            viewBox="0 0 168 96"
            role="img"
            aria-label={`${label} : ${Math.round(clamped)} sur 100 — ${levelLabel}`}
          >
            {/* Définition gradient */}
            <defs>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={arcColor} stopOpacity="0.7" />
                <stop offset="100%" stopColor={arcColor} />
              </linearGradient>
            </defs>

            {/* Fond de l'arc */}
            <path
              d={trackPath}
              fill="none"
              stroke="#E4E8F0"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Arc de valeur */}
            <path
              d={valuePath}
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />

            {/* Valeur centrale */}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
              fontSize="26"
              fill="#0F1B36"
            >
              {Math.round(clamped)}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fontSize="11"
              fill="#718096"
            >
              / 100
            </text>

            {/* Étiquettes min/max */}
            <text x="14" y="88" fontSize="9" fill="#A0AEC0" textAnchor="middle">0</text>
            <text x="154" y="88" fontSize="9" fill="#A0AEC0" textAnchor="middle">100</text>
          </svg>

          {/* Niveau */}
          <span className={`text-sm font-bold ${levelColor} -mt-1`}>
            {levelLabel}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-fg-muted text-center mt-4 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
