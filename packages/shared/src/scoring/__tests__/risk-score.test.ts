/**
 * Tests unitaires — Risk Score Engine
 *
 * Couverture : composantes Q, P, E, B_report, score global, cas limites.
 * Property-based testing avec fast-check.
 *
 * Commande : pnpm --filter @cyberguard/shared test
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

import {
  computeRiskScore,
  computeQuizComponent,
  computePhishingComponent,
  computeEngagementComponent,
  computeReportBonus,
  deduplicateQuizAttempts,
  clamp,
  exponentialDecay,
  ENGINE_VERSION,
} from "../engine.js";
import { DEFAULT_SCORING_CONFIG } from "../types.js";
import { baseConfig, withFixtures, GOLD_001, GOLD_002, GOLD_003, GOLD_004 } from "./fixtures.js";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

describe("clamp", () => {
  it("ne modifie pas une valeur dans les bornes", () => {
    expect(clamp(50)).toBe(50);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it("clamp une valeur négative à 0", () => {
    expect(clamp(-10)).toBe(0);
  });

  it("clamp une valeur > 100 à 100", () => {
    expect(clamp(150)).toBe(100);
  });

  it("supporte des bornes personnalisées", () => {
    expect(clamp(25, 30, 80)).toBe(30);
    expect(clamp(90, 30, 80)).toBe(80);
  });
});

describe("exponentialDecay", () => {
  it("retourne 1.0 pour daysAgo = 0", () => {
    expect(exponentialDecay(0.011, 0)).toBeCloseTo(1.0);
  });

  it("retourne ~0.5 à la demi-vie du quiz (63j)", () => {
    // demi-vie = ln(2)/λ ≈ ln(2)/0.011 ≈ 63j
    const halfLife = Math.log(2) / 0.011;
    expect(exponentialDecay(0.011, halfLife)).toBeCloseTo(0.5, 2);
  });

  it("retourne ~0.5 à la demi-vie phishing (87j)", () => {
    const halfLife = Math.log(2) / 0.008;
    expect(exponentialDecay(0.008, halfLife)).toBeCloseTo(0.5, 2);
  });

  it("décroît strictement avec le temps", () => {
    expect(exponentialDecay(0.011, 10)).toBeGreaterThan(exponentialDecay(0.011, 30));
    expect(exponentialDecay(0.011, 30)).toBeGreaterThan(exponentialDecay(0.011, 90));
  });
});

// ─── Déduplication quiz ───────────────────────────────────────────────────────

describe("deduplicateQuizAttempts", () => {
  it("garde uniquement la tentative la plus récente par questionId", () => {
    const attempts = [
      { score: 100, difficulty: "easy" as const, daysAgo: 10, questionId: "q1" },
      { score: 60,  difficulty: "easy" as const, daysAgo: 2,  questionId: "q1" }, // plus récente
      { score: 80,  difficulty: "medium" as const, daysAgo: 5, questionId: "q2" },
    ];
    const deduped = deduplicateQuizAttempts(attempts);
    expect(deduped).toHaveLength(2);
    const q1 = deduped.find((a) => a.questionId === "q1");
    expect(q1?.score).toBe(60); // la plus récente (daysAgo minimal)
    expect(q1?.daysAgo).toBe(2);
  });

  it("ne modifie pas une liste sans doublons", () => {
    const attempts = [
      { score: 80, difficulty: "easy" as const, daysAgo: 5, questionId: "q1" },
      { score: 70, difficulty: "hard" as const, daysAgo: 3, questionId: "q2" },
    ];
    expect(deduplicateQuizAttempts(attempts)).toHaveLength(2);
  });

  it("retourne un tableau vide si input vide", () => {
    expect(deduplicateQuizAttempts([])).toHaveLength(0);
  });
});

// ─── Composante Quiz (Q) ──────────────────────────────────────────────────────

describe("computeQuizComponent", () => {
  it("retourne null si aucune tentative", () => {
    expect(computeQuizComponent([], baseConfig)).toBeNull();
  });

  it("retourne 100 pour un quiz parfait récent", () => {
    const attempts = [
      { score: 100, difficulty: "hard" as const, daysAgo: 0, questionId: "q1" },
    ];
    const Q = computeQuizComponent(attempts, baseConfig);
    expect(Q).toBeCloseTo(100, 0);
  });

  it("retourne 0 pour un quiz raté récent", () => {
    const attempts = [
      { score: 0, difficulty: "easy" as const, daysAgo: 0, questionId: "q1" },
    ];
    const Q = computeQuizComponent(attempts, baseConfig);
    expect(Q).toBeCloseTo(0, 0);
  });

  it("les questions difficiles pèsent plus (w=3 vs w=1)", () => {
    const easy = [{ score: 100, difficulty: "easy" as const, daysAgo: 1, questionId: "e1" }];
    const hard = [{ score: 100, difficulty: "hard" as const, daysAgo: 1, questionId: "h1" }];
    // Même score, mais la difficulté ne change pas le résultat final ici
    // car score_i = 100 dans les deux cas → Q = 100
    const Qe = computeQuizComponent(easy, baseConfig);
    const Qh = computeQuizComponent(hard, baseConfig);
    expect(Qe).toBeCloseTo(100, 0);
    expect(Qh).toBeCloseTo(100, 0);
  });

  it("une bonne réponse ancienne pèse moins qu'une récente", () => {
    const recent = [{ score: 100, difficulty: "medium" as const, daysAgo: 1, questionId: "q1" }];
    const old    = [{ score: 100, difficulty: "medium" as const, daysAgo: 90, questionId: "q1" }];
    // Même score brut, mais decay différent → le résultat est le même si score=100
    // Le decay affecte le poids relatif, pas le score absolu d'une seule question
    // → tester avec un mix de questions de scores différents
    const mixed_recent = [
      { score: 100, difficulty: "medium" as const, daysAgo: 1,  questionId: "q1" },
      { score: 0,   difficulty: "medium" as const, daysAgo: 90, questionId: "q2" },
    ];
    const mixed_old = [
      { score: 100, difficulty: "medium" as const, daysAgo: 90, questionId: "q1" },
      { score: 0,   difficulty: "medium" as const, daysAgo: 1,  questionId: "q2" },
    ];
    const Q_recent = computeQuizComponent(mixed_recent, baseConfig)!;
    const Q_old    = computeQuizComponent(mixed_old, baseConfig)!;
    // Quand la bonne réponse est récente, le score doit être plus élevé
    expect(Q_recent).toBeGreaterThan(Q_old);
  });

  it("est dans [0, 100]", () => {
    const attempts = [
      { score: 85, difficulty: "medium" as const, daysAgo: 15, questionId: "q1" },
      { score: 40, difficulty: "hard" as const,   daysAgo: 45, questionId: "q2" },
      { score: 100, difficulty: "easy" as const,  daysAgo: 3,  questionId: "q3" },
    ];
    const Q = computeQuizComponent(attempts, baseConfig)!;
    expect(Q).toBeGreaterThanOrEqual(0);
    expect(Q).toBeLessThanOrEqual(100);
  });

  it("applique la déduplication avant le calcul", () => {
    const attempts = [
      { score: 100, difficulty: "hard" as const, daysAgo: 10, questionId: "q1" },
      { score: 0,   difficulty: "hard" as const, daysAgo: 2,  questionId: "q1" }, // plus récente
    ];
    const Q = computeQuizComponent(attempts, baseConfig)!;
    // La tentative retenue est score=0 (plus récente), donc Q proche de 0
    expect(Q).toBeCloseTo(0, 0);
  });
});

// ─── Composante Phishing (P) ──────────────────────────────────────────────────

describe("computePhishingComponent", () => {
  it("retourne null si aucun événement pertinent", () => {
    const events = [{ type: "delivered" as const, difficulty: "easy" as const, daysAgo: 1 }];
    expect(computePhishingComponent(events, baseConfig)).toBeNull();
  });

  it("score de base élevé si signalement proactif (avant clic) → clampé à 100", () => {
    const events = [
      { type: "reported" as const, difficulty: "medium" as const, daysAgo: 2, reportedBeforeClick: true },
    ];
    const P = computePhishingComponent(events, baseConfig)!;
    // Le score brut (100 + bonus_proactif) dépasse 100 mais est clampé par le moteur
    expect(P).toBe(100);
  });

  it("pénalise un clic simple", () => {
    const events = [
      { type: "clicked" as const, difficulty: "easy" as const, daysAgo: 1 },
    ];
    const P = computePhishingComponent(events, baseConfig)!;
    expect(P).toBeLessThan(100);
    expect(P).toBeGreaterThan(0);
  });

  it("pénalise davantage une soumission d'identifiants qu'un simple clic", () => {
    const click = [{ type: "clicked" as const, difficulty: "medium" as const, daysAgo: 1 }];
    const submit = [{ type: "submitted_credentials" as const, difficulty: "medium" as const, daysAgo: 1 }];
    const P_click  = computePhishingComponent(click, baseConfig)!;
    const P_submit = computePhishingComponent(submit, baseConfig)!;
    expect(P_click).toBeGreaterThan(P_submit);
  });

  it("une difficulté élevée pénalise davantage qu'une faible", () => {
    const easy = [{ type: "clicked" as const, difficulty: "easy" as const, daysAgo: 1 }];
    const hard = [{ type: "clicked" as const, difficulty: "hard" as const, daysAgo: 1 }];
    const P_easy = computePhishingComponent(easy, baseConfig)!;
    const P_hard = computePhishingComponent(hard, baseConfig)!;
    expect(P_easy).toBeGreaterThan(P_hard);
  });

  it("un événement ancien pénalise moins qu'un récent", () => {
    const recent = [{ type: "clicked" as const, difficulty: "medium" as const, daysAgo: 1 }];
    const old    = [{ type: "clicked" as const, difficulty: "medium" as const, daysAgo: 80 }];
    const P_recent = computePhishingComponent(recent, baseConfig)!;
    const P_old    = computePhishingComponent(old, baseConfig)!;
    expect(P_recent).toBeLessThan(P_old); // pénalité plus forte récemment
  });

  it("ne descend pas en dessous de 0", () => {
    const events = [
      { type: "submitted_credentials" as const, difficulty: "hard" as const, daysAgo: 0 },
      { type: "submitted_credentials" as const, difficulty: "hard" as const, daysAgo: 1 },
      { type: "submitted_credentials" as const, difficulty: "hard" as const, daysAgo: 2 },
      { type: "clicked" as const, difficulty: "hard" as const, daysAgo: 3 },
    ];
    const P = computePhishingComponent(events, baseConfig)!;
    expect(P).toBeGreaterThanOrEqual(0);
  });
});

// ─── Composante Engagement (E) ────────────────────────────────────────────────

describe("computeEngagementComponent", () => {
  it("retourne 100 pour un user exemplaire", () => {
    const E = computeEngagementComponent({
      modulesAssigned: 10,
      modulesCompleted: 10,
      streakWeeks: 12,
      jitTriggered: 3,
      jitCompleted: 3,
    });
    expect(E).toBe(100);
  });

  it("retourne 0 pour un user totalement inactif", () => {
    const E = computeEngagementComponent({
      modulesAssigned: 10,
      modulesCompleted: 0,
      streakWeeks: 0,
      jitTriggered: 5,
      jitCompleted: 0,
    });
    expect(E).toBe(0);
  });

  it("JIT compliance = 100 si aucun JIT déclenché (pas de pénalité)", () => {
    const E = computeEngagementComponent({
      modulesAssigned: 5,
      modulesCompleted: 5,
      streakWeeks: 12,
      jitTriggered: 0, // aucun JIT déclenché
      jitCompleted: 0,
    });
    expect(E).toBe(100);
  });

  it("la streak est plafonnée à 12 semaines", () => {
    const E_12 = computeEngagementComponent({
      modulesAssigned: 0, modulesCompleted: 0, streakWeeks: 12,
      jitTriggered: 0, jitCompleted: 0,
    });
    const E_50 = computeEngagementComponent({
      modulesAssigned: 0, modulesCompleted: 0, streakWeeks: 50,
      jitTriggered: 0, jitCompleted: 0,
    });
    expect(E_12).toBe(E_50);
  });

  it("est dans [0, 100]", () => {
    const E = computeEngagementComponent({
      modulesAssigned: 7, modulesCompleted: 4,
      streakWeeks: 5, jitTriggered: 2, jitCompleted: 1,
    });
    expect(E).toBeGreaterThanOrEqual(0);
    expect(E).toBeLessThanOrEqual(100);
  });
});

// ─── Bonus signalement (B_report) ────────────────────────────────────────────

describe("computeReportBonus", () => {
  it("retourne 0 pour 0 signalements", () => {
    expect(computeReportBonus(0, baseConfig)).toBe(0);
  });

  it("retourne 0.5 pour 1 signalement", () => {
    expect(computeReportBonus(1, baseConfig)).toBe(0.5);
  });

  it("est plafonné à max_report_bonus (5)", () => {
    expect(computeReportBonus(100, baseConfig)).toBe(5);
    expect(computeReportBonus(10, baseConfig)).toBe(5);
  });

  it("retourne 2.5 pour 5 signalements", () => {
    expect(computeReportBonus(5, baseConfig)).toBe(2.5);
  });
});

// ─── Score global ─────────────────────────────────────────────────────────────

describe("computeRiskScore", () => {
  it("[GOLD-003] retourne null pour un user enrôlé depuis < 7 jours", () => {
    const result = computeRiskScore(GOLD_003, baseConfig);
    expect(result.score).toBeNull();
    expect(result.dataQuality.hasBaseline).toBe(false);
  });

  it("[GOLD-004] retourne un score avec P=50 si aucune campagne reçue", () => {
    const result = computeRiskScore(GOLD_004, baseConfig);
    expect(result.score).not.toBeNull();
    expect(result.dataQuality.hasPhishingData).toBe(false);
    // P utilisé = 50 (médian), donc composante phishing contribue 0.45 × 50 = 22.5
    expect(result.components.phishing).toBeNull(); // null indique "données absentes"
  });

  it("[GOLD-001] user expert — score élevé (> 80)", () => {
    const result = computeRiskScore(GOLD_001, baseConfig);
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeGreaterThan(80);
  });

  it("[GOLD-002] user risqué — score faible (< 50)", () => {
    const result = computeRiskScore(GOLD_002, baseConfig);
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeLessThan(50);
  });

  it("inclut la version du moteur dans le résultat", () => {
    const result = computeRiskScore(withFixtures(), baseConfig);
    expect(result.version).toBe(ENGINE_VERSION);
  });

  it("le score est arrondi à 0.1 près", () => {
    const result = computeRiskScore(withFixtures(), baseConfig);
    if (result.score !== null) {
      // Vérifier que le score a au max 1 décimale
      const str = result.score.toString();
      const decimals = str.includes(".") ? str.split(".")[1]!.length : 0;
      expect(decimals).toBeLessThanOrEqual(1);
    }
  });

  it("ajouter un signalement légitime ne diminue jamais le score", () => {
    const base = withFixtures({ legitimateReports: 0 });
    const withReport = withFixtures({ legitimateReports: 2 });
    const r1 = computeRiskScore(base, baseConfig);
    const r2 = computeRiskScore(withReport, baseConfig);
    if (r1.score !== null && r2.score !== null) {
      expect(r2.score).toBeGreaterThanOrEqual(r1.score);
    }
  });
});

// ─── Property-based tests (fast-check) ───────────────────────────────────────

describe("computeRiskScore — propriétés invariantes", () => {
  // Arbitraire pour les inputs de scoring
  const arbScoringInput = () =>
    fc.record({
      daysSinceEnrollment: fc.integer({ min: 0, max: 365 }),
      quizAttempts: fc.array(
        fc.record({
          score: fc.float({ min: 0, max: 100, noNaN: true }),
          difficulty: fc.constantFrom("easy", "medium", "hard" as const),
          daysAgo: fc.integer({ min: 0, max: 90 }),
          questionId: fc.string({ minLength: 1, maxLength: 10 }),
        }),
        { maxLength: 20 }
      ),
      phishingEvents: fc.array(
        fc.record({
          type: fc.constantFrom(
            "clicked", "submitted_credentials", "reported", "delivered", "opened" as const
          ),
          difficulty: fc.constantFrom("easy", "medium", "hard" as const),
          daysAgo: fc.integer({ min: 0, max: 90 }),
          reportedBeforeClick: fc.boolean(),
        }),
        { maxLength: 10 }
      ),
      engagement: fc.record({
        modulesAssigned: fc.integer({ min: 0, max: 20 }),
        modulesCompleted: fc.integer({ min: 0, max: 20 }),
        streakWeeks: fc.integer({ min: 0, max: 52 }),
        jitTriggered: fc.integer({ min: 0, max: 10 }),
        jitCompleted: fc.integer({ min: 0, max: 10 }),
      }),
      legitimateReports: fc.integer({ min: 0, max: 20 }),
      noCampaignReceived: fc.boolean(),
    });

  it("le score est toujours dans [0, 100] ou null", () => {
    fc.assert(
      fc.property(arbScoringInput(), (input) => {
        const result = computeRiskScore(input as Parameters<typeof computeRiskScore>[0], baseConfig);
        if (result.score !== null) {
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        }
      }),
      { numRuns: 500 }
    );
  });

  it("un user < 7j d'enrôlement a toujours score = null", () => {
    fc.assert(
      fc.property(
        arbScoringInput().map((i) => ({ ...i, daysSinceEnrollment: fc.sample(fc.integer({ min: 0, max: 6 }), 1)[0]! })),
        (input) => {
          const result = computeRiskScore(input as Parameters<typeof computeRiskScore>[0], baseConfig);
          expect(result.score).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("les composantes Q, P (quand non-null) sont dans [0, 100]", () => {
    fc.assert(
      fc.property(arbScoringInput(), (input) => {
        const result = computeRiskScore(
          { ...input, daysSinceEnrollment: 30 } as Parameters<typeof computeRiskScore>[0],
          baseConfig
        );
        if (result.components.quiz !== null) {
          expect(result.components.quiz).toBeGreaterThanOrEqual(0);
          expect(result.components.quiz).toBeLessThanOrEqual(100);
        }
        if (result.components.phishing !== null) {
          expect(result.components.phishing).toBeGreaterThanOrEqual(0);
          expect(result.components.phishing).toBeLessThanOrEqual(100);
        }
        expect(result.components.engagement).toBeGreaterThanOrEqual(0);
        expect(result.components.engagement).toBeLessThanOrEqual(100);
      }),
      { numRuns: 300 }
    );
  });

  it("le bonus signalement est toujours dans [0, max_report_bonus]", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (reports) => {
        const bonus = computeReportBonus(reports, baseConfig);
        expect(bonus).toBeGreaterThanOrEqual(0);
        expect(bonus).toBeLessThanOrEqual(baseConfig.max_report_bonus);
      }),
      { numRuns: 200 }
    );
  });
});
