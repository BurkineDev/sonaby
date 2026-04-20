import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";

interface Props {
  label: string;
  value: number | null;
  unit?: string;
  delta: number | null;
  deltaPeriod: string;
  description: string;
  invertDelta?: boolean;
  target?: string;
  accentColor?: "navy" | "gold" | "green" | "red";
}

/**
 * KPI Card — design premium SONABHY.
 * Valeur en text-4xl, tendance explicite, objectif contractuel.
 */
export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaPeriod,
  description,
  invertDelta = false,
  target,
  accentColor = "navy",
}: Props) {
  const isPositive = delta !== null && (invertDelta ? delta < 0 : delta > 0);
  const isNegative = delta !== null && (invertDelta ? delta > 0 : delta < 0);

  const accentMap = {
    navy:  { bar: "#163061", bg: "rgba(22,48,97,0.06)", text: "#163061" },
    gold:  { bar: "#C98B1A", bg: "rgba(201,139,26,0.08)", text: "#7D530F" },
    green: { bar: "#27AE60", bg: "rgba(39,174,96,0.08)", text: "#1E7E4A" },
    red:   { bar: "#C0392B", bg: "rgba(192,57,43,0.08)", text: "#922B21" },
  };

  const accent = accentMap[accentColor];

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Barre colorée en haut */}
      <div className="h-1 w-full" style={{ backgroundColor: accent.bar }} />

      <div className="p-5 space-y-4">
        {/* Label */}
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-widest">
          {label}
        </p>

        {/* Valeur principale + delta */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold font-mono text-fg-DEFAULT">
              {value !== null ? value.toLocaleString("fr-BF") : "—"}
            </span>
            {unit && (
              <span className="text-base font-medium text-fg-muted">{unit}</span>
            )}
          </div>

          {/* Badge delta */}
          {delta !== null && (
            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : isNegative
                  ? "bg-red-50 text-red-700"
                  : "bg-bg-muted text-fg-subtle"
              }`}
              aria-label={`Évolution : ${delta >= 0 ? "+" : ""}${delta} ${unit ?? "pts"}`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3" aria-hidden="true" />
              ) : (
                <Minus className="w-3 h-3" aria-hidden="true" />
              )}
              {delta >= 0 ? "+" : ""}{delta}
              {unit}
            </span>
          )}
        </div>

        {/* Période de comparaison */}
        {delta !== null && (
          <p className="text-xs text-fg-subtle">{deltaPeriod}</p>
        )}

        {/* Description */}
        <p className="text-xs text-fg-muted leading-relaxed">{description}</p>

        {/* Objectif contractuel */}
        {target && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: accent.bg, color: accent.text }}
          >
            <Target className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Objectif : {target}</span>
          </div>
        )}
      </div>
    </div>
  );
}
