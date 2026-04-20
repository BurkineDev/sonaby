"use client";

/**
 * ModuleForm — Formulaire de création d'un module de formation
 *
 * L'éditeur de blocs est simplifié pour le MVP : on édite le JSON des blocs
 * directement dans un textarea (expérience développeur/admin avancé).
 * L'UI d'édition visuelle WYSIWYG est prévue en Phase 2 (M4-M6).
 *
 * La validation Zod (ModuleBodySchema) est appliquée côté Server Action.
 */

import { useState, useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createModule, type CreateModuleState } from "../actions";
import {
  BookOpen, Zap, HelpCircle, GraduationCap, Video,
  AlertCircle, CheckCircle2, Info,
} from "lucide-react";

const KINDS = [
  { value: "micro_lesson", label: "Micro-leçon", icon: <BookOpen className="w-4 h-4" />, desc: "Concept + exemple + check rapide (3-5 min)" },
  { value: "quiz",         label: "Quiz",        icon: <HelpCircle className="w-4 h-4" />, desc: "Évaluation des connaissances (2-3 min)" },
  { value: "video",        label: "Vidéo",       icon: <Video className="w-4 h-4" />,      desc: "Storytelling, introduction émotionnelle" },
  { value: "scenario",     label: "Scénario",    icon: <GraduationCap className="w-4 h-4" />, desc: "Interactif avec choix conséquentiels (5-7 min)" },
  { value: "jit_remediation", label: "JIT",      icon: <Zap className="w-4 h-4" />,       desc: "Déclenché après une erreur phishing (3-4 min)" },
] as const;

const DIFFICULTIES = [
  { value: "easy",   label: "Facile",        color: "text-green-700 bg-green-50 border-green-200" },
  { value: "medium", label: "Intermédiaire", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "hard",   label: "Avancé",        color: "text-red-700 bg-red-50 border-red-200" },
] as const;

const ALL_TAGS = [
  "phishing_email", "phishing_sms", "phishing_whatsapp",
  "mobile_money", "credentials_management", "mfa_usage",
  "physical_security", "usb_and_removable", "travel_security",
  "byod", "secure_comms", "data_classification",
  "incident_reporting", "social_engineering", "supply_chain", "executive_fraud",
];

