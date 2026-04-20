import { TrendingUp, TrendingDown, Medal } from "lucide-react";

interface DeptScore {
  department_id: string | null;
  department_name: string | null;
  user_count: number | null;
  avg_score: number | null;
  median_score: number | null;
}

interface Props {
  title: string;
  departments: DeptScore[];
  showAsBest: boolean;
}

/**
 * Classement des départements — design SONABHY premium.
 * ⚠️ Jamais de name & shame individuel — données agrégées uniquement.
 */
export function DeptRankingCard({ title, departments, showAsBest }: Props) {
  // Couleurs médailles pour les 3 premières places (côté "meilleurs")
  const medalColors = ["#C98B1A", "#A0AEC0", "#CD7F32"]; // or, argent, bronze

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Barre colorée */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: showAsBest ? "#27AE60" : "#E67E22" }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: showAsBest
                ? "rgba(39,174,96,0.12)"
                : "rgba(230,126,34,0.12)",
            }}
          >
            {showAsBest ? (
              <TrendingUp
                className="w-4 h-4"
                style={{ color: "#27AE60" }}
                aria-hidden="true"
              />
            ) : (
              <TrendingDown
                className="w-4 h-4"
                style={{ color: "#E67E22" }}
                aria-hidden="true"
              />
            )}
          </div>
          <h3 className="text-sm font-semibold text-fg-DEFAULT">{title}</h3>
        </div>

        {/* Liste */}
        {departments.length === 0 ? (
          <p className="text-sm text-fg-subtle">Aucune donnée disponible.</p>
        ) : (
          <ol className="space-y-3.5">
            {departments.map((dept, i) => {
              const score = Math.round(dept.avg_score ?? 0);
              const barColor =
                score >= 70 ? "#27AE60" :
                score >= 50 ? "#D4AC0D" :
                              "#C0392B";

              return (
                <li key={dept.department_id ?? i} className="flex items-center gap-3">
                  {/* Rang / médaille */}
                  <div className="w-6 shrink-0 flex items-center justify-center">
                    {showAsBest && i < 3 ? (
                      <Medal
                        className="w-4 h-4"
                        style={{ color: medalColors[i] }}
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="text-xs font-mono text-fg-subtle">{i + 1}</span>
                    )}
                  </div>

                  {/* Nom + utilisateurs */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg-DEFAULT truncate">
                      {dept.department_name ?? "Département"}
                    </p>
                    {dept.user_count !== null && (
                      <p className="text-xs text-fg-subtle">
                        {dept.user_count} employé{dept.user_count > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* Score + barre */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold font-mono" style={{ color: barColor }}>
                      {score}
                    </p>
                    <div className="w-16 h-1.5 bg-bg-muted rounded-full mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {/* Mention légale */}
        <p className="text-xs text-fg-subtle mt-5 pt-3 border-t border-border">
          Scores CMI agrégés — aucune donnée individuelle.
        </p>
      </div>
    </div>
  );
}
