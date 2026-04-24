import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModuleRenderer } from "./module-renderer";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("modules")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ?? "Module de formation" };
}

export default async function ModulePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: module } = await supabase
    .from("modules")
    .select("id, title, kind, estimated_minutes, topic_tags, body, difficulty")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!module) notFound();

  // Créer ou récupérer la complétion en cours
  const { data: completion } = await supabase
    .from("module_completions")
    .select("id, status, score")
    .eq("user_id", user.id)
    .eq("module_id", id)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!completion) {
    // Créer une complétion "started"
    await supabase.from("module_completions").insert({
      user_id: user.id,
      module_id: id,
      status: "started",
      trigger: "manual",
    });
  }

  return (
    <div className="min-h-screen bg-bg">
      <ModuleRenderer
        moduleId={module.id}
        title={module.title}
        kind={module.kind}
        estimatedMinutes={module.estimated_minutes}
        difficulty={module.difficulty}
        body={module.body as Record<string, unknown>}
        completionId={completion?.id ?? null}
        isCompleted={completion?.status === "completed"}
      />
    </div>
  );
}
