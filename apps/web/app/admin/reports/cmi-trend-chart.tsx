"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";

type DataPoint = {
  date: string;
  cmi: number | null;
  click_rate: number | null;
  report_rate: number | null;
};

type CmiTrendChartProps = {
  data: DataPoint[];
};

const FR_DATE = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const CUSTOM_TOOLTIP = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md p-3 text-sm min-w-[180px]">
      <p className="text-fg-subtle text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono font-semibold text-fg-DEFAULT">
            {entry.value.toFixed(1)}
            {entry.name !== "CMI" ? "%" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

export function CmiTrendChart({ data }: CmiTrendChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: FR_DATE(d.date),
    // click_rate et report_rate proviennent de mv_org_kpis_daily déjà en 0-100
    click_rate_pct: d.click_rate,
    report_rate_pct: d.report_rate,
  }));

  if (formatted.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-fg-muted text-sm">
        Données insuffisantes pour l&apos;affichage du graphique.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="cmi"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis
          yAxisId="rate"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />

        {/* Bandes de risque */}
        <ReferenceLine yAxisId="cmi" y={85} stroke="#22C55E" strokeDasharray="4 4" />
        <ReferenceLine yAxisId="cmi" y={70} stroke="#EAB308" strokeDasharray="4 4" />
        <ReferenceLine yAxisId="cmi" y={30} stroke="#EF4444" strokeDasharray="4 4" />

        <Tooltip content={<CUSTOM_TOOLTIP />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span className="text-fg-muted">{value}</span>}
        />

        <Line
          yAxisId="cmi"
          type="monotone"
          dataKey="cmi"
          name="CMI"
          stroke="#2563EB"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: "#2563EB" }}
          connectNulls
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="click_rate_pct"
          name="Taux de clic (%)"
          stroke="#EF4444"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="5 3"
          connectNulls
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="report_rate_pct"
          name="Taux de signalement (%)"
          stroke="#22C55E"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="5 3"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
