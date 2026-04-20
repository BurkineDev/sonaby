import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft, Clock, Tag, BookOpen,
  Eye, EyeOff, Layers, Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ModuleActions } from "./module-actions";
import { parseModuleBody } from "@/lib/shared";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("modules").select("title").eq("id", id).single();
  return { title: data?.title ?? "Détail module" };
}

const KIND_LABELS: Record<string, string> = {
  micro_lesson: "Micro-leçon",
  quiz: "Quiz",
  video: "Vidéo",
  scenario: "Scénario",
  jit_remediation: "JIT Remédiation",
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy:   { label: "Facile",        color: "text-green-700 bg-green-50" },
  medium: { label: "Intermédiaire", color: "text-amber-700 bg-amber-50" },
  hard:   { label: "Avancé",        color: "text-red-700 bg-red-50" },
};

export default async function ModuleDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "rssi", "super_admin"].includes(profile.role)) {
    redirect("/employee");
  }

  const [{ data: mod }, { data: completionStats }] = await Promise.all([
    supabase
      .from("modules")
      .select("*, learning_paths(title)")
      .eq("id", id)
      .single(),

    supabase
      .from("module_completions")
      .select("status, score")
      .eq("module_id", id),
  ]);

  if (!mod) notFound();

  const body = parseModuleBody(mod.body);
  const blockCount = body?.blocks.length ?? 0;
  const quizCount = body?.blocks.filter((b) => b.type === "quiz_question").length ?? 0;
  const scenarioSteps = body?.blocks.filter((b) => b.type === "scenario_step").length ?? 0;

  const totalCompletions = completionStats?.length ?? 0;
  const completedCount = completionStats?.filter((c) => c.status === "completed").length ?? 0;
  const avgScore =
    completedCount > 0
      ? (completionStats!
          .filter((c) => c.status === "completed" && c.score !== null)
          .reduce((sum, c) => sum + (c.score ?? 0), 0) /
          completedCount
        ).toFixed(1)
      : "—";

  const diff = DIFFICULTY_LABELS[mod.difficulty] ?? DIFFICULTY_LABELS["medium"]!;
  const pathData = mod.learning_paths as unknown as { title: string } | null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Retour */}
      <Link
        href="/admin/content"
        className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg-DEFAULT transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Contenus pédagogiques
      </Link>

      {/* En-tête + Statut */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${diff.color}`}>
                {diff.label}
              </span>
              <span className="text-xs text-fg-subtle">
                {KIND_LABELS[mod.kind] ?? mod.kind}
              </span>
              {pathData && (
                <span className="text-xs text-fg-subtle">· {pathData.title}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-fg-DEFAULT">{mod.title}</h1>
            <p className="text-xs text-fg-subtle">
              Créé le {formatDate(mod.created_at)}
              {mod.updated_at !== mod.created_at && ` · Modifié le ${formatDate(mod.updated_at)}`}
            </p>
          </div>

          {/* Actions publish/archive */}
          <ModuleActions
            moduleId={mod.id}
            isPublished={mod.is_published}
            canDelete={profile.role === "super_admin" || profile.role === "admin"}
          />
        </div>

        {/* Statut de publication */}
        <div className={`mt-4 flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
          mod.is_published
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-bg-subtle border border-border text-fg-muted"
        }`}>
          {mod.is_published ? (
            <><Eye className="w-4 h-4" /> Publié — visible par les employés</>
          ) : (
            <><EyeOff className="w-4 h-4" /> Brouillon — non visible par les employés</>
          )}
        </div>
      </div>

      {/* Méta-données */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Durée", value: `${mod.estimated_minutes} min`, icon: <Clock className="w-4 h-4 text-fg-subtle" /> },
          { label: "Blocs", value: blockCount, icon: <Layers className="w-4 h-4 text-fg-subtle" /> },
          { label: "Complétions", value: totalCompletions, icon: <Users className="w-4 h-4 text-fg-subtle" /> },
          { label: "Score moy.", value: avgScore, icon: <BookOpen className="w-4 h-4 text-fg-subtle" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-1.5 text-xs text-fg-subtle mb-1">
              {stat.icon}
              {stat.label}
            </div>
            <p className="text-2xl font-bold font-mono text-fg-DEFAULT">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Objectifs pédagogiques */}
      {body?.learningObjectives && body.learningObjectives.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-fg-DEFAULT mb-3">Objectifs pédagogiques</h2>
          <ul className="space-y-2">
            {body.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                  {i + 1}
                </span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Résumé du contenu */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-fg-DEFAULT">Structure du contenu</h2>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: `${quizCount} question(s) quiz`, show: quizCount > 0 },
            { label: `${scenarioSteps} étape(s) scénario`, show: scenarioSteps > 0 },
            { label: `${blockCount} blocs au total`, show: true },
          ]
            .filter((s) => s.show)
            .map((s) => (
              <span
                key={s.label}
                className="px-2.5 py-1 rounded-full bg-bg-subtle border border-border text-fg-muted"
              >
                {s.label}
              </span>
            ))}
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs text-fg-subtle mb-2 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Tags thématiques
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(mod.topic_tags as string[]).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-200"
              >
                {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Prévisualisation JSON brut */}
      <details className="bg-white rounded-xl border border-border overflow-hidden">
        <summary className="px-6 py-4 text-sm font-semibold text-fg-DEFAULT cursor-pointer hover:bg-bg-subtle select-none">
          Contenu JSON brut (aperçu développeur)
        </summary>
        <pre className="px-6 py-4 text-xs text-green-300 bg-gray-950 overflow-x-auto max-h-96">
          {JSON.stringify(mod.body, null, 2)}
        </pre>
      </details>
    </div>
  );
}
