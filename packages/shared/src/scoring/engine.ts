/**
 * Moteur de scoring CyberGuard SONABHY — v1.0.0
 *
 * Fonctions pures. Aucune dépendance Supabase / réseau.
 * Utilisé par :
 *   - supabase/functions/compute-scores/ (Edge Function nocturne)
 *   - packages/shared/src/scoring/__tests__/ (Vitest)
 *
 * Spécification complète : docs/04-scoring-engine.md
 *
 * Invariants :
 *   - Score ∈ [0, 100] ou null (baseline insuffisante)
 *   - Ajouter un signalement légitime ne réduit jamais le score
 *   - Un user enrôlé < 7 jours → score = null
 *   - Un user sans campagne reçue → P = 50 (score médian, indiqué "Données limitées")
 */

import type {
  ScoringConfig,
  ScoringResult,
  ScoringComponents,
  UserScoringInput,
  QuizAttemptInput,
  PhishingEventInput,
  DifficultyLevel,
} from "./types";
import { DEFAULT_SCORING_CONFIG } from "./types";

export const ENGINE_VERSION = "v1.0.0";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export function exponentialDecay(lambda: number, daysAgo: number): number {
  return Math.exp(-lambda * daysAgo);
}

function difficultyWeight(level: DifficultyLevel): number {
  // Pour le quiz : easy=1, medium=2, hard=3
  if (level === "easy" || level === "beginner") return 1;
  if (level === "hard" || level === "advanced") return 3;
  return 2; // medium / intermediate
}

function phishingDifficultyFactor(cfg: ScoringConfig, level: DifficultyLevel): number {
  if (level === "easy" || level === "beginner") return cfg.factor_easy;
  if (level === "hard" || level === "advanced") return cfg.factor_hard;
  return cfg.factor_medium;
}

// ─── Déduplication anti-farming des quiz ─────────────────────────────────────

/**
 * Déduplique les tentatives de quiz : une seule par questionId par fenêtre de 30 jours.
 * On garde la plus récente.
 */
export function deduplicateQuizAttempts(
  attempts: QuizAttemptInput[]
): QuizAttemptInput[] {
  // Grouper par questionId, ne garder que la plus récente (daysAgo minimal)
  const byQuestion = new Map<string, QuizAttemptInput>();
  for (const attempt of attempts) {
    const existing = byQuestion.get(attempt.questionId);
    if (!existing || attempt.daysAgo < existing.daysAgo) {
      byQuestion.set(attempt.questionId, attempt);
    }
  }
  return Array.from(byQuestion.values());
}

// ─── Composante Quiz (Q) ──────────────────────────────────────────────────────

/**
 * Q = Σ(score_i · difficulté_i · decay_i) / Σ(difficulté_i · decay_i)
 *
 * Retourne null si aucune tentative.
 * Retourne 50 si données insuffisantes (drapeau "hasQuizData = false").
 */
export function computeQuizComponent(
  rawAttempts: QuizAttemptInput[],
  cfg: ScoringConfig
): number | null {
  const attempts = deduplicateQuizAttempts(rawAttempts);
  if (attempts.length === 0) return null;

  let numerator = 0;
  let denominator = 0;

  for (const attempt of attempts) {
    const w = difficultyWeight(attempt.difficulty);
    const decay = exponentialDecay(cfg.lambda_quiz, attempt.daysAgo);
    numerator += attempt.score * w * decay;
    denominator += w * decay;
  }

  if (denominator === 0) return null;
  return clamp(numerator / denominator);
}

// ─── Composante Phishing (P) ──────────────────────────────────────────────────

/**
 * P = 100 − pénalités + bonus (clamped [0, 100])
 *
 * Chaque événement est pondéré par difficulté et decay temporel.
 * Retourne null si noCampaignReceived = true.
 */
export function computePhishingComponent(
  events: PhishingEventInput[],
  cfg: ScoringConfig
): number | null {
  // Filtrer uniquement les événements pertinents (exclure delivered/opened)
  const relevant = events.filter(
    (e) =>
      e.type === "clicked" ||
      e.type === "submitted_credentials" ||
      e.type === "attachment_opened" ||
      e.type === "reported"
  );

  if (relevant.length === 0) return null;

  let delta = 0;

  for (const ev of relevant) {
    const factor = phishingDifficultyFactor(cfg, ev.difficulty);
    const decay = exponentialDecay(cfg.lambda_phishing, ev.daysAgo);

    switch (ev.type) {
      case "clicked":
        delta -= cfg.penalty_click * factor * decay;
        break;
      case "submitted_credentials":
        // -20 (submit inclut le clic implicite)
        delta -= cfg.penalty_submit * factor * decay;
        break;
      case "attachment_opened":
        delta -= cfg.penalty_attachment * factor * decay;
        break;
      case "reported":
        if (ev.reportedBeforeClick) {
          delta += cfg.bonus_report_before * factor * decay;
        } else {
          delta += cfg.bonus_report_after * decay;
        }
        break;
    }
  }

  return clamp(100 + delta);
}

