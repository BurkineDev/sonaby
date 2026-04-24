"use client";

import Link from "next/link";
import {
  BookOpen, PlayCircle, HelpCircle, Film, AlertCircle,
  Clock, ChevronRight, CheckCircle2,
} from "lucide-react";

interface Props {
  id?: string | null;
  title?: string | null;
  kind?: string | null;
  estimatedMinutes?: number | null;
  topicTags?: string[] | null;
  progress?: number | undefined;
  completed?: boolean | undefined;
  score?: number | undefined;
  difficulty?: string | undefined;
}

const KIND_META: Record<
  string,
  { label: string; icon: React.ReactNode; stripe: string; iconBg: string; iconColor: string }
> = {
  micro_lesson: {
    label:     "Micro-leçon",
    icon:      <BookOpen  className="w-4 h-4" aria-hidden="true" />,
    stripe:    "#163061",
    iconBg:    "rgba(22,48,97,0.10)",
    iconColor: "#163061",
  },
  quiz: {
    label:     "Quiz",
    icon:      <HelpCircle className="w-4 h-4" aria-hidden="true" />,
    stripe:    "#27AE60",
    iconBg:    "rgba(39,174,96,0.10)",
    iconColor: "#27AE60",
  },
  video: {
    label:     "Vidéo",
    icon:      <Film className="w-4 h-4" aria-hidden="true" />,
    stripe:    "#2D7DC8",
    iconBg:    "rgba(45,125,200,0.10)",
    iconColor: "#2D7DC8",
  },
  scenario: {
    label:     "Scénario",
    icon:      <PlayCircle className="w-4 h-4" aria-hidden="true" />,
    stripe:    "#8B5CF6",
    iconBg:    "rgba(139,92,246,0.10)",
    iconColor: "#8B5CF6",
  },
  jit_remediation: {
    label:     "Formation urgente",
    icon:      <AlertCircle className="w-4 h-4" aria-hidden="true" />,
    stripe:    "#E67E22",
    iconBg:    "rgba(230,126,34,0.12)",
    iconColor: "#E67E22",
  },
};

const TAG_LABELS: Record<string, string> = {
  phishing:           "Hameçonnage",
  mobile_money:       "Mobile Money",
  orange_money:       "Orange Money",
  moov_money:         "Moov Money",
  sonabhy_rh:         "RH SONABHY",
  password:           "Mots de passe",
  social_engineering: "Ingénierie sociale",
  whatsapp:           "WhatsApp",
};

const SCORE_COLOR = (s: number) =>
  s >= 86 ? "#1ABC9C" :
  s >= 71 ? "#27AE60" :
  s >= 51 ? "#D4AC0D" :
  s >= 31 ? "#E67E22" :
             "#C0392B";

const DIFF_DOTS = { easy: 1, medium: 2, hard: 3 } as Record<string, number>;

