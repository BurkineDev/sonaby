"use client";

import { getRiskLabel } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  value: number;
  delta: number | null;
  label: string;
  description: string;
}

const RISK_ZONES = [
  { from: 0,   to: 30,  color: "#C0392B", label: "Critique"   },
  { from: 30,  to: 50,  color: "#E67E22", label: "Élevé"      },
  { from: 50,  to: 70,  color: "#D4AC0D", label: "Modéré"     },
  { from: 70,  to: 85,  color: "#27AE60", label: "Faible"     },
  { from: 85,  to: 100, color: "#1ABC9C", label: "Exemplaire" },
] as const;

function getArcColor(v: number) {
  for (const z of RISK_ZONES) {
    if (v <= z.to) return z.color;
  }
  return "#1ABC9C";
}

export function CmiGauge({ value, delta, label, description }: Props) {
  const clamped   = Math.max(0, Math.min(100, value));
  const levelLabel = getRiskLabel(clamped);
  const arcColor   = getArcColor(clamped);

  // ── Géométrie de l'arc semi-circulaire ─────────────────────────────────────
  const W = 200, H = 114;
  const cx = W / 2, cy = H - 14;
  const R = 76, trackWidth = 14;

  function polar(deg: number) {
    const rad = ((deg - 180) * Math.PI) / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  }
  function arc(start: number, end: number) {
    const s = polar(start), e = polar(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const fullArc   = arc(0, 180);
  const valueArc  = arc(0, clamped * 1.8);

  // Needle position
  const needleDeg  = clamped * 1.8;
  const needleTip  = polar(needleDeg);
  const needleBase1 = { x: cx - 4, y: cy };
  const needleBase2 = { x: cx + 4, y: cy };

  // Delta
  const deltaPositive = delta !== null && delta > 0;
  const deltaNegative = delta !== null && delta < 0;

  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200"
      style={{ border: "1px solid #DDE2EE", boxShadow: "0 2px 8px rgba(22,48,97,0.06)" }}
    >
      {/* Stripe top navy */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, #163061, ${arcColor})` }}
      />

      <div className="px-5 pt-4 pb-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#718096" }}>
            {label}
          </p>

          {delta !== null && (
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={
                deltaPositive
                  ? { backgroundColor: "rgba(39,174,96,0.10)", color: "#1E7E4A" }
                  : deltaNegative
                  ? { backgroundColor: "rgba(192,57,43,0.10)", color: "#922B21" }
                  : { backgroundColor: "#F1F3F8", color: "#718096" }
              }
            >
              {deltaPositive
                ? <TrendingUp   className="w-3.5 h-3.5" aria-hidden="true" />
                : deltaNegative
                ? <TrendingDown  className="w-3.5 h-3.5" aria-hidden="true" />
                : <Minus         className="w-3.5 h-3.5" aria-hidden="true" />}
              {delta >= 0 ? "+" : ""}{delta} pts
            </span>
          )}
        </div>

        {/* SVG Gauge */}
        <div className="flex justify-center mt-1">
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`${label} : ${Math.round(clamped)} sur 100 — ${levelLabel}`}
          >
            <defs>
              <linearGradient id={`cmi-grad-${Math.round(clamped)}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={arcColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={arcColor} />
              </linearGradient>
              <filter id="cmi-glow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Track (fond arc) */}
            <path
              d={fullArc}
              fill="none"
              stroke="#E4E8F0"
              strokeWidth={trackWidth}
              strokeLinecap="round"
            />

            {/* Arc valeur avec glow */}
            <path
              d={valueArc}
              fill="none"
              stroke={arcColor}
              strokeWidth={trackWidth}
              strokeLinecap="round"
              filter="url(#cmi-glow)"
              style={{
                opacity: 0.35,
              }}
            />
            <path
              d={valueArc}
              fill="none"
              stroke={`url(#cmi-grad-${Math.round(clamped)})`}
              strokeWidth={trackWidth}
              strokeLinecap="round"
              style={{ transition: "d 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />

            {/* Zones de risque — mini marqueurs */}
            {RISK_ZONES.map((z) => {
              const p = polar(z.to * 1.8);
              return z.to < 100 ? (
                <circle
                  key={z.to}
                  cx={p.x} cy={p.y}
                  r={2}
                  fill="white"
                  opacity={0.5}
                />
              ) : null;
            })}

            {/* Needle */}
            <polygon
              points={`${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y} ${needleTip.x},${needleTip.y}`}
              fill={arcColor}
              opacity={0.85}
              style={{ transition: "points 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
            <circle cx={cx} cy={cy} r={6} fill="white" stroke="#DDE2EE" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={3} fill={arcColor} />

            {/* Valeur centrale */}
            <text
              x={cx} y={cy - 20}
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
              fontSize="28"
              fill="#0F1B36"
            >
              {Math.round(clamped)}
            </text>
            <text
              x={cx} y={cy - 5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#A0AEC0"
            >
              / 100
            </text>

            {/* Labels min/max */}
            <text x={R - 68}  y={H - 2} fontSize="9" fill="#C0CBD8" textAnchor="middle">0</text>
            <text x={W - R + 68} y={H - 2} fontSize="9" fill="#C0CBD8" textAnchor="middle">100</text>
          </svg>
        </div>

        {/* Level badge */}
        <div className="flex justify-center -mt-1 mb-3">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: `${arcColor}15`,
              color: arcColor,
              border: `1px solid ${arcColor}35`,
            }}
          >
            {levelLabel}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-center leading-relaxed" style={{ color: "#8A96A8" }}>
          {description}
        </p>
      </div>
    </div>
  );
}
