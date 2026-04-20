"use client";

import { useActionState, useTransition } from "react";
import { updateConsent, type ProfileActionState } from "./actions";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ConsentScope = "phishing_simulation" | "behavior_analytics" | "individual_reporting";

type ConsentToggleProps = {
  scope: ConsentScope;
  label: string;
  description: string;
  isGranted: boolean;
  recommended?: boolean;
};

export function ConsentToggle({
  scope,
  label,
  description,
  isGranted,
  recommended,
}: ConsentToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateConsent,
    {}
  );

  const handleChange = (newGranted: boolean) => {
    const fd = new FormData();
    fd.set("scope", scope);
    fd.set("granted", String(newGranted));
    startTransition(() => formAction(fd));
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isGranted ? "border-green-200 bg-green-50" : "border-border bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isGranted ? (
              <Shield className="w-4 h-4 text-risk-low shrink-0" />
            ) : (
              <ShieldOff className="w-4 h-4 text-fg-subtle shrink-0" />
            )}
            <span className="text-sm font-medium text-fg-DEFAULT">{label}</span>
            {recommended && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                Recommandé
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted mt-1 ml-6">{description}</p>
          {state.success && (
            <p className="text-xs text-risk-low mt-1 ml-6">{state.success}</p>
          )}
          {state.error && (
            <p className="text-xs text-risk-critical mt-1 ml-6">{state.error}</p>
          )}
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isGranted}
          aria-label={`${isGranted ? "Retirer" : "Accorder"} le consentement : ${label}`}
          onClick={() => handleChange(!isGranted)}
          disabled={isPending}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
            isGranted ? "bg-risk-low" : "bg-border",
            isPending && "opacity-50 cursor-wait"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              isGranted ? "translate-x-5" : "translate-x-0"
            )}
          />
          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
