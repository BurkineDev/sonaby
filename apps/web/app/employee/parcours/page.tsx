import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/employee/module-card";

export const metadata: Metadata = { title: "Mon parcours de formation" };

export default async function ParcoursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Modules en cours ou assignés
  const { data: inProgress } = await supabase
    .from("module_completions")
    .select("module_id, status, modules(id, title, kind, estimated_minutes, topic_tags)")
    .eq("user_id", user.id)
    .in("status", ["started"])
    .order("started_at", { ascending: false });

  // Modules complétés
  const { data: completed } = await supabase
    .from("module_completions")
    .select("module_id, status, score, completed_at, modules(id, title, kind, estimated_minutes, topic_tags)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  // Modules disponibles non commencés
  const doneIds = [
    ...(inProgress ?? []).map((c) => c.module_id),
    ...(completed ?? []).map((c) => c.module_id),
  ];

  const { data: available } = await supabase
    .from("modules")
    .select("id, title, kind, estimated_minutes, topic_tags")
    .eq("is_published", true)
    .not("id", "in", doneIds.length > 0 ? `(${doneIds.join(",")})` : "(null)")
    .order("difficulty", { ascending: true })
    .limit(10);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-8 md:ml-56">
      <h1 className="text-2xl font-semibold text-fg-DEFAULT">Mon parcours</h1>

      {/* En cours */}
      {inProgress && inProgress.length > 0 && (
        <section aria-labelledby="inprogress-heading">
          <h2 id="inprogress-heading" className="text-base font-semibold text-fg-DEFAULT mb-3">
            En cours ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.map((c) => {
              const mod = c.modules as unknown as { id: string; title: string; kind: string; estimated_minutes: number; topic_tags: string[] } | null;
              if (!mod) return null;
              return (
                <ModuleCard
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  kind={mod.kind}
                  estimatedMinutes={mod.estimated_minutes}
                  topicTags={mod.topic_tags}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* À faire */}
      {available && available.length > 0 && (
        <section aria-labelledby="available-heading">
          <h2 id="available-heading" className="text-base font-semibold text-fg-DEFAULT mb-3">
            Disponibles ({available.length})
          </h2>
          <div className="space-y-3">
            {available.map((mod) => (
              <ModuleCard
                key={mod.id}
                id={mod.id}
                title={mod.title}
                kind={mod.kind}
                estimatedMinutes={mod.estimated_minutes}
                topicTags={mod.topic_tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* Complétés */}
      {completed && completed.length > 0 && (
        <section aria-labelledby="completed-heading">
          <h2 id="completed-heading" className="text-base font-semibold text-fg-DEFAULT mb-3">
            Complétés ({completed.length})
          </h2>
          <div className="space-y-3">
            {completed.map((c) => {
              const mod = c.modules as unknown as { id: string; title: string; kind: string; estimated_minutes: number; topic_tags: string[] } | null;
              if (!mod) return null;
              return (
                <div key={mod.id} className="opacity-70">
                  <ModuleCard
                    id={mod.id}
                    title={mod.title}
                    kind={mod.kind}
                    estimatedMinutes={mod.estimated_minutes}
                    topicTags={mod.topic_tags}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(!inProgress || inProgress.length === 0) &&
        (!available || available.length === 0) &&
        (!completed || completed.length === 0) && (
          <div className="text-center py-12">
            <p className="text-fg-muted">
              Aucun module disponible pour le moment. La DSI publiera bientôt de nouveaux contenus.
            </p>
          </div>
        )}
    </div>
  );
}
