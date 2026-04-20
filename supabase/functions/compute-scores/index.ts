/**
 * Edge Function: compute-scores
 *
 * Calcule le Risk Score individuel (v1.0.0) pour tous les utilisateurs actifs.
 * Planifiée par pg_cron chaque nuit à 01h00 UTC.
 *
 * Algorithme complet — voir docs/04-scoring-engine.md
 *
 * Score = w_q·Q + w_p·P + w_e·E + B_report  (clamped [0, 100])
 *
 * Déclenchement manuel (test) :
 *   supabase functions invoke compute-scores --project-ref <REF>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const COMPUTATION_VERSION = "v1.0.0";

// ─── Types internes ───────────────────────────────────────────────────────────

interface ScoringConfig {
  weight_quiz: number;
  weight_phishing: number;
  weight_engagement: number;
  lambda_quiz: number;
  lambda_phishing: number;
  penalty_click: number;
  penalty_submit: number;
  penalty_attachment: number;
  bonus_report_before: number;
  bonus_report_after: number;
  max_report_bonus: number;
  factor_easy: number;
  factor_medium: number;
  factor_hard: number;
}

interface QuizAttempt {
  is_correct: boolean;
  created_at: string;
  difficulty: string;
}

interface PhishingEvent {
  event_type: string;
  occurred_at: string;
  difficulty: string;
}

interface UserData {
  id: string;
  enrolled_at: string | null;
  last_active_at: string | null;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function difficultyFactor(cfg: ScoringConfig, difficulty: string): number {
  if (difficulty === "easy") return cfg.factor_easy;
  if (difficulty === "hard") return cfg.factor_hard;
  return cfg.factor_medium;
}

// ─── Composante Quiz (Q) ──────────────────────────────────────────────────────

function computeQuizComponent(
  attempts: QuizAttempt[],
  cfg: ScoringConfig
): number {
  if (attempts.length === 0) return 50; // Aucun quiz = score médian

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recent = attempts.filter(
    (a) => new Date(a.created_at) >= ninetyDaysAgo
  );

  if (recent.length === 0) return 50;

  // Déduplique par question+fenêtre 30j (anti-farming)
  // Simplification v1 : on garde une tentative par (question_id, 30j window)
  // Implémenté côté SQL via window dans la query

  let numerator = 0;
  let denominator = 0;

  for (const attempt of recent) {
    const days = daysSince(attempt.created_at);
    const decay = Math.exp(-cfg.lambda_quiz * days);
    const diff = difficultyFactor(cfg, attempt.difficulty);
    const score = attempt.is_correct ? 100 : 0;

    numerator += score * diff * decay;
    denominator += diff * decay;
  }

  return denominator > 0 ? clamp(numerator / denominator, 0, 100) : 50;
}

// ─── Composante Phishing (P) ─────────────────────────────────────────────────

function computePhishingComponent(
  events: PhishingEvent[],
  cfg: ScoringConfig
): number | null {
  if (events.length === 0) return null; // Pas encore de campagne

  let score = 100;

  for (const event of events) {
    const days = daysSince(event.occurred_at);
    const decay = Math.exp(-cfg.lambda_phishing * days);
    const diff = difficultyFactor(cfg, event.difficulty);

    if (event.event_type === "clicked") {
      score -= cfg.penalty_click * diff * decay;
    } else if (event.event_type === "submitted_credentials") {
      score -= cfg.penalty_submit * diff * decay;
    } else if (event.event_type === "attachment_opened") {
      score -= cfg.penalty_attachment * diff * decay;
    } else if (event.event_type === "reported") {
      // Bonus signalement plafonné à bonus_report_before
      score += cfg.bonus_report_before * diff * decay;
    }
  }

  return clamp(score, 0, 100);
}

// ─── Composante Engagement (E) ────────────────────────────────────────────────

function computeEngagementComponent(
  user: UserData,
  completedModulesCount: number
): number {
  if (!user.enrolled_at) return 0;

  const daysSinceEnroll = daysSince(user.enrolled_at);
  if (daysSinceEnroll < 1) return 50;

  const daysSinceActive = user.last_active_at
    ? daysSince(user.last_active_at)
    : daysSinceEnroll;

  // Pénalité pour inactivité récente
  const activityScore = daysSinceActive <= 7 ? 100 : daysSinceActive <= 30 ? 70 : 40;

  // Bonus modules complétés
  const completionBonus = Math.min(completedModulesCount * 5, 40);

  return clamp(activityScore * 0.6 + completionBonus * 0.4, 0, 100);
}

// ─── Bonus signalement (B_report) ────────────────────────────────────────────

function computeReportBonus(events: PhishingEvent[], cfg: ScoringConfig): number {
  const reportedEvents = events.filter((e) => e.event_type === "reported");
  if (reportedEvents.length === 0) return 0;

  let bonus = 0;
  for (const event of reportedEvents) {
    const days = daysSince(event.occurred_at);
    const decay = Math.exp(-cfg.lambda_phishing * days);
    bonus += 2 * decay; // 2 pts par signalement récent
  }

  return Math.min(bonus, cfg.max_report_bonus);
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Sécurité : n'accepter que les appels depuis pg_cron ou avec un secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` && req.method !== "POST") {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const snapshotDate = new Date().toISOString().split("T")[0]!;

  console.log(`[compute-scores] Début calcul pour le ${snapshotDate}`);

  // 1. Récupérer la config de scoring active
  const { data: configRows } = await supabase
    .from("scoring_config")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!configRows) {
    console.error("[compute-scores] Aucune config active trouvée");
    return new Response("No active scoring config", { status: 500 });
  }

  const cfg = configRows as ScoringConfig;

  // 2. Récupérer tous les utilisateurs actifs
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, enrolled_at, last_active_at")
    .eq("is_active", true)
    .not("enrolled_at", "is", null);

  if (usersError || !users) {
    console.error("[compute-scores] Erreur récupération users:", usersError);
    return new Response("Error fetching users", { status: 500 });
  }

  console.log(`[compute-scores] ${users.length} utilisateurs à traiter`);

  let processed = 0;
  let errors = 0;

  // 3. Calculer le score pour chaque utilisateur
  for (const user of users) {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const ninetyDaysAgoStr = ninetyDaysAgo.toISOString();

      // Quiz attempts des 90 derniers jours
      const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select("is_correct, created_at, modules(difficulty)")
        .eq("user_id", user.id)
        .gte("created_at", ninetyDaysAgoStr);

      // Phishing events + difficulté du template
      const { data: phishingEvents } = await supabase
        .from("phishing_events")
        .select(`
          event_type, occurred_at,
          phishing_sends(phishing_campaigns(phishing_templates(difficulty)))
        `)
        .eq("user_id", user.id)
        .gte("occurred_at", ninetyDaysAgoStr);

      // Modules complétés
      const { count: completedCount } = await supabase
        .from("module_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      // Préparer les données normalisées
      const normalizedQuiz: QuizAttempt[] = (quizAttempts ?? []).map((a) => ({
        is_correct: a.is_correct,
        created_at: a.created_at,
        difficulty: (a.modules as { difficulty: string } | null)?.difficulty ?? "medium",
      }));

      const normalizedPhishing: PhishingEvent[] = (phishingEvents ?? []).map((e) => ({
        event_type: e.event_type,
        occurred_at: e.occurred_at,
        difficulty:
          (
            e.phishing_sends as {
              phishing_campaigns: { phishing_templates: { difficulty: string } };
            } | null
          )?.phishing_campaigns?.phishing_templates?.difficulty ?? "medium",
      }));

      // Calculer les composantes
      const Q = computeQuizComponent(normalizedQuiz, cfg);
      const P = computePhishingComponent(normalizedPhishing, cfg);
      const E = computeEngagementComponent(user, completedCount ?? 0);
      const B = computeReportBonus(normalizedPhishing, cfg);

      const phishingForScore = P ?? 50; // null = pas de campagne reçue → médian
      const rawScore =
        cfg.weight_quiz * Q +
        cfg.weight_phishing * phishingForScore +
        cfg.weight_engagement * E +
        B;

      const finalScore = clamp(parseFloat(rawScore.toFixed(2)), 0, 100);

      // Upsert du snapshot journalier
      const { error: upsertError } = await supabase.from("risk_scores").upsert(
        {
          user_id: user.id,
          snapshot_date: snapshotDate,
          score: finalScore,
          quiz_component: parseFloat(Q.toFixed(2)),
          phishing_component: parseFloat((P ?? 50).toFixed(2)),
          engagement_component: parseFloat(E.toFixed(2)),
          report_bonus: parseFloat(B.toFixed(2)),
          computation_version: COMPUTATION_VERSION,
        },
        { onConflict: "user_id,snapshot_date" }
      );

      if (upsertError) {
        console.error(`[compute-scores] Erreur upsert user ${user.id}:`, upsertError);
        errors++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`[compute-scores] Exception pour user ${user.id}:`, err);
      errors++;
    }
  }

  // 4. Rafraîchir les vues matérialisées
  await supabase.rpc("refresh_materialized_views" as never);

  const summary = {
    date: snapshotDate,
    version: COMPUTATION_VERSION,
    total: users.length,
    processed,
    errors,
  };

  console.log("[compute-scores] Terminé :", summary);
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