// ─── Composante Engagement (E) ────────────────────────────────────────────────

/**
 * E = 0.5 · completion_rate_90d
 *   + 0.3 · streak_factor
 *   + 0.2 · jit_compliance
 */
export function computeEngagementComponent(
  eng: UserScoringInput["engagement"]
): number {
  const completionRate =
    eng.modulesAssigned > 0
      ? clamp((eng.modulesCompleted / eng.modulesAssigned) * 100)
      : 0;

  const streakFactor = clamp((Math.min(eng.streakWeeks, 12) / 12) * 100);

  const jitCompliance =
    eng.jitTriggered > 0
      ? clamp((eng.jitCompleted / eng.jitTriggered) * 100)
      : 100; // Pas de JIT déclenché = conformité parfaite par défaut

  return clamp(0.5 * completionRate + 0.3 * streakFactor + 0.2 * jitCompliance);
}

// ─── Bonus signalement (B_report) ────────────────────────────────────────────

/**
 * B_report = min(max_report_bonus, legitimateReports × 0.5)
 */
export function computeReportBonus(
  legitimateReports: number,
  cfg: ScoringConfig
): number {
  return Math.min(cfg.max_report_bonus, legitimateReports * 0.5);
}

// ─── Score global ─────────────────────────────────────────────────────────────

/**
 * Risk Score = w_q·Q + w_p·P + w_e·E + B_report  (clamped [0, 100])
 *
 * Cas limites :
 * - < 7 jours d'enrôlement → null
 * - Pas de quiz data → Q = 50 (médian, "données limitées")
 * - Pas de phishing data → P = 50 (médian, "aucune campagne")
 */
export function computeRiskScore(
  input: UserScoringInput,
  cfg: ScoringConfig = DEFAULT_SCORING_CONFIG,
  version = ENGINE_VERSION
): ScoringResult {
  // Cas limite : enrôlement trop récent
  if (input.daysSinceEnrollment < 7) {
    return {
      score: null,
      components: {
        quiz: null,
        phishing: null,
        engagement: computeEngagementComponent(input.engagement),
        reportBonus: 0,
      },
      dataQuality: {
        hasBaseline: false,
        hasQuizData: false,
        hasPhishingData: false,
        quizAttemptCount: 0,
      },
      version,
    };
  }

  const deduped = deduplicateQuizAttempts(input.quizAttempts);
  const hasQuizData = deduped.length > 0;
  const hasPhishingData = !input.noCampaignReceived;

  // Calculer les composantes
  const rawQ = computeQuizComponent(input.quizAttempts, cfg);
  const Q = rawQ !== null ? rawQ : 50; // Médian si pas de données

  const rawP = input.noCampaignReceived
    ? null
    : computePhishingComponent(input.phishingEvents, cfg);
  const P = rawP !== null ? rawP : 50; // Médian si pas de campagne

  const E = computeEngagementComponent(input.engagement);
  const B = computeReportBonus(input.legitimateReports, cfg);

  const rawScore = cfg.weight_quiz * Q + cfg.weight_phishing * P + cfg.weight_engagement * E + B;
  const finalScore = clamp(rawScore);

  return {
    score: Math.round(finalScore * 10) / 10, // arrondi à 0.1
    components: {
      quiz: rawQ !== null ? Math.round(Q * 10) / 10 : null,
      phishing: rawP !== null ? Math.round(P * 10) / 10 : null,
      engagement: Math.round(E * 10) / 10,
      reportBonus: B,
    },
    dataQuality: {
      hasBaseline: true,
      hasQuizData,
      hasPhishingData,
      quizAttemptCount: deduped.length,
    },
    version,
  };
}

// ─── CMI — Cyber Maturity Index ───────────────────────────────────────────────

export interface CmiInput {
  /** % employés enrôlés × % actifs 30j ∈ [0, 100] */
  coverageScore: number;
  /** Moyenne pondérée des P_user actifs */
  behaviourScore: number;
  /** Moyenne pondérée des Q_user + taux de complétion global */
  learningScore: number;
  /** Report rate × 100 + bonus Security Champions */
  cultureScore: number;
  /** Δ CMI sur 90j + temps de réaction moyen */
  resilienceScore: number;
}

/**
 * CMI = 0.25·D_couverture + 0.25·D_comportement + 0.20·D_apprentissage
 *     + 0.15·D_culture + 0.15·D_résilience
 */
export function computeCmi(input: CmiInput): number {
  const raw =
    0.25 * clamp(input.coverageScore) +
    0.25 * clamp(input.behaviourScore) +
    0.20 * clamp(input.learningScore) +
    0.15 * clamp(input.cultureScore) +
    0.15 * clamp(input.resilienceScore);
  return Math.round(clamp(raw) * 10) / 10;
}

export type { ScoringConfig, ScoringResult, UserScoringInput };
