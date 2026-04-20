/**
 * Fixtures de test pour le scoring engine.
 * Inspirées de cas réels SONABHY (voir 04-scoring-engine.md §3 Cas limites).
 */

import type { UserScoringInput, ScoringConfig } from "../types.js";
import { DEFAULT_SCORING_CONFIG } from "../types.js";

// ─── Config de base ───────────────────────────────────────────────────────────

export const baseConfig: ScoringConfig = { ...DEFAULT_SCORING_CONFIG };

// ─── Builder de fixtures ──────────────────────────────────────────────────────

type FixtureOverrides = Partial<{
  daysSinceEnrollment: number;
  quizScore: number;
  quizDifficulty: "easy" | "medium" | "hard";
  quizDaysAgo: number;
  quizCount: number;
  phishingClicked: boolean;
  phishingSubmitted: boolean;
  phishingReported: boolean;
  phishingReportedBefore: boolean;
  phishingDifficulty: "easy" | "medium" | "hard";
  phishingDaysAgo: number;
  noCampaign: boolean;
  modulesAssigned: number;
  modulesCompleted: number;
  streakWeeks: number;
  jitTriggered: number;
  jitCompleted: number;
  legitimateReports: number;
}>;

export function withFixtures(overrides: FixtureOverrides = {}): UserScoringInput {
  const {
    daysSinceEnrollment = 30,
    quizScore = 80,
    quizDifficulty = "medium",
    quizDaysAgo = 5,
    quizCount = 3,
    phishingClicked = false,
    phishingSubmitted = false,
    phishingReported = false,
    phishingReportedBefore = false,
    phishingDifficulty = "medium",
    phishingDaysAgo = 7,
    noCampaign = false,
    modulesAssigned = 5,
    modulesCompleted = 4,
    streakWeeks = 6,
    jitTriggered = 0,
    jitCompleted = 0,
    legitimateReports = 0,
  } = overrides;

  const quizAttempts = Array.from({ length: quizCount }, (_, i) => ({
    score: quizScore,
    difficulty: quizDifficulty as "easy" | "medium" | "hard",
    daysAgo: quizDaysAgo + i,
    questionId: `q-${i + 1}`,
  }));

  const phishingEvents: UserScoringInput["phishingEvents"] = [];
  if (!noCampaign) {
    phishingEvents.push({
      type: "delivered",
      difficulty: phishingDifficulty as "easy" | "medium" | "hard",
      daysAgo: phishingDaysAgo + 1,
    });
    if (phishingClicked) {
      phishingEvents.push({
        type: "clicked",
        difficulty: phishingDifficulty as "easy" | "medium" | "hard",
        daysAgo: phishingDaysAgo,
      });
    }
    if (phishingSubmitted) {
      phishingEvents.push({
        type: "submitted_credentials",
        difficulty: phishingDifficulty as "easy" | "medium" | "hard",
        daysAgo: phishingDaysAgo,
      });
    }
    if (phishingReported) {
      phishingEvents.push({
        type: "reported",
        difficulty: phishingDifficulty as "easy" | "medium" | "hard",
        daysAgo: phishingDaysAgo,
        reportedBeforeClick: phishingReportedBefore,
      });
    }
  }

  return {
    daysSinceEnrollment,
    quizAttempts,
    phishingEvents,
    engagement: {
      modulesAssigned,
      modulesCompleted,
      streakWeeks,
      jitTriggered,
      jitCompleted,
    },
    legitimateReports,
    noCampaignReceived: noCampaign,
  };
}

// ─── Cas de référence (Golden tests) ─────────────────────────────────────────

/** GOLD-001 : User expert — quiz 90, pas de clic, 3 signalements */
export const GOLD_001 = withFixtures({
  daysSinceEnrollment: 60,
  quizScore: 90,
  quizDifficulty: "hard",
  quizCount: 5,
  phishingClicked: false,
  phishingReported: true,
  phishingReportedBefore: true,
  legitimateReports: 3,
  modulesAssigned: 8,
  modulesCompleted: 8,
  streakWeeks: 12,
});

/** GOLD-002 : User risqué — quiz faible, a cliqué + soumis credentials */
export const GOLD_002 = withFixtures({
  daysSinceEnrollment: 45,
  quizScore: 30,
  quizDifficulty: "easy",
  quizCount: 2,
  phishingClicked: true,
  phishingSubmitted: true,
  phishingDifficulty: "medium",
  legitimateReports: 0,
  modulesAssigned: 5,
  modulesCompleted: 1,
  streakWeeks: 1,
});

/** GOLD-003 : Nouveau user (enrôlé < 7j) */
export const GOLD_003 = withFixtures({ daysSinceEnrollment: 3 });

/** GOLD-004 : User sans aucune campagne phishing reçue */
export const GOLD_004 = withFixtures({ noCampaign: true, quizScore: 75 });
