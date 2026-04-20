"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface ScorePoint {
  score: number;
  snapshot_date: string;
}

interface Props {
  scores: ScorePoint[];
}

export function ScoreChart({ scores }: Props) {
  const data = scores.map((s) => ({
    date: s.snapshot_date,
    score: Math.round(s.score),
    label: format(parseISO(s.snapshot_date), "d MMM", { locale: fr }),
  }));

  return (
    <div
      className="rounded-lg border border-border bg-white p-4"
      role="img"
      aria-label={`Graphique d'évolution du score de vigilance sur ${scores.length} jours. Score actuel : ${data.at(-1)?.score ?? 0}/100.`}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#78716C" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#78716C" }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E7E5E4",
              borderRadius: "6px",
              fontSize: "13px",
            }}
            formatter={(value: number) => [`${value} / 100`, "Score"]}
            labelFormatter={(label) => label}
          />
          {/* Lignes de bandes de risque */}
          <ReferenceLine y={30} stroke="#B91C1C" strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={70} stroke="#CA8A04" strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={85} stroke="#15803D" strokeDasharray="3 3" strokeOpacity={0.4} />

          <Line
            type="monotone"
            dataKey="score"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ fill: "#2563EB", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Légende des bandes */}
      <div className="flex gap-4 mt-2 text-xs text-fg-subtle justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-risk-critical inline-block" />Critique (&lt;30)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-risk-medium inline-block" />Modéré (51-70)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-risk-excellent inline-block" />Exemplaire (&gt;85)
        </span>
      </div>
    </div>
  );
}
