import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  delta: number;
  invertColors?: boolean; // Pour les KPIs où une baisse est positive (ex: taux de clic)
  unit?: string;
}

export function TrendBadge({ delta, invertColors = false, unit = "pts" }: Props) {
  const isPositive = invertColors ? delta < 0 : delta > 0;
  const isNegative = invertColors ? delta > 0 : delta < 0;
  const isNeutral = delta === 0;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        isPositive
          ? "bg-green-100 text-risk-low"
          : isNegative
          ? "bg-red-100 text-risk-critical"
          : "bg-bg-muted text-fg-subtle"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" aria-hidden="true" />
      ) : isNegative ? (
        <TrendingDown className="w-3 h-3" aria-hidden="true" />
      ) : (
        <Minus className="w-3 h-3" aria-hidden="true" />
      )}
      {delta > 0 ? "+" : ""}
      {delta.toFixed(1)} {unit}
    </span>
  );
}
