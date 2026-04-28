"use client";

/**
 * ModuleRenderer — CyberGuard SONABHY
 * Design premium navy/or — interface de cours élégante.
 */

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Play,
  Volume2,
  List,
  ListOrdered,
  Shield,
  ShieldAlert,
  BookOpen,
  Zap,
} from "lucide-react";
import type {
  Block,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ImageBlock,
  VideoBlock,
  CalloutBlock,
  QuizChoice,
  QuizQuestionBlock,
  ScenarioStepBlock,
  ModuleBody,
} from "@/lib/shared";

// ─── Types internes ───────────────────────────────────────────────────────────

interface QuizState {
  selectedIds: string[];
  submitted: boolean;
  isCorrect: boolean;
}

interface ScenarioAnswer {
  stepId: string;
  choiceId: string;
  riskImpact: number;
}

interface Props {
  moduleId: string;
  title: string;
  kind: string;
  estimatedMinutes: number;
  difficulty: string;
  body: Record<string, unknown>;
  completionId: string | null;
  isCompleted: boolean;
}

// ─── Helpers compatibilité DB ────────────────────────────────────────────────
// Les données en base peuvent utiliser "text" au lieu de "label" (legacy schema)
// et "style":"ordered"/"unordered" au lieu de "ordered": boolean pour les listes.

function getChoiceLabel(choice: QuizChoice): string {
  return choice.label || (choice as unknown as { text?: string }).text || "";
}

function isListOrdered(block: ListBlock): boolean {
  return (
    block.ordered ||
    (block as unknown as { style?: string }).style === "ordered"
  );
}

// ─── Blocs de contenu ─────────────────────────────────────────────────────────