// Template de corps JSON par type de module
const BODY_TEMPLATES: Record<string, string> = {
  micro_lesson: JSON.stringify({
    estimatedMinutes: 4,
    learningObjectives: ["Identifier 3 signaux d'alerte", "Adopter le bon réflexe"],
    blocks: [
      { type: "heading", level: 1, text: "Titre de la leçon" },
      { type: "paragraph", text: "Introduction au concept..." },
      { type: "callout", variant: "warning", text: "Point d'attention important" },
      { type: "list", ordered: true, items: ["Premier point", "Deuxième point", "Troisième point"] },
      {
        type: "quiz_question",
        id: "q1",
        kind: "single",
        question: "Question de vérification ?",
        choices: [
          { id: "a", label: "Bonne réponse", isCorrect: true, explanation: "Explication de pourquoi c'est correct." },
          { id: "b", label: "Mauvaise réponse 1", isCorrect: false, explanation: "Explication de l'erreur." },
          { id: "c", label: "Mauvaise réponse 2", isCorrect: false },
        ],
        feedback: {
          correct: "Parfait. Ce réflexe vous protège.",
          incorrect: "Le bon réflexe est de vérifier par canal officiel.",
        },
      },
      { type: "callout", variant: "success", text: "Réflexe clé à retenir." },
    ],
  }, null, 2),

  scenario: JSON.stringify({
    estimatedMinutes: 6,
    learningObjectives: ["Prendre la bonne décision en situation réelle"],
    blocks: [
      { type: "heading", level: 1, text: "Titre du scénario" },
      { type: "paragraph", text: "Contexte du scénario..." },
      {
        type: "scenario_step",
        id: "step-1",
        situation: "Vous recevez un SMS indiquant que votre compte Orange Money a été débité de 50 000 FCFA. Que faites-vous ?",
        choices: [
          { id: "a", label: "Je clique sur le lien dans le SMS pour vérifier", outcome: "Le lien était frauduleux. Vos identifiants ont été volés.", riskImpact: -10, nextStepId: null },
          { id: "b", label: "J'appelle le 1010 d'Orange Money pour vérifier", outcome: "Bonne décision. Le service client confirme qu'aucun débit n'a eu lieu.", riskImpact: 10, nextStepId: "step-2" },
          { id: "c", label: "J'ignore le SMS", outcome: "Ignorer peut être risqué si c'est un vrai incident. Mieux vaut vérifier par canal officiel.", riskImpact: -2, nextStepId: "step-2" },
        ],
      },
      {
        type: "scenario_step",
        id: "step-2",
        situation: "Un collègue vous demande votre mot de passe pour accéder à un fichier urgent en votre absence. Que faites-vous ?",
        choices: [
          { id: "a", label: "Je lui donne mon mot de passe par WhatsApp", outcome: "Ne jamais partager ses identifiants, même avec un collègue de confiance.", riskImpact: -10, nextStepId: null },
          { id: "b", label: "Je lui partage le fichier directement via le réseau interne", outcome: "Parfait. On partage le fichier, pas les identifiants.", riskImpact: 10, nextStepId: null },
          { id: "c", label: "Je refuse sans explication", outcome: "Refuser est juste, mais expliquer aide le collègue à comprendre la politique.", riskImpact: 3, nextStepId: null },
        ],
      },
    ],
  }, null, 2),

  quiz: JSON.stringify({
    estimatedMinutes: 3,
    learningObjectives: ["Évaluer votre niveau de connaissance"],
    blocks: [
      {
        type: "quiz_question",
        id: "q1",
        kind: "single",
        question: "Première question",
        choices: [
          { id: "a", label: "Réponse correcte", isCorrect: true },
          { id: "b", label: "Réponse incorrecte", isCorrect: false },
        ],
        feedback: { correct: "Correct !", incorrect: "La bonne réponse était A." },
      },
      {
        type: "quiz_question",
        id: "q2",
        kind: "multi",
        question: "Quelles actions sont correctes ? (plusieurs réponses)",
        choices: [
          { id: "a", label: "Action correcte 1", isCorrect: true },
          { id: "b", label: "Action correcte 2", isCorrect: true },
          { id: "c", label: "Action incorrecte", isCorrect: false },
        ],
        feedback: { correct: "Très bien !", incorrect: "Relisez la section sur les bonnes pratiques." },
      },
    ],
  }, null, 2),

  jit_remediation: JSON.stringify({
    estimatedMinutes: 3,
    learningObjectives: ["Comprendre l'erreur commise", "Adopter le bon réflexe immédiatement"],
    blocks: [
      { type: "heading", level: 1, text: "Ce qui vient de se passer" },
      { type: "paragraph", text: "Vous venez de cliquer sur un lien de simulation phishing. Voici ce qu'il fallait remarquer..." },
      { type: "list", ordered: true, items: ["Signal 1", "Signal 2", "Signal 3"] },
      { type: "callout", variant: "warning", text: "En situation réelle, ce clic aurait pu compromettre votre compte." },
      {
        type: "quiz_question",
        id: "jit-q1",
        kind: "single",
        question: "Que faire si vous avez cliqué par erreur sur un lien suspect ?",
        choices: [
          { id: "a", label: "Ne rien faire, c'était sûrement une erreur", isCorrect: false },
          { id: "b", label: "Signaler immédiatement au service informatique", isCorrect: true, explanation: "Signaler rapidement permet de limiter les dommages." },
          { id: "c", label: "Changer son mot de passe uniquement", isCorrect: false },
        ],
        feedback: { correct: "Exactement. La rapidité du signalement est cruciale.", incorrect: "La première action doit toujours être de signaler à l'IT." },
      },
      { type: "callout", variant: "success", text: "Réflexe à ancrer : doute → signalement immédiat." },
    ],
  }, null, 2),

  video: JSON.stringify({
    estimatedMinutes: 4,
    learningObjectives: ["Comprendre le contexte via un témoignage concret"],
    blocks: [
      { type: "heading", level: 1, text: "Titre de la vidéo" },
      { type: "video", src: "https://storage.supabase.co/placeholder.mp4", poster: "https://storage.supabase.co/placeholder.jpg" },
      { type: "paragraph", text: "Résumé des points clés abordés dans la vidéo..." },
      {
        type: "quiz_question",
        id: "v-q1",
        kind: "truefalse",
        question: "Affirmation à valider après la vidéo",
        choices: [
          { id: "true", label: "Vrai", isCorrect: true },
          { id: "false", label: "Faux", isCorrect: false },
        ],
        feedback: { correct: "Correct !", incorrect: "Revoir la vidéo pour clarifier ce point." },
      },
    ],
  }, null, 2),
};

interface Props {
  learningPaths: Array<{ id: string; title: string }>;
}

const initialState: CreateModuleState = {};

