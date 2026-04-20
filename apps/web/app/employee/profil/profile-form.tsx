"use client";

import { useActionState, useTransition } from "react";
import { updateProfile, type ProfileActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  fullName: string;
  email: string;
};

export function ProfileForm({ fullName, email }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    {}
  );

  return (
    <form
      action={(fd) => startTransition(() => formAction(fd))}
      className="space-y-4"
    >
      {/* Nom complet */}
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium text-fg-DEFAULT">
          Nom complet
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName}
          className={cn(
            "w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500",
            "border-border"
          )}
          maxLength={100}
          required
        />
      </div>

      {/* Email (lecture seule) */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-fg-DEFAULT">
          Adresse email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border text-sm bg-bg-subtle text-fg-muted cursor-not-allowed"
        />
        <p className="text-xs text-fg-subtle">
          L&apos;email est géré par l&apos;administrateur et ne peut pas être modifié ici.
        </p>
      </div>

      {/* Feedback */}
      {state.success && (
        <div className="flex items-center gap-2 text-sm text-risk-low">
          <CheckCircle2 className="w-4 h-4" />
          {state.success}
        </div>
      )}
      {state.error && (
        <p className="text-sm text-risk-critical">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enregistrement…
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </form>
  );
}