function HeadingBlockView({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.level}` as "h1" | "h2" | "h3";
  const cls =
    block.level === 1
      ? "text-2xl font-bold mt-2 mb-4 leading-snug"
      : block.level === 2
      ? "text-xl font-semibold mt-6 mb-3"
      : "text-lg font-medium mt-4 mb-2";
  return (
    <Tag className={cls} style={{ color: "#0F1B36" }}>
      {block.text}
    </Tag>
  );
}

function ParagraphBlockView({ block }: { block: ParagraphBlock }) {
  return (
    <p className="text-base leading-relaxed mb-5" style={{ color: "#4A5568" }}>
      {block.text}
    </p>
  );
}

function ListBlockView({ block }: { block: ListBlock }) {
  const ordered = isListOrdered(block);
  const Icon = ordered ? ListOrdered : List;
  const Tag = ordered ? "ol" : "ul";
  return (
    <div className="mb-5 rounded-xl overflow-hidden border" style={{ borderColor: "#DDE2EE" }}>
      {/* Label */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
        style={{ backgroundColor: "#F8F9FC", color: "#163061", borderBottom: "1px solid #DDE2EE" }}
      >
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{block.ordered ? "Points clés" : "À retenir"}</span>
      </div>
      <div className="bg-white px-4 py-3">
        <Tag className="space-y-2.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm leading-relaxed"
              style={{ color: "#0F1B36" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: "#163061", minWidth: "1.25rem" }}
                aria-hidden="true"
              >
                {ordered ? i + 1 : "✓"}
              </span>
              {item}
            </li>
          ))}
        </Tag>
      </div>
    </div>
  );
}

function ImageBlockView({ block }: { block: ImageBlock }) {
  return (
    <figure className="mb-5 rounded-xl overflow-hidden border" style={{ borderColor: "#DDE2EE" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.src}
        alt={block.alt}
        className="w-full object-cover"
        loading="lazy"
      />
      {block.caption && (
        <figcaption
          className="text-xs text-center italic py-2 px-4"
          style={{ color: "#718096", backgroundColor: "#F8F9FC" }}
        >
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function VideoBlockView({ block }: { block: VideoBlock }) {
  return (
    <figure className="mb-5 rounded-xl overflow-hidden border" style={{ borderColor: "#DDE2EE" }}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={block.src}
        poster={block.poster}
        controls
        className="w-full bg-black"
        preload="metadata"
        aria-label="Vidéo de formation"
      >
        {block.captionsTrack && (
          <track kind="captions" src={block.captionsTrack} srcLang="fr" label="Français" default />
        )}
        <p className="text-sm p-4" style={{ color: "#4A5568" }}>
          Votre navigateur ne supporte pas la lecture vidéo.
        </p>
      </video>
      <div
        className="flex items-center gap-2 px-4 py-2 text-xs"
        style={{ backgroundColor: "#F8F9FC", color: "#718096" }}
      >
        <Play className="w-3 h-3" aria-hidden="true" />
        <span>Vidéo de formation</span>
        {block.captionsTrack && (
          <>
            <Volume2 className="w-3 h-3 ml-2" aria-hidden="true" />
            <span>Sous-titres disponibles</span>
          </>
        )}
      </div>
    </figure>
  );
}

function CalloutBlockView({ block }: { block: CalloutBlock }) {
  const styles = {
    info: {
      bg: "#EFF6FF", border: "#93C5FD", text: "#1E40AF",
      icon: <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#3B82F6" }} aria-hidden="true" />,
    },
    warning: {
      bg: "#FFFBEB", border: "#FCD34D", text: "#92400E",
      icon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} aria-hidden="true" />,
    },
    success: {
      bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46",
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} aria-hidden="true" />,
    },
    danger: {
      bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B",
      icon: <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#EF4444" }} aria-hidden="true" />,
    },
  };
  const s = styles[block.variant];
  return (
    <div
      className="rounded-xl border-l-4 px-4 py-3.5 mb-5 flex gap-3"
      style={{ backgroundColor: s.bg, borderLeftColor: s.border }}
      role="note"
      aria-label={`Note ${block.variant}`}
    >
      {s.icon}
      <p className="text-sm leading-relaxed" style={{ color: s.text }}>
        {block.text}
      </p>
    </div>
  );
}

// ─── Quiz question ─────────────────────────────────────────────────────────────

const CHOICE_LETTERS = ["A", "B", "C", "D", "E", "F"];

function QuizQuestionBlockView({
  block,
  onSubmit,
}: {
  block: QuizQuestionBlock;
  onSubmit: (questionId: string, selectedIds: string[], isCorrect: boolean) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, setState] = useState<QuizState | null>(null);

  const isSingle = block.kind === "single" || block.kind === "truefalse";

  function handleSelect(choiceId: string) {
    if (state?.submitted) return;
    if (isSingle) {
      setSelectedIds([choiceId]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]
      );
    }
  }

  function handleSubmit() {
    if (selectedIds.length === 0 || state?.submitted) return;
    const correctIds = block.choices.filter((c) => c.isCorrect).map((c) => c.id);
    const isCorrect =
      correctIds.length === selectedIds.length &&
      correctIds.every((id) => selectedIds.includes(id));
    const newState: QuizState = { selectedIds, submitted: true, isCorrect };
    setState(newState);
    onSubmit(block.id, selectedIds, isCorrect);
  }

  const kindLabel =
    block.kind === "truefalse"
      ? "Vrai ou Faux ?"
      : block.kind === "multi"
      ? "Plusieurs réponses possibles"
      : "Une seule réponse correcte";

  const kindIcon = block.kind === "multi" ? "☑" : "○";

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 shadow-md"
      role="group"
      aria-labelledby={`q-label-${block.id}`}
    >
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-2"
        style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(232,162,40,0.25)" }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: "#E8A228" }} aria-hidden="true" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.85)" }}>
            Question
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(232,162,40,0.20)", color: "#E8A228" }}
        >
          {kindIcon} {kindLabel}
        </span>
      </div>

      {/* ── Question ─────────────────────────────────────────────────────── */}
      <div className="bg-white px-5 pt-5 pb-4">
        <p
          id={`q-label-${block.id}`}
          className="text-base font-semibold leading-snug mb-5"
          style={{ color: "#0F1B36" }}
        >
          {block.question}
        </p>

        {/* ── Choix avec badge lettre ───────────────────────────────────── */}
        <div className="space-y-3" role={isSingle ? "radiogroup" : "group"}>
          {block.choices.map((choice, idx) => {
            const choiceLabel = getChoiceLabel(choice);
            const letter = CHOICE_LETTERS[idx] ?? String(idx + 1);
            const isSelected = selectedIds.includes(choice.id);
            const isSubmitted = state?.submitted ?? false;

            // ── États visuels ──────────────────────────────────────────
            let cardBg        = "#F8F9FC";
            let cardBorder    = "#E2E8F0";
            let letterBg      = "#EEF1F8";
            let letterColor   = "#4B5E8A";
            let cardTextColor = "#1A2A50";
            let resultIcon: React.ReactNode = null;

            if (!isSubmitted && isSelected) {
              cardBg      = "#EFF3FB";
              cardBorder  = "#163061";
              letterBg    = "#163061";
              letterColor = "#FFFFFF";
            } else if (isSubmitted) {
              if (choice.isCorrect) {
                cardBg        = "#F0FDF4";
                cardBorder    = "#22C55E";
                letterBg      = "#22C55E";
                letterColor   = "#FFFFFF";
                cardTextColor = "#14532D";
                resultIcon    = (
                  <CheckCircle2
                    className="w-4 h-4 shrink-0"
                    style={{ color: "#16A34A" }}
                    aria-label="Bonne réponse"
                  />
                );
              } else if (isSelected && !choice.isCorrect) {
                cardBg        = "#FEF2F2";
                cardBorder    = "#F87171";
                letterBg      = "#EF4444";
                letterColor   = "#FFFFFF";
                cardTextColor = "#7F1D1D";
                resultIcon    = (
                  <XCircle
                    className="w-4 h-4 shrink-0"
                    style={{ color: "#DC2626" }}
                    aria-label="Mauvaise réponse"
                  />
                );
              } else {
                cardBg        = "#F4F6FA";
                cardBorder    = "#DDE2EE";
                letterBg      = "#D1D9EC";
                letterColor   = "#7A8BAF";
                cardTextColor = "#6B7280";
              }
            }

            return (
              <div key={choice.id}>
                <button
                  onClick={() => handleSelect(choice.id)}
                  /* On évite l'attribut `disabled` : certains navigateurs
                     appliquent `color: GrayText !important` qui écrase les
                     inline styles. On bloque via le handler JS. */
                  className="w-full text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: cardTextColor,
                    WebkitTextFillColor: cardTextColor,
                    cursor: isSubmitted ? "default" : "pointer",
                  }}
                  role={isSingle ? "radio" : "checkbox"}
                  aria-checked={isSelected}
                  aria-disabled={isSubmitted}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Badge lettre */}
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-extrabold transition-all duration-150"
                      style={{
                        backgroundColor: letterBg,
                        color: letterColor,
                        minWidth: "1.75rem",
                      }}
                      aria-hidden="true"
                    >
                      {letter}
                    </span>

                    {/* Texte du choix */}
                    <span
                      className="flex-1 text-sm font-medium leading-snug"
                      style={{ color: "inherit", WebkitTextFillColor: "inherit" }}
                    >
                      {choiceLabel}
                    </span>

                    {/* Icône résultat */}
                    {resultIcon}
                  </div>
                </button>

                {/* Explication contextuelle */}
                {isSubmitted && isSelected && choice.explanation && (
                  <div
                    className="mt-1.5 ml-11 mr-1 px-3 py-2 rounded-lg text-xs leading-relaxed"
                    style={{
                      backgroundColor: choice.isCorrect ? "#DCFCE7" : "#FEE2E2",
                      color: choice.isCorrect ? "#15803D" : "#B91C1C",
                    }}
                  >
                    {choice.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Feedback global après soumission ─────────────────────────── */}
        {state?.submitted && (
          <div
            className="mt-5 mb-1 px-4 py-4 rounded-xl border-l-4 flex items-start gap-3"
            style={{
              backgroundColor: state.isCorrect ? "#F0FDF4" : "#FFFBEB",
              borderLeftColor: state.isCorrect ? "#22C55E" : "#F59E0B",
            }}
            role="status"
            aria-live="polite"
          >
            {state.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#16A34A" }} />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#D97706" }} />
            )}
            <div>
              <p
                className="text-sm font-bold mb-1"
                style={{ color: state.isCorrect ? "#14532D" : "#78350F" }}
              >
                {state.isCorrect ? "✓ Excellent !" : "À retenir"}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: state.isCorrect ? "#166534" : "#92400E" }}
              >
                {state.isCorrect ? block.feedback.correct : block.feedback.incorrect}
              </p>
            </div>
          </div>
        )}

        {/* ── Bouton valider (multi-choix) ──────────────────────────────── */}
        {!state?.submitted && block.kind === "multi" && (
          <button
            onClick={selectedIds.length > 0 ? handleSubmit : undefined}
            aria-disabled={selectedIds.length === 0}
            className="mt-5 mb-2 w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
            style={{
              background:
                selectedIds.length === 0
                  ? "linear-gradient(135deg, #94A3B8, #6B7280)"
                  : "linear-gradient(135deg, #163061, #1F3F7A)",
              opacity: selectedIds.length === 0 ? 0.6 : 1,
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
              boxShadow:
                selectedIds.length > 0
                  ? "0 4px 12px rgba(22,48,97,0.30)"
                  : "none",
            }}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Valider mes réponses
            {selectedIds.length > 0 && (
              <span
                className="ml-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: "rgba(232,162,40,0.30)", color: "#E8A228" }}
              >
                {selectedIds.length}
              </span>
            )}
          </button>
        )}

        {/* Auto-submit pour single/truefalse après sélection */}
        {!state?.submitted && isSingle && selectedIds.length > 0 && (
          <AutoSubmit onSubmit={handleSubmit} />
        )}

        <div className="pb-2" />
      </div>
    </div>
  );
}

function AutoSubmit({ onSubmit }: { onSubmit: () => void }) {
  const calledRef = useRef(false);
  React.useEffect(() => {
    // Early return garantit que toutes les branches retournent un Destructor ou rien
    if (calledRef.current) return;
    calledRef.current = true;
    const t = setTimeout(onSubmit, 400);
    return () => clearTimeout(t);
  });
  return null;
}

// ─── Scénario interactif ──────────────────────────────────────────────────────

function ScenarioRenderer({
  steps,
  onComplete,
}: {
  steps: ScenarioStepBlock[];
  onComplete: (answers: ScenarioAnswer[], totalRiskImpact: number) => void;
}) {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const firstStep = steps[0];

  const [currentStepId, setCurrentStepId] = useState<string | null>(firstStep?.id ?? null);
  const [answers, setAnswers] = useState<ScenarioAnswer[]>([]);
  const [lastOutcome, setLastOutcome] = useState<{
    text: string;
    riskImpact: number;
    isEnd: boolean;
  } | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [totalRisk, setTotalRisk] = useState(0);

  const currentStep = currentStepId ? stepMap.get(currentStepId) : null;

  function handleChoice(choiceId: string) {
    if (!currentStep) return;
    const choice = currentStep.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    const newAnswer: ScenarioAnswer = { stepId: currentStep.id, choiceId, riskImpact: choice.riskImpact };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    const newTotal = totalRisk + choice.riskImpact;
    setTotalRisk(newTotal);

    const isEnd = !choice.nextStepId || !stepMap.has(choice.nextStepId);
    setLastOutcome({ text: choice.outcome, riskImpact: choice.riskImpact, isEnd });
    setShowOutcome(true);

    if (!isEnd && choice.nextStepId) {
      setTimeout(() => {
        setCurrentStepId(choice.nextStepId ?? null);
        setShowOutcome(false);
      }, 2000);
    } else {
      setTimeout(() => { onComplete(newAnswers, newTotal); }, 1500);
    }
  }

  const completedCount = answers.length;
  const totalSteps = steps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);

  if (!currentStep && !showOutcome) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)" }}
        >
          <Shield className="w-8 h-8 text-white" />
        </div>
        <p className="text-lg font-semibold" style={{ color: "#0F1B36" }}>Scénario terminé</p>
        <p className="text-sm" style={{ color: "#718096" }}>Enregistrement en cours…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicateur risque in-scenario */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FC", border: "1px solid #DDE2EE" }}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ color: "#718096" }}>Progression du scénario</span>
          <span
            className="flex items-center gap-1.5 font-semibold"
            style={{ color: totalRisk >= 0 ? "#27AE60" : "#C0392B" }}
          >
            {totalRisk >= 0 ? (
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            Bilan : {totalRisk > 0 ? "+" : ""}{totalRisk}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#E4E8F0" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: "#163061" }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "#A0AEC0" }}>
          Étape {completedCount + 1} sur {totalSteps}
        </p>
      </div>

      {/* Feedback choix précédent */}
      {showOutcome && lastOutcome && (
        <div
          className="rounded-xl px-4 py-4 flex gap-3 border-l-4"
          style={{
            backgroundColor: lastOutcome.riskImpact >= 0 ? "#ECFDF5" : "#FEF2F2",
            borderLeftColor: lastOutcome.riskImpact >= 0 ? "#10B981" : "#EF4444",
          }}
          role="status"
          aria-live="polite"
        >
          {lastOutcome.riskImpact >= 0 ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#10B981" }} />
          ) : (
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
          )}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: lastOutcome.riskImpact >= 0 ? "#065F46" : "#991B1B" }}>
              {lastOutcome.riskImpact >= 0 ? "Bon réflexe" : "Attention"}
              {lastOutcome.riskImpact !== 0 && (
                <span className="ml-2 font-mono text-xs">
                  ({lastOutcome.riskImpact > 0 ? "+" : ""}{lastOutcome.riskImpact})
                </span>
              )}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: lastOutcome.riskImpact >= 0 ? "#047857" : "#922B21" }}>
              {lastOutcome.text}
            </p>
            {lastOutcome.isEnd && (
              <p className="mt-2 text-xs italic" style={{ color: "#A0AEC0" }}>
                Fin du scénario — enregistrement en cours…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Étape courante */}
      {currentStep && !showOutcome && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #DDE2EE" }}>
          <div
            className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)", color: "rgba(255,255,255,0.75)" }}
          >
            <Shield className="w-3.5 h-3.5" style={{ color: "#E8A228" }} aria-hidden="true" />
            Que faites-vous ?
          </div>
          <div className="bg-white p-5">
            <p className="text-base font-medium leading-relaxed mb-5" style={{ color: "#0F1B36" }}>
              {currentStep.situation}
            </p>
            <div className="space-y-3">
              {currentStep.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm transition-all duration-150 hover:shadow-sm group"
                  style={{ borderColor: "#DDE2EE", color: "#0F1B36", backgroundColor: "#F8F9FC" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#163061";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(22,48,97,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#DDE2EE";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8F9FC";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#C98B1A" }} aria-hidden="true" />
                    {choice.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module Renderer principal ────────────────────────────────────────────────

export function ModuleRenderer({
  moduleId,
  title,
  kind,
  estimatedMinutes,
  difficulty,
  body,
  completionId,
  isCompleted,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const startTime = useRef(Date.now());

  const moduleBody = body as unknown as ModuleBody;
  const blocks: Block[] = moduleBody?.blocks ?? [];
  const isScenario = kind === "scenario";

  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [quizStates, setQuizStates] = useState<
    Record<string, { selectedIds: string[]; isCorrect: boolean; answered: boolean }>
  >({});
  const [scenarioAnswers, setScenarioAnswers] = useState<ScenarioAnswer[]>([]);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const quizBlocks = blocks.filter((b) => b.type === "quiz_question") as QuizQuestionBlock[];
  const allQuizzesAnswered = quizBlocks.every((q) => quizStates[q.id]?.answered);
  const currentBlock = blocks[currentBlockIdx];
  const isLastBlock = currentBlockIdx === blocks.length - 1;

  const progress = isScenario
    ? scenarioDone
      ? 100
      : Math.round(
          (scenarioAnswers.length /
            Math.max(blocks.filter((b) => b.type === "scenario_step").length, 1)) *
            100
        )
    : blocks.length > 0
    ? Math.round(((currentBlockIdx + 1) / blocks.length) * 100)
    : 0;

  const handleQuizSubmit = useCallback(
    async (questionId: string, selectedIds: string[], isCorrect: boolean) => {
      setQuizStates((prev) => ({
        ...prev,
        [questionId]: { selectedIds, isCorrect, answered: true },
      }));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      for (const choiceId of selectedIds) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          module_id: moduleId,
          question_id: questionId,
          answer: { choiceId },
          is_correct: isCorrect,
          time_to_answer_ms: Date.now() - startTime.current,
        });
      }
    },
    [supabase, moduleId]
  );

  const handleScenarioComplete = useCallback(
    async (answers: ScenarioAnswer[], totalRiskImpact: number) => {
      setScenarioDone(true);
      setScenarioAnswers(answers);
      await handleComplete(answers, totalRiskImpact);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completionId]
  );

  async function handleComplete(scenarioAns?: ScenarioAnswer[], riskImpact?: number) {
    setIsFinishing(true);

    const correctCount = Object.values(quizStates).filter((s) => s.isCorrect).length;
    const totalQuiz = quizBlocks.length;
    let quizScore = totalQuiz > 0 ? (correctCount / totalQuiz) * 100 : 100;

    if (isScenario && riskImpact !== undefined && scenarioAns) {
      const maxPossibleImpact = scenarioAns.length * 10;
      quizScore =
        maxPossibleImpact > 0
          ? Math.max(
              0,
              Math.round(
                ((riskImpact + maxPossibleImpact) / (maxPossibleImpact * 2)) * 100
              )
            )
          : 50;
    }

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    if (completionId) {
      await supabase
        .from("module_completions")
        .update({
          status: "completed",
          score: parseFloat(quizScore.toFixed(2)),
          time_spent_seconds: timeSpent,
          completed_at: new Date().toISOString(),
        })
        .eq("id", completionId);
    }

    router.push(`/employee/modules/${moduleId}/completed`);
  }

  const canAdvance =
    currentBlock?.type !== "quiz_question" ||
    (quizStates[(currentBlock as QuizQuestionBlock).id]?.answered ?? false);

  const scenarioSteps = blocks.filter(
    (b): b is ScenarioStepBlock => b.type === "scenario_step"
  );

  const difficultyLabel: Record<string, string> = {
    easy: "Facile",
    medium: "Intermédiaire",
    hard: "Avancé",
  };

  const kindMeta: Record<string, { label: string; color: string }> = {
    micro_lesson: { label: "Micro-leçon", color: "#163061" },
    quiz:         { label: "Quiz",        color: "#27AE60" },
    scenario:     { label: "Scénario",    color: "#9B59B6" },
    jit_remediation: { label: "JIT Urgent", color: "#E67E22" },
    video:        { label: "Vidéo",       color: "#2D7DC8" },
  };
  const meta = kindMeta[kind] ?? { label: "Formation", color: "#163061" };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#F0F2F8" }}>
      {/* ── En-tête sticky ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "linear-gradient(135deg, #0D2250 0%, #163061 60%, #1C3B7A 100%)",
          boxShadow: "0 2px 20px rgba(13,34,80,0.35)",
        }}
      >
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl -ml-1 transition-colors shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
            aria-label="Revenir en arrière"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.20)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.10)"; }}
          >
            <ArrowLeft className="w-5 h-5 text-white" aria-hidden="true" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Badges type + difficulté */}
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(232,162,40,0.20)", color: "#E8A228" }}
              >
                {meta.label}
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>·</span>
              <span
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.60)" }}
              >
                {difficultyLabel[difficulty] ?? difficulty}
              </span>
            </div>
            <p className="text-sm font-semibold text-white truncate leading-tight">{title}</p>
          </div>

          <div
            className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <Clock className="w-3 h-3 text-white" aria-hidden="true" />
            <span className="text-xs font-semibold text-white">{estimatedMinutes} min</span>
          </div>
        </div>

        {/* ── Barre de progression ────────────────────────────────────── */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {isScenario
                ? `Étape ${scenarioAnswers.length + 1} / ${Math.max(scenarioSteps.length, 1)}`
                : `Bloc ${Math.min(currentBlockIdx + 1, blocks.length)} / ${blocks.length}`}
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: progress >= 100 ? "#E8A228" : "rgba(255,255,255,0.60)" }}
            >
              {progress}%
            </span>
          </div>
          {/* Track */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 100
                  ? "linear-gradient(90deg, #E8A228, #F5C842)"
                  : "linear-gradient(90deg, #C98B1A, #E8A228)",
                boxShadow: "0 0 10px rgba(232,162,40,0.50)",
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-7">
        <div className="max-w-xl mx-auto w-full">

          {/* Objectifs pédagogiques (premier bloc) */}
          {moduleBody?.learningObjectives && currentBlockIdx === 0 && !isScenario && (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-sm">
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)" }}
              >
                <BookOpen className="w-4 h-4" style={{ color: "#E8A228" }} aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-widest text-white">
                  À la fin de ce module, vous saurez
                </p>
              </div>
              <div className="bg-white px-4 py-4 space-y-2.5">
                {moduleBody.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: "#C98B1A" }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "#0F1B36" }}>{obj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Renderer scénario */}
          {isScenario ? (
            scenarioDone ? (
              <div className="text-center py-10 space-y-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)" }}
                >
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold" style={{ color: "#0F1B36" }}>Scénario complété</p>
                <p className="text-sm" style={{ color: "#718096" }}>Enregistrement en cours…</p>
              </div>
            ) : (
              <ScenarioRenderer steps={scenarioSteps} onComplete={handleScenarioComplete} />
            )
          ) : (
            currentBlock && (
              <div className="animate-in fade-in duration-200">
                {currentBlock.type === "heading" && <HeadingBlockView block={currentBlock} />}
                {currentBlock.type === "paragraph" && <ParagraphBlockView block={currentBlock} />}
                {currentBlock.type === "list" && <ListBlockView block={currentBlock} />}
                {currentBlock.type === "image" && <ImageBlockView block={currentBlock} />}
                {currentBlock.type === "video" && <VideoBlockView block={currentBlock} />}
                {currentBlock.type === "callout" && <CalloutBlockView block={currentBlock} />}
                {currentBlock.type === "quiz_question" && (
                  <QuizQuestionBlockView
                    key={currentBlock.id}
                    block={currentBlock}
                    onSubmit={handleQuizSubmit}
                  />
                )}
                {currentBlock.type === "scenario_step" && (
                  <div className="rounded-2xl overflow-hidden shadow-sm mb-5">
                    <div
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-widest"
                      style={{ background: "linear-gradient(135deg, #163061, #1F3F7A)", color: "rgba(255,255,255,0.75)" }}
                    >
                      Situation
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="text-base leading-relaxed" style={{ color: "#0F1B36" }}>
                        {currentBlock.situation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Navigation bas (modules linéaires) ──────────────────────────── */}
      {!isScenario && (
        <nav
          className="shrink-0 px-4 py-4"
          style={{
            backgroundColor: "rgba(240,242,248,0.96)",
            borderTop: "1px solid #D1D9EC",
            backdropFilter: "blur(12px)",
            boxShadow: "0 -4px 20px rgba(22,48,97,0.10)",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          }}
          aria-label="Navigation du module"
        >
          <div className="max-w-xl mx-auto flex items-center gap-3">
            {/* Bouton précédent */}
            {currentBlockIdx > 0 && (
              <button
                onClick={() => setCurrentBlockIdx((i) => i - 1)}
                className="p-3 rounded-xl border-2 transition-all hover:shadow-sm"
                style={{ borderColor: "#C5CEDF", backgroundColor: "white", color: "#163061" }}
                aria-label="Bloc précédent"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: "#163061" }} aria-hidden="true" />
              </button>
            )}

            {/* Bouton suivant */}
            {!isLastBlock && (
              <button
                className="flex-1 py-4 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: canAdvance
                    ? "linear-gradient(135deg, #163061, #1F3F7A)"
                    : "linear-gradient(135deg, #8FA3C8, #6B82AA)",
                  opacity: canAdvance ? 1 : 0.7,
                  cursor: canAdvance ? "pointer" : "not-allowed",
                  boxShadow: canAdvance ? "0 4px 14px rgba(22,48,97,0.25)" : "none",
                }}
                onClick={canAdvance ? () => setCurrentBlockIdx((i) => i + 1) : undefined}
                aria-disabled={!canAdvance}
                aria-label="Bloc suivant"
              >
                Continuer
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            {/* Bouton terminer */}
            {isLastBlock && !isCompleted && (() => {
              const blocked = isFinishing || (quizBlocks.length > 0 && !allQuizzesAnswered);
              return (
                <button
                  className="flex-1 py-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    background: blocked
                      ? "linear-gradient(135deg, #94A3B8, #64748B)"
                      : "linear-gradient(135deg, #D97706, #B45309)",
                    opacity: blocked ? 0.6 : 1,
                    cursor: blocked ? "not-allowed" : "pointer",
                    boxShadow: blocked ? "none" : "0 4px 16px rgba(180,83,9,0.35)",
                  }}
                  onClick={blocked ? undefined : () => handleComplete()}
                  aria-disabled={blocked}
                >
                  {isFinishing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                      {quizBlocks.length > 0 && !allQuizzesAnswered
                        ? "Répondez au quiz pour continuer"
                        : "Terminer le module"}
                    </>
                  )}
                </button>
              );
            })()}

            {/* Déjà complété */}
            {isCompleted && (
              <button
                className="flex-1 py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "white",
                  border: "2px solid #163061",
                  color: "#163061",
                  boxShadow: "0 2px 8px rgba(22,48,97,0.12)",
                }}
                onClick={() => router.push("/employee")}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Retour à l'accueil
              </button>
            )}
          </div>

          {/* Indicateur de blocage quiz */}
          {isLastBlock && !isCompleted && quizBlocks.length > 0 && !allQuizzesAnswered && !isFinishing && (
            <p className="text-center text-xs mt-2" style={{ color: "#7A8BAF" }}>
              {Object.keys(quizStates).length}/{quizBlocks.length} question{quizBlocks.length > 1 ? "s" : ""} répondue{quizBlocks.length > 1 ? "s" : ""}
            </p>
          )}
        </nav>
      )}
    </div>
  );
}
