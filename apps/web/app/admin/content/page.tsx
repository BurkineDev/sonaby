import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { BookOpen, Clock, Tag, Zap, GraduationCap, HelpCircle, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Gestion des contenus" };
export const dynamic = "force-dynamic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KIND_META: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  micro_lesson: {
    label: "Micro-leçon",
    icon: <BookOpen className="w-3 h-3" />,
    variant: "secondary",
  },
  quiz: {
    label: "Quiz",
    icon: <HelpCircle className="w-3 h-3" />,
    variant: "default",
  },
  jit_remediation: {
    label: "JIT",
    icon: <Zap className="w-3 h-3" />,
    variant: "outline",
  },
  awareness_video: {
    label: "Vidéo",
    icon: <GraduationCap className="w-3 h-3" />,
    variant: "secondary",
  },
};

const DIFFICULTY_META: Record<
  string,
  { label: string; color: string }
> = {
  easy: { label: "Facile", color: "text-risk-low" },
  medium: { label: "Moyen", color: "text-risk-medium" },
  hard: { label: "Difficile", color: "text-risk-high" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ContentPage() {
  const supabase = await createClient();

  const [{ data: modules }, { data: paths }] = await Promise.all([
    supabase
      .from("modules")
      .select(
        "id, title, kind, difficulty, is_published, estimated_minutes, topic_tags, created_at, learning_path_id, learning_paths(title)"
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("learning_paths")
      .select("id, title, target_role, is_active")
      .order("title"),
  ]);

  const totalModules = modules?.length ?? 0;
  const publishedModules = modules?.filter((m) => m.is_published).length ?? 0;
  const jitModules = modules?.filter((m) => m.kind === "jit_remediation").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-DEFAULT">Contenus pédagogiques</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            Modules de formation · Parcours d'apprentissage
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nouveau module
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Modules total", value: totalModules },
          { label: "Publiés", value: publishedModules },
          { label: "Brouillons", value: totalModules - publishedModules },
          { label: "Modules JIT", value: jitModules },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border p-4 text-center"
          >
            <p className="text-3xl font-bold font-mono text-fg-DEFAULT">{stat.value}</p>
            <p className="text-xs text-fg-subtle mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Parcours */}
      {paths && paths.length > 0 && (
        <section aria-labelledby="paths-heading">
          <h2
            id="paths-heading"
            className="text-base font-semibold text-fg-DEFAULT mb-3"
          >
            Parcours ({paths.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {paths.map((path) => (
              <div
                key={path.id}
                className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2"
              >
                <GraduationCap className="w-4 h-4 text-primary-600 shrink-0" />
                <span className="text-sm font-medium text-fg-DEFAULT">{path.title}</span>
                {path.target_role && (
                  <span className="text-xs text-fg-subtle capitalize">{path.target_role}</span>
                )}
                {!path.is_active && (
                  <Badge variant="outline" className="text-xs">Inactif</Badge>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Liste des modules */}
      <section aria-labelledby="modules-heading">
        <h2
          id="modules-heading"
          className="text-base font-semibold text-fg-DEFAULT mb-3"
        >
          Modules ({totalModules})
        </h2>

        {!modules || modules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white p-12 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-fg-subtle mx-auto" />
            <p className="text-fg-muted text-sm">
              Aucun module trouvé. Utilisez le seed SQL ou l'API admin pour ajouter du contenu.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide">
                    Module
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden md:table-cell">
                    Difficulté
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                    Durée
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden xl:table-cell">
                    Tags
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide hidden lg:table-cell">
                    Créé le
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-fg-subtle uppercase tracking-wide text-right">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modules.map((mod) => {
                  const kind = KIND_META[mod.kind] ?? KIND_META["micro_lesson"]!;
                  const diff = DIFFICULTY_META[mod.difficulty] ?? DIFFICULTY_META["medium"]!;
                  const path = mod.learning_paths as unknown as { title: string } | null;

                  return (
                    <tr key={mod.id} className="hover:bg-bg-subtle transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/content/${mod.id}`} className="group">
                          <p className="font-medium text-fg-DEFAULT group-hover:text-primary-600 line-clamp-1 transition-colors">
                            {mod.title}
                          </p>
                          {path && (
                            <p className="text-xs text-fg-subtle mt-0.5 line-clamp-1">
                              {path.title}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={kind.variant} className="gap-1 text-xs">
                          {kind.icon}
                          {kind.label}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 hidden md:table-cell text-sm font-medium ${diff.color}`}>
                        {diff.label}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-fg-muted">
                          <Clock className="w-3.5 h-3.5" />
                          {mod.estimated_minutes} min
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(mod.topic_tags as string[]).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-xs bg-bg-subtle text-fg-subtle flex items-center gap-0.5"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                          {(mod.topic_tags as string[]).length > 3 && (
                            <span className="text-xs text-fg-subtle">
                              +{(mod.topic_tags as string[]).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-fg-muted text-xs">
                        {formatDate(mod.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {mod.is_published ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-risk-low bg-green-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
                            Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-fg-subtle bg-bg-subtle px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-fg-subtle" />
                            Brouillon
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
