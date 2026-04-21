import { TrendingUp, TrendingDown, Minus, Target, type LucideIcon } from "lucide-react";

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
  icon?: LucideIcon;
}

const ACCENT = {
  navy:  { bar: "#163061", bg: "rgba(22,48,97,0.07)",   text: "#163061",  light: "rgba(22,48,97,0.12)"  },
  gold:  { bar: "#C98B1A", bg: "rgba(201,139,26,0.08)", text: "#7D530F",  light: "rgba(201,139,26,0.15)" },
  green: { bar: "#27AE60", bg: "rgba(39,174,96,0.08)",  text: "#1E7E4A",  light: "rgba(39,174,96,0.15)"  },
  red:   { bar: "#C0392B", bg: "rgba(192,57,43,0.08)",  text: "#922B21",  light: "rgba(192,57,43,0.15)"  },
};

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
  icon: Icon,
}: Props) {
  const isPositive = delta !== null && (invertDelta ? delta < 0 : delta > 0);
  const isNegative = delta !== null && (invertDelta ? delta > 0 : delta < 0);
  const accent = ACCENT[accentColor];

  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200"
      style={{ border: "1px solid #DDE2EE", boxShadow: "0 2px 8px rgba(22,48,97,0.06)" }}
    >
      {/* Stripe verticale gauche */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: `linear-gradient(180deg, ${accent.bar}, ${accent.bar}88)` }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Header : label + icône + delta */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent.light }}
              >
                <Icon className="w-4 h-4" style={{ color: accent.bar }} aria-hidden="true" />
              </div>
            )}
            <p
              className="text-xs font-bold uppercase tracking-widest leading-tight"
              style={{ color: "#718096" }}
            >
              {label}
            </p>
          </div>

          {delta !== null && (
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
              style={
                isPositive
                  ? { backgroundColor: "rgba(39,174,96,0.10)", color: "#1E7E4A" }
                  : isNegative
                  ? { backgroundColor: "rgba(192,57,43,0.10)", color: "#922B21" }
                  : { backgroundColor: "#F1F3F8", color: "#718096" }
              }
              aria-label={`Évolution : ${delta >= 0 ? "+" : ""}${delta} ${unit ?? "pts"}`}
            >
              {isPositive
                ? <TrendingUp  className="w-3 h-3" aria-hidden="true" />
                : isNegative
                ? <TrendingDown className="w-3 h-3" aria-hidden="true" />
                : <Minus        className="w-3 h-3" aria-hidden="true" />}
              {delta >= 0 ? "+" : ""}{delta}{unit}
            </span>
          )}
        </div>

        {/* Valeur principale */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span
            className="font-bold font-mono leading-none"
            style={{ color: "#0F1B36", fontSize: "2.25rem", letterSpacing: "-0.03em" }}
          >
            {value !== null ? value.toLocaleString("fr-BF") : "—"}
          </span>
          {unit && (
            <span className="text-base font-semibold" style={{ color: "#718096" }}>
              {unit}
            </span>
          )}
        </div>

        {/* Période de comparaison */}
        {delta !== null && (
          <p className="text-xs mb-2" style={{ color: "#A0AEC0" }}>{deltaPeriod}</p>
        )}

        {/* Description */}
        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{description}</p>

        {/* Objectif contractuel */}
        {target && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mt-3 text-xs font-semibold"
            style={{ backgroundColor: accent.bg, color: accent.text }}
          >
            <Target className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Objectif : {target}
          </div>
        )}
      </div>
    </div>
  );
}
