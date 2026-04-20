"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleModulePublished, archiveModule } from "../actions";
import { Eye, EyeOff, Archive, Loader2 } from "lucide-react";

interface Props {
  moduleId: string;
  isPublished: boolean;
  canDelete: boolean;
}

export function ModuleActions({ moduleId, isPublished, canDelete }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleTogglePublish() {
    setError(null);
    startTransition(async () => {
      const result = await toggleModulePublished(moduleId, !isPublished);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  async function handleArchive() {
    if (!confirm("Archiver ce module le retirera de la vue des employés. Continuer ?")) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveModule(moduleId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/content");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleTogglePublish}
        disabled={isPending}
        className="gap-1.5"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPublished ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
        {isPublished ? "Dépublier" : "Publier"}
      </Button>

      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          disabled={isPending}
          className="gap-1.5 text-fg-muted hover:text-red-600 hover:border-red-300"
        >
          <Archive className="w-3.5 h-3.5" />
          Archiver
        </Button>
      )}
    </div>
  );
}
