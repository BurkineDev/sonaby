/**
 * Schémas Zod des blocs de contenu — CyberGuard SONABHY
 *
 * Source de vérité : docs/06-learning-engine.md §4.1
 *
 * Le contenu d'un module est stocké dans `modules.body jsonb` sous forme
 * de blocs composables (inspiré Notion). Ce schéma est partagé entre :
 *   - apps/web  : rendu côté client (ModuleRenderer)
 *   - apps/web  : validation dans les Server Actions (createModule, updateModule)
 *   - supabase/functions : validation avant écriture en DB
 */

import { z } from "zod";

// ─── Blocs de contenu ─────────────────────────────────────────────────────────

export const HeadingBlockSchema = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string().min(1).max(300),
});

export const ParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  text: z.string().min(1).max(2000),
});

export const ListBlockSchema = z.object({
  type: z.literal("list"),
  ordered: z.boolean(),
  items: z.array(z.string().min(1).max(500)).min(1).max(20),
});

export const ImageBlockSchema = z.object({
  type: z.literal("image"),
  /** URL Supabase Storage ou asset public */
  src: z.string().url(),
  alt: z.string().min(1).max(200),
  caption: z.string().max(300).optional(),
});

export const VideoBlockSchema = z.object({
  type: z.literal("video"),
  /** URL Supabase Storage ou CDN externe (YouTube embed interdit — RGPD) */
  src: z.string().url(),
  poster: z.string().url().optional(),
  /** Piste VTT pour les sous-titres (accessibilité WCAG AA) */
  captionsTrack: z.string().url().optional(),
});

export const CalloutBlockSchema = z.object({
  type: z.literal("callout"),
  variant: z.enum(["info", "warning", "success", "danger"]),
  text: z.string().min(1).max(500),
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export const QuizChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(300),
  isCorrect: z.boolean(),
  /** Explication affichée après la sélection de cette option */
  explanation: z.string().max(500).optional(),
});

export const QuizQuestionBlockSchema = z.object({
  type: z.literal("quiz_question"),
  id: z.string().min(1),
  question: z.string().min(1).max(500),
  /** single = QCM 1 bonne réponse | multi = QCM plusieurs | truefalse = Vrai/Faux */
  kind: z.enum(["single", "multi", "truefalse"]),
  choices: z.array(QuizChoiceSchema).min(2).max(6).refine(
    (choices) => choices.some((c) => c.isCorrect),
    { message: "Au moins une réponse doit être correcte" }
  ),
  feedback: z.object({
    correct: z.string().min(1).max(300),
    incorrect: z.string().min(1).max(300),
  }),
});

// ─── Scénario interactif ──────────────────────────────────────────────────────

export const ScenarioChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(300),
  /** Conséquence affichée immédiatement après le choix */
  outcome: z.string().min(1).max(500),
  /** Impact sur un score de risque in-scenario : -10 (mauvais) à +10 (bon) */
  riskImpact: z.number().min(-10).max(10),
  /** ID de la prochaine étape (null = fin du scénario) */
  nextStepId: z.string().optional(),
});

export const ScenarioStepBlockSchema = z.object({
  type: z.literal("scenario_step"),
  id: z.string().min(1),
  situation: z.string().min(1).max(1000),
  choices: z.array(ScenarioChoiceSchema).min(2).max(5),
});

// ─── Union discriminée ────────────────────────────────────────────────────────

export const BlockSchema = z.discriminatedUnion("type", [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  ImageBlockSchema,
  VideoBlockSchema,
  CalloutBlockSchema,
  QuizQuestionBlockSchema,
  ScenarioStepBlockSchema,
]);

export type Block = z.infer<typeof BlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type VideoBlock = z.infer<typeof VideoBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
export type QuizChoice = z.infer<typeof QuizChoiceSchema>;
export type QuizQuestionBlock = z.infer<typeof QuizQuestionBlockSchema>;
export type ScenarioChoice = z.infer<typeof ScenarioChoiceSchema>;
export type ScenarioStepBlock = z.infer<typeof ScenarioStepBlockSchema>;

// ─── Corps du module ──────────────────────────────────────────────────────────

export const ModuleBodySchema = z.object({
  blocks: z.array(BlockSchema).min(1),
  estimatedMinutes: z.number().int().min(1).max(60),
  learningObjectives: z.array(z.string().min(1).max(200)).min(1).max(5),
});

export type ModuleBody = z.infer<typeof ModuleBodySchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse et valide un body jsonb depuis la DB. Retourne null si invalide. */
export function parseModuleBody(raw: unknown): ModuleBody | null {
  const result = ModuleBodySchema.safeParse(raw);
  return result.success ? result.data : null;
}

/** Compte le nombre de questions quiz dans un body */
export function countQuizQuestions(body: ModuleBody): number {
  return body.blocks.filter((b) => b.type === "quiz_question").length;
}

/** Extrait les IDs de toutes les étapes scenario_step */
export function getScenarioStepIds(body: ModuleBody): string[] {
  return body.blocks
    .filter((b): b is ScenarioStepBlock => b.type === "scenario_step")
    .map((b) => b.id);
}

/** Vérifie qu'un module scénario a une arborescence cohérente (tous les nextStepId pointent vers un step existant) */
export function validateScenarioLinks(body: ModuleBody): { valid: boolean; brokenLinks: string[] } {
  const stepIds = new Set(getScenarioStepIds(body));
  const brokenLinks: string[] = [];

  for (const block of body.blocks) {
    if (block.type !== "scenario_step") continue;
    for (const choice of block.choices) {
      if (choice.nextStepId && !stepIds.has(choice.nextStepId)) {
        brokenLinks.push(`step ${block.id} → choice ${choice.id} → nextStepId "${choice.nextStepId}" introuvable`);
      }
    }
  }

  return { valid: brokenLinks.length === 0, brokenLinks };
}
