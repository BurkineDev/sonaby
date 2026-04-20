import Link from "next/link";
import { BookOpen, PlayCircle, HelpCircle, Film, AlertCircle, Clock, ChevronRight } from "lucide-react";

interface Props {
  id: string;
  title: string;
  kind: string;
  estimatedMinutes: number;
  topicTags: string[];
  progress?: number; // 0-100 si en cours
}

const KIND_META: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; accent: string }
> = {
  micro_lesson: {
    label:  "Micro-leçon",
    icon:   <BookOpen className="w-4 h-4" aria-hidden="true" />,
    bg:     "rgba(22,48,97,0.08)",
    accent: "#163061",
  },
  quiz: {
    label:  "Quiz",
    icon:   <HelpCircle className="w-4 h-4" aria-hidden="true" />,
    bg:     "rgba(39,174,96,0.08)",
    accent: "#27AE60",
  },
  video: {
    label:  "Vidéo",
    icon:   <Film className="w-4 h-4" aria-hidden="true" />,
    bg:     "rgba(45,125,200,0.08)",
    accent: "#2D7DC8",
  },
  scenario: {
    label:  "Scénario",
    icon:   <PlayCircle className="w-4 h-4" aria-hidden="true" />,
    bg:     "rgba(155,89,182,0.08)",
    accent: "#9B59B6",
  },
  jit_remediation: {
    label:  "Formation urgente",
    icon:   <AlertCircle className="w-4 h-4" aria-hidden="true" />,
    bg:     "rgba(230,126,34,0.10)",
    accent: "#E67E22",
  },
};

const TAG_LABELS: Record<string, string> = {
  phishing:          "Hameçonnage",
  mobile_money:      "Mobile Money",
  orange_money:      "Orange Money",
  moov_money:        "Moov Money",
  sonabhy_rh:        "RH SONABHY",
  password:          "Mots de passe",
  social_engineering:"Ingénierie sociale",
  whatsapp:          "WhatsApp",
};

export function ModuleCard({
  id,
  title,
  kind,
  estimatedMinutes,
  topicTags,
  progress,
}: Props) {
  const meta   = KIND_META[kind] ?? KIND_META["micro_lesson"]!;
  const isJIT  = kind === "jit_remediation";

  return (
    <Link
      href={`/employee/modules/${id}`}
      className="block rounded-xl border bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none group"
      style={{
        borderColor: isJIT ? "#E67E22" : "#DDE2EE",
        boxShadow:   "0 2px 6px rgba(22,48,97,0.06)",
      }}
      aria-label={`${meta.label} : ${title}, ${estimatedMinutes} minutes`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Icône type */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: meta.bg, color: meta.accent }}
        >
          {meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge type + JIT urgent */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold"
              style={{ color: meta.accent }}
            >
              {meta.label}
            </span>
            {isJIT && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: "rgba(230,126,34,0.15)",
                  color: "#C0640A",
                }}
              >
                À faire maintenant
              </span>
            )}
          </div>

          {/* Titre */}
          <p className="text-sm font-semibold text-fg-DEFAULT line-clamp-2 leading-snug">
            {title}
          </p>

          {/* Tags */}
          {topicTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {topicTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: "#F1F3F8", color: "#4A5568" }}
                >
                  {TAG_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          )}

          {/* Durée */}
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-3 h-3 text-fg-subtle" aria-hidden="true" />
            <span className="text-xs text-fg-subtle">{estimatedMinutes} min</span>
          </div>

          {/* Barre de progression si en cours */}
          {progress !== undefined && progress > 0 && (
            <div className="mt-2.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#E4E8F0" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: meta.accent }}
                />
              </div>
              <p className="text-xs text-fg-subtle mt-0.5">{progress}% terminé</p>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight
          className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "#A0AEC0" }}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