export function ModuleForm({ learningPaths }: Props) {
  const [state, formAction] = useActionState(createModule, initialState);
  const [isPending, startTransition] = useTransition();

  const [selectedKind, setSelectedKind] = useState<string>("micro_lesson");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  const [selectedTags, setSelectedTags] = useState<string[]>(["phishing_email"]);
  const [isPublished, setIsPublished] = useState(false);
  const [bodyJson, setBodyJson] = useState(BODY_TEMPLATES["micro_lesson"] ?? "");
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleKindChange(kind: string) {
    setSelectedKind(kind);
    setBodyJson(BODY_TEMPLATES[kind] ?? BODY_TEMPLATES["micro_lesson"] ?? "");
    setJsonError(null);
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleBodyChange(value: string) {
    setBodyJson(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch {
      setJsonError("JSON invalide — vérifiez la syntaxe");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (jsonError) return;

    const fd = new FormData(e.currentTarget);
    fd.set("kind", selectedKind);
    fd.set("difficulty", selectedDifficulty);
    fd.set("topic_tags", JSON.stringify(selectedTags));
    fd.set("body", bodyJson);
    fd.set("is_published", String(isPublished));

    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Erreur globale */}
      {state.error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}

      {/* ─── Informations générales ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-fg-DEFAULT uppercase tracking-wide">
          Informations générales
        </h2>

        {/* Titre */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-fg-DEFAULT mb-1.5">
            Titre du module <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Ex : Reconnaître un phishing Orange Money"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-fg-DEFAULT bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {state.fieldErrors?.title && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Type de module */}
        <div>
          <p className="text-sm font-medium text-fg-DEFAULT mb-2">
            Type de module <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => handleKindChange(k.value)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  selectedKind === k.value
                    ? "border-primary-500 bg-primary-50 text-primary-800"
                    : "border-border bg-bg-subtle hover:bg-bg-muted text-fg-DEFAULT"
                }`}
              >
                <span className={`mt-0.5 ${selectedKind === k.value ? "text-primary-600" : "text-fg-muted"}`}>
                  {k.icon}
                </span>
                <div>
                  <p className="text-sm font-medium">{k.label}</p>
                  <p className="text-xs text-fg-subtle mt-0.5 leading-tight">{k.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulté + Durée */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-fg-DEFAULT mb-2">Difficulté</p>
            <div className="flex flex-col gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedDifficulty === d.value
                      ? d.color
                      : "border-border bg-bg-subtle text-fg-DEFAULT hover:bg-bg-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="estimated_minutes"
              className="block text-sm font-medium text-fg-DEFAULT mb-2"
            >
              Durée estimée (min)
            </label>
            <input
              id="estimated_minutes"
              name="estimated_minutes"
              type="number"
              min={1}
              max={60}
              defaultValue={4}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-fg-DEFAULT bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Parcours (optionnel) */}
        {learningPaths.length > 0 && (
          <div>
            <label htmlFor="learning_path_id" className="block text-sm font-medium text-fg-DEFAULT mb-1.5">
              Parcours d'apprentissage (optionnel)
            </label>
            <select
              id="learning_path_id"
              name="learning_path_id"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-fg-DEFAULT bg-bg-subtle focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">— Aucun parcours —</option>
              {learningPaths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* ─── Tags thématiques ───────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-border p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-DEFAULT uppercase tracking-wide">
            Tags thématiques
          </h2>
          <span className="text-xs text-fg-subtle">{selectedTags.length} sélectionné(s)</span>
        </div>
        <p className="text-xs text-fg-subtle">
          Utilisés par le moteur JIT pour associer le module aux campagnes phishing correspondantes.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedTags.includes(tag)
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-bg-subtle text-fg-muted border-border hover:bg-bg-muted"
              }`}
            >
              {tag.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        {state.fieldErrors?.topic_tags && (
          <p className="text-xs text-red-600">{state.fieldErrors.topic_tags[0]}</p>
        )}
      </section>

      {/* ─── Éditeur de contenu (JSON) ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-border p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-fg-DEFAULT uppercase tracking-wide">
              Contenu du module (JSON)
            </h2>
            <p className="text-xs text-fg-subtle mt-0.5">
              Éditez les blocs directement. Un template pour "{KINDS.find(k => k.value === selectedKind)?.label}" a été chargé.
            </p>
          </div>
          <a
            href="https://github.com/wendtech/cyberguard-sonabhy/blob/main/docs/06-learning-engine.md#41-sch%C3%A9ma-zod-des-blocs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary-600 hover:underline shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            Schéma des blocs
          </a>
        </div>

        {jsonError && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {jsonError}
          </div>
        )}

        <textarea
          value={bodyJson}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={28}
          spellCheck={false}
          className={`w-full rounded-lg border px-3 py-2.5 text-xs font-mono text-fg-DEFAULT bg-gray-950 text-green-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y ${
            jsonError ? "border-red-400" : "border-border"
          }`}
          aria-label="Contenu JSON du module"
          aria-describedby={jsonError ? "json-error" : undefined}
        />

        {state.fieldErrors?.body && (
          <p className="text-xs text-red-600">{state.fieldErrors.body[0]}</p>
        )}
      </section>

      {/* ─── Publication ────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-fg-DEFAULT">Publication</p>
            <p className="text-xs text-fg-subtle mt-0.5">
              Un module non publié est invisible pour les employés.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => setIsPublished((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isPublished ? "bg-green-500" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isPublished ? "translate-x-5" : "translate-x-0"
              }`}
            />
            <span className="sr-only">
              {isPublished ? "Publier immédiatement" : "Garder en brouillon"}
            </span>
          </button>
        </div>
        <p className="text-xs text-fg-subtle mt-3">
          {isPublished ? (
            <span className="flex items-center gap-1 text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ce module sera visible dès la création
            </span>
          ) : (
            <span>Le module sera créé en brouillon. Vous pourrez le publier depuis la page de détail.</span>
          )}
        </p>
      </section>

      {/* ─── Actions ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending || !!jsonError || selectedTags.length === 0}
        >
          {isPending ? "Création en cours…" : "Créer le module"}
        </Button>
      </div>
    </form>
  );
}