export function ModuleCard({
  id,
  title,
  kind,
  estimatedMinutes,
  topicTags,
  progress,
  completed = false,
  score,
  difficulty,
}: Props) {
  const safeKind = kind ?? "micro_lesson";
  const safeTitle = title?.trim() || "Module de formation";
  const safeEstimatedMinutes = estimatedMinutes ?? 5;
  const safeTopicTags = Array.isArray(topicTags) ? topicTags : [];
  const href = id ? `/employee/modules/${id}` : "/employee/parcours";
  const meta  = KIND_META[safeKind] ?? KIND_META["micro_lesson"]!;
  const isJIT = safeKind === "jit_remediation";
  const filledDots = difficulty ? (DIFF_DOTS[difficulty] ?? 0) : 0;
  const scoreColor = score !== undefined ? SCORE_COLOR(score) : undefined;

  return (
    <Link
      href={href}
      className="group block rounded-2xl bg-white border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      style={{
        borderColor: isJIT ? "#E67E2250" : "#DDE2EE",
        boxShadow: isJIT
          ? "0 2px 8px rgba(230,126,34,0.12)"
          : "0 2px 6px rgba(22,48,97,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = isJIT
          ? "0 6px 20px rgba(230,126,34,0.18)"
          : "0 6px 20px rgba(22,48,97,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = isJIT
          ? "0 2px 8px rgba(230,126,34,0.12)"
          : "0 2px 6px rgba(22,48,97,0.06)";
      }}
      aria-label={`${meta.label} : ${safeTitle}, ${safeEstimatedMinutes} minutes${completed ? ", terminé" : ""}${score !== undefined ? `, score ${Math.round(score)}/100` : ""}`}
    >
      <div className="flex">
        {/* ── Stripe gauche colorée ──────────────────────────── */}
        <div
          className="w-1 shrink-0 rounded-l-2xl"
          style={{
            background: completed
              ? `linear-gradient(180deg, #27AE60, #1ABC9C)`
              : isJIT
              ? `linear-gradient(180deg, #E67E22, #F39C12)`
              : `linear-gradient(180deg, ${meta.stripe}DD, ${meta.stripe}88)`,
          }}
        />

        {/* ── Contenu principal ──────────────────────────────── */}
        <div className="flex items-start gap-3.5 px-4 py-4 flex-1 min-w-0">
          {/* Icône kind */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105"
            style={{
              backgroundColor: completed ? "rgba(39,174,96,0.10)" : meta.iconBg,
              color: completed ? "#27AE60" : meta.iconColor,
            }}
          >
            {completed
              ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              : meta.icon}
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            {/* Ligne 1 : badge kind + JIT urgent + difficulty dots */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs font-semibold shrink-0"
                  style={{ color: completed ? "#27AE60" : meta.iconColor }}
                >
                  {completed ? "Terminé" : meta.label}
                </span>
                {isJIT && !completed && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0 animate-jit-beacon"
                    style={{ backgroundColor: "rgba(230,126,34,0.15)", color: "#C0640A" }}
                  >
                    Urgent
                  </span>
                )}
              </div>

              {/* Difficulty dots OU score badge si completed */}
              {completed && score !== undefined ? (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 font-mono"
                  style={{
                    backgroundColor: `${scoreColor}18`,
                    color: scoreColor,
                    border: `1px solid ${scoreColor}40`,
                  }}
                >
                  {Math.round(score)}/100
                </span>
              ) : filledDots > 0 ? (
                <div className="flex gap-1 shrink-0" aria-label={`Difficulté : ${difficulty}`}>
                  {[1, 2, 3].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: d <= filledDots ? meta.iconColor : "#E4E8F0",
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {/* Titre */}
            <p
              className="text-sm font-semibold line-clamp-2 leading-snug mb-1.5"
              style={{ color: completed ? "#4A5568" : "#0F1B36" }}
            >
              {safeTitle}
            </p>

            {/* Tags + durée sur une ligne */}
            <div className="flex items-center justify-between gap-2">
              {safeTopicTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {safeTopicTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#F1F3F8", color: "#6B7280" }}
                    >
                      {TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" style={{ color: "#A0AEC0" }} aria-hidden="true" />
                <span className="text-xs" style={{ color: "#A0AEC0" }}>
                  {safeEstimatedMinutes} min
                </span>
              </div>
            </div>

            {/* Barre de progression si en cours */}
            {progress !== undefined && progress > 0 && !completed && (
              <div
                className="mt-3"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress}% terminé`}
              >
                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#E4E8F0" }}>
                  <div
                    className="h-full rounded-full animate-progress-fill"
                    style={{ width: `${progress}%`, backgroundColor: meta.stripe }}
                  />
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#A0AEC0" }}>{progress}% terminé</p>
              </div>
            )}

            {/* Barre verte complète si terminé */}
            {completed && (
              <div className="mt-2.5 w-full h-1 rounded-full" style={{ backgroundColor: "rgba(39,174,96,0.20)" }}>
                <div className="h-full w-full rounded-full" style={{ backgroundColor: "#27AE60" }} />
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight
            className="w-4 h-4 shrink-0 self-center transition-transform duration-200 group-hover:translate-x-1"
            style={{ color: "#C8D2E0" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}
