"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, ArrowRight, Eye } from "lucide-react";

interface Config {
  name: string;
  redFlags: string[];
  context: string;
}

interface Props {
  sendId: string | null;
  config: Config;
  slug: string;
}

type Phase = "fake_landing" | "reveal" | "debrief";

/**
 * Debrief post-clic phishing — spec 08-ui-ux-spec.md §7.2
 *
 * Phase 1 (0-3s) : page factice crédible qui "charge"
 * Phase 2 : bandeau "Ceci était une simulation" (pas "vous avez échoué")
 * Phase 3 : debrief avec les indices à repérer + CTA micro-module JIT
 */
export function PhishingDebriefPage({ sendId, config, slug }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("fake_landing");

  useEffect(() => {
    // Révéler le bandeau après 3 secondes
    const timer = setTimeout(() => setPhase("reveal"), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Phase 1 : fausse page de chargement ───────────────────────────────
  if (phase === "fake_landing") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-lg font-medium text-fg-DEFAULT">Vérification en cours…</p>
        <p className="text-sm text-fg-muted mt-2">
          Authentification de votre compte — veuillez patienter.
        </p>
      </div>
    );
  }

  // ─── Phase 2 : révélation ─────────────────────────────────────────────
  if (phase === "reveal") {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Icône */}
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <Shield className="w-10 h-10 text-amber-600" aria-hidden="true" />
          </div>

          {/* Message principal — ton neutre, pas moralisateur */}
          <div>
            <h1 className="text-2xl font-bold text-fg-DEFAULT">
              Ceci était une simulation.
            </h1>
            <p className="text-fg-muted mt-3 leading-relaxed">
              Vous venez de cliquer sur un email de test dans le cadre du programme de
              sensibilisation cybersécurité de SONABHY.
            </p>
            <p className="text-fg-muted mt-2 leading-relaxed text-sm">
              Ce test est une opportunité d'apprentissage — pas une sanction.
              Découvrez ce qui s'est passé et comment l'éviter à l'avenir.
            </p>
          </div>

          {/* Contexte de la simulation */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">
              Simulation
            </p>
            <p className="text-sm text-amber-900">{config.context}</p>
          </div>

          <Button className="w-full" onClick={() => setPhase("debrief")}>
            Voir ce qui s'est passé <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Phase 3 : débrief ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <Eye className="w-5 h-5 text-amber-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-fg-DEFAULT">
              Les 4 indices à repérer
            </h1>
            <p className="text-sm text-fg-muted mt-0.5">
              Voici comment reconnaître ce type d'attaque à l'avenir.
            </p>
          </div>
        </div>

        {/* Indices */}
        <div className="space-y-3">
          {config.redFlags.map((flag, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border bg-white p-4"
            >
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-risk-critical">{i + 1}</span>
              </div>
              <p className="text-sm text-fg-DEFAULT leading-relaxed">{flag}</p>
            </div>
          ))}
        </div>

        {/* Règle d'or */}
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-5">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-primary-800 mb-1">
                La règle d'or en cas de doute
              </p>
              <p className="text-sm text-primary-700">
                Ne cliquez jamais sur un lien dans un email inattendu. Allez directement
                sur le site officiel en tapant l'adresse dans votre navigateur, ou
                contactez l'expéditeur supposé par téléphone.
              </p>
            </div>
          </div>
        </div>

        {/* Comment signaler */}
        <div className="rounded-lg border border-border bg-white p-5">
          <p className="text-sm font-semibold text-fg-DEFAULT mb-2">
            Comment signaler un email suspect ?
          </p>
          <ol className="text-sm text-fg-muted space-y-1.5 list-decimal list-inside">
            <li>N'ouvrez pas les pièces jointes ni les liens</li>
            <li>Transférez l'email à <strong>securite@sonabhy.bf</strong></li>
            <li>Ou utilisez le bouton "Signaler" dans Outlook</li>
            <li>Supprimez l'email de votre boîte</li>
          </ol>
        </div>

        {/* CTA : aller au module JIT ou retour dashboard */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => router.push("/employee")}
          >
            Continuer vers ma formation
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
          <p className="text-xs text-fg-subtle text-center">
            Un module de formation adapté a été ajouté à votre parcours.
          </p>
        </div>

        {/* Note de bas de page */}
        <p className="text-xs text-fg-subtle text-center pb-4">
          Merci d'avoir participé à cet entraînement. Votre score sera mis à jour cette nuit.
        </p>
      </div>
    </div>
  );
}
