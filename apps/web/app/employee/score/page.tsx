import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ScoreChart } from "./score-chart";
import { getRiskLabel, getRiskColor, getRiskBgColor, formatDate } from "@/lib/utils";
import { Info } from "lucide-react";

export const metadata: Metadata = { title: "Mon score de vigilance" };

export default async function ScorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 90 derniers jours de scores
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: scores } = await supabase
    .from("risk_scores")
    .select(
      "score, quiz_component, phishing_component, engagement_component, report_bonus, snapshot_date"
    )
    .eq("user_id", user.id)
    .gte("snapshot_date", ninetyDaysAgo.toISOString().split("T")[0])
    .order("snapshot_date", { ascending: true });

  const latest = scores?.at(-1);
  const first = scores?.[0];

  const scoreRounded = latest ? Math.round(latest.score) : 0;
  const progression =
    latest && first ? parseFloat((latest.score - first.score).toFixed(1)) : 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-fg-DEFAULT">Mon score de vigilance</h1>

      {/* Score actuel */}
      {latest ? (
        <div className={`rounded-lg border p-6 ${getRiskBgColor(scoreRounded)}`}>
          <div className="flex items-baseline gap-3 mb-2">
            <span className={`text-5xl font-bold font-mono ${getRiskColor(scoreRounded)}`}>
              {scoreRounded}
            </span>
            <span className="text-lg text-fg-muted">/ 100</span>
            <span className={`text-sm font-medium ${getRiskColor(scoreRounded)}`}>
              — {getRiskLabel(scoreRounded)}
            </span>
          </div>

          {progression !== 0 && (
            <p className="text-sm text-fg-muted">
              {progression > 0 ? "+" : ""}{progression} pts sur les 90 derniers jours
            </p>
          )}

          <p className="text-xs text-fg-subtle mt-2">
            Mis à jour le {formatDate(latest.snapshot_date)}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white p-6 text-center">
          <p className="text-sm text-fg-muted">
            Votre score sera disponible après votre premier quiz.
          </p>
        </div>
      )}

      {/* Graphique d'évolution */}
      {scores && scores.length > 1 && (
        <section aria-labelledby="chart-heading">
          <h2 id="chart-heading" className="text-base font-semibold text-fg-DEFAULT mb-3">
            Évolution sur 90 jours
          </h2>
          <ScoreChart scores={scores} />
        </section>
      )}

      {/* Décomposition du score */}
      {latest && (
        <section aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-base font-semibold text-fg-DEFAULT mb-3">
            Décomposition de votre score
          </h2>

          <div className="rounded-lg border border-border bg-white p-5 space-y-4">
            {[
              {
                label: "Quiz et connaissances",
                value: latest.quiz_component,
                weight: 35,
                desc: "Vos résultats aux quiz sur les 90 derniers jours, pondérés par difficulté et décroissance temporelle.",
              },
              {
                label: "Comportement face au phishing",
                value: latest.phishing_component,
                weight: 45,
                desc: "Vos actions lors des simulations : clic, soumission, signalement. Le comportement réel pèse le plus lourd.",
              },
              {
                label: "Engagement",
                value: latest.engagement_component,
                weight: 20,
                desc: "Régularité de vos connexions et complétion de modules.",
              },
            ].map(({ label, value, weight, desc }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-fg-DEFAULT">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-fg-subtle">{weight}% du score</span>
                    <span className="text-sm font-semibold font-mono text-fg-DEFAULT">
                      {Math.round(value ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-bg-muted rounded-full mb-1.5">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${Math.min(value ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-fg-subtle">{desc}</p>
              </div>
            ))}

            {/* Bonus signalement */}
            {(latest.report_bonus ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3">
                <Info className="w-4 h-4 text-risk-low mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-risk-low">
                    +{latest.report_bonus.toFixed(1)} pts de bonus signalement
                  </p>
                  <p className="text-xs text-fg-muted">
                    Vous avez signalé des emails suspects — ce comportement est le plus vertueux.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Note de transparence */}
      <div className="rounded-md bg-bg-subtle border border-border p-4">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-fg-subtle mt-0.5 shrink-0" />
          <div className="text-xs text-fg-muted space-y-1">
            <p>
              <strong className="text-fg-DEFAULT">Votre score n'est pas une sanction.</strong>{" "}
              Il mesure votre progression. Un score faible déclenche uniquement des formations
              supplémentaires, jamais une conséquence professionnelle.
            </p>
            <p>
              Le score individuel n'est visible que par vous. Le RSSI voit uniquement des
              agrégats anonymisés, sauf si vous avez consenti aux rapports individuels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
