/**
 * Types du moteur de scoring CyberGuard SONABHY
 * Voir docs/04-scoring-engine.md pour la spécification complète.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

export interface ScoringConfig {
  // Poids des composantes (somme = 1.0)
  weight_quiz: number;      // w_q = 0.35
  weight_phishing: number;  // w_p = 0.45
  weight_engagement: number; // w_e = 0.20

  // Décroissance temporelle
  lambda_quiz: number;      // λ_q = 0.011 (demi-vie ~63j)
  lambda_phishing: number;  // λ_p = 0.008 (demi-vie ~87j)

  // Pénalités phishing
  penalty_click: number;       // -8
  penalty_submit: number;      // -20
  penalty_attachment: number;  // -15

  // Bonus phishing
  bonus_report_before: number; // +15
  bonus_report_after: number;  // +5

  // Facteurs de difficulté phishing
  factor_easy: number;    // 1.0
  factor_medium: number;  // 1.3
  factor_hard: number;    // 1.6

  // Bonus signalement
  max_report_bonus: number; // 5
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weight_quiz: 0.35,
  weight_phishing: 0.45,
  weight_engagement: 0.20,
  lambda_quiz: 0.011,
  lambda_phishing: 0.008,
  penalty_click: 8,
  penalty_submit: 20,
  penalty_attachment: 15,
  bonus_report_before: 15,
  bonus_report_after: 5,
  factor_easy: 1.0,
  factor_medium: 1.3,
  factor_hard: 1.6,
  max_report_bonus: 5,
};

// ─── Inputs ───────────────────────────────────────────────────────────────────

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "easy" | "medium" | "hard";

export interface QuizAttemptInput {
  /** Score normalisé 0–100 */
  score: number;
  /** Difficulté de la question/quiz */
  difficulty: DifficultyLevel;
  /** Jours écoulés depuis la tentative */
  daysAgo: number;
  /** Identifiant de déduplication (anti-farming : 1 par question/30j) */
  questionId: string;
}

export interface PhishingEventInput {
  type: "clicked" | "submitted_credentials" | "attachment_opened" | "reported" | "delivered" | "opened";
  difficulty: DifficultyLevel;
  /** Jours écoulés depuis l'événement */
  daysAgo: number;
  /** Si true : le signalement a eu lieu avant tout clic (proactif) */
  reportedBeforeClick?: boolean;
}

export interface EngagementInput {
  /** Modules assignés sur 90 jours */
  modulesAssigned: number;
  /** Modules complétés sur 90 jours */
  modulesCompleted: number;
  /** Semaines consécutives avec au moins 1 activité */
  streakWeeks: number;
  /** Modules JIT déclenchés sur 90 jours */
  jitTriggered: number;
  /** Modules JIT complétés sur 90 jours */
  jitCompleted: number;
}

export interface UserScoringInput {
  /** Jours depuis l'enrôlement */
  daysSinceEnrollment: number;
  quizAttempts: QuizAttemptInput[];
  phishingEvents: PhishingEventInput[];
  engagement: EngagementInput;
  /** Signalements légitimes sur 90 jours */
  legitimateReports: number;
  /** True si aucune campagne phishing n'a encore été reçue */
  noCampaignReceived: boolean;
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

export interface ScoringComponents {
  /** Composante Quiz [0, 100] ou null si données insuffisantes */
  quiz: number | null;
  /** Composante Phishing [0, 100] ou null si aucune campagne */
  phishing: number | null;
  /** Composante Engagement [0, 100] */
  engagement: number;
  /** Bonus signalement [0, max_report_bonus] */
  reportBonus: number;
}

export interface ScoringResult {
  /** Score final [0, 100] ou null (< 7j depuis enrôlement) */
  score: number | null;
  components: ScoringComponents;
  dataQuality: {
    /** False si < 7 jours depuis enrôlement */
    hasBaseline: boolean;
    /** False si aucune tentative de quiz sur 90j */
    hasQuizData: boolean;
    /** False si aucune campagne reçue */
    hasPhishingData: boolean;
    /** Nombre de tentatives de quiz déduplicées */
    quizAttemptCount: number;
  };
  /** Version du moteur utilisée */
  version: string;
}
