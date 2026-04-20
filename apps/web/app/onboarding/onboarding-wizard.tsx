"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, BookOpen, BarChart3, CheckCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { completeOnboarding } from "./actions";

interface Props {
  userId: string;
  email: string;
  existingName: string;
}

type ConsentState = {
  phishing_simulation: boolean;
  behavior_analytics: boolean;
  individual_reporting: boolean;
};

const STEPS = ["bienvenue", "consentements", "profil", "confirmation"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingWizard({ userId, email, existingName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("bienvenue");
  const [fullName, setFullName] = useState(existingName);
  const [consents, setConsents] = useState<ConsentState>({
    phishing_simulation: false,
    behavior_analytics: false,
    individual_reporting: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function toggleConsent(key: keyof ConsentState) {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleFinish() {
    if (!fullName.trim()) {
      setError("Votre nom complet est requis.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const result = await completeOnboarding({ fullName, consents });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/employee");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-fg-subtle">
          <span>Étape {stepIndex + 1} sur {STEPS.length}</span>
          <span>{Math.round(progress)} %</span>
        </div>
        <div className="w-full h-1.5 bg-bg-muted rounded-full">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ─── ÉTAPE 1 : Bienvenue ─────────────────────────────── */}
      {step === "bienvenue" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <CardTitle>Bienvenue dans CyberGuard</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              Ce programme vous aide à reconnaître et déjouer les cyberattaques au quotidien.
              Simulations, formations courtes, et suivi de votre progression — tout est conçu
              pour votre contexte au Burkina Faso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {[
                {
                  icon: <Shield className="w-5 h-5 text-primary-600" />,
                  title: "Simulations réalistes",
                  desc: "Emails et SMS qui ressemblent à de vraies attaques (Orange Money, SONABHY RH, Ministère des Finances).",
                },
                {
                  icon: <BookOpen className="w-5 h-5 text-primary-600" />,
                  title: "Micro-formations rapides",
                  desc: "Modules de 3 à 8 minutes, adaptés à votre niveau et vos erreurs.",
                },
                {
                  icon: <BarChart3 className="w-5 h-5 text-primary-600" />,
                  title: "Score de vigilance",
                  desc: "Suivez votre progression et contribuez à la sécurité collective de SONABHY.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-3 rounded-md bg-bg-subtle">
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-fg-DEFAULT">{item.title}</p>
                    <p className="text-sm text-fg-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => setStep("consentements")}>
              Commencer <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── ÉTAPE 2 : Consentements (loi 010-2004 BF) ────────── */}
      {step === "consentements" && (
        <Card>
          <CardHeader>
            <CardTitle>Vos choix de participation</CardTitle>
            <CardDescription>
              Conformément à la loi burkinabè n° 010-2004/AN sur la protection des données
              personnelles, vous contrôlez ce à quoi vous participez. Ces choix peuvent être
              modifiés à tout moment dans votre profil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: "phishing_simulation" as const,
                label: "Simulations de phishing",
                description:
                  "Recevoir des emails/SMS de test simulant de vraies attaques. Fortement recommandé — c'est le cœur de la formation.",
                recommended: true,
              },
              {
                key: "behavior_analytics" as const,
                label: "Analyse comportementale",
                description:
                  "Enregistrer vos actions (clics, temps de réponse, signalements) pour calculer votre score de vigilance. Recommandé.",
                recommended: true,
              },
              {
                key: "individual_reporting" as const,
                label: "Rapport individuel accessible au RSSI",
                description:
                  "Autoriser le RSSI SONABHY à consulter votre rapport détaillé sur justification tracée. Facultatif — les rapports agrégés sont toujours disponibles.",
                recommended: false,
              },
            ].map(({ key, label, description, recommended }) => (
              <div
                key={key}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  consents[key]
                    ? "border-primary-500 bg-primary-50"
                    : "border-border bg-white hover:bg-bg-subtle"
                }`}
                onClick={() => toggleConsent(key)}
                role="checkbox"
                aria-checked={consents[key]}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && toggleConsent(key)}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    consents[key] ? "bg-primary-500 border-primary-500" : "border-border"
                  }`}
                >
                  {consents[key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg-DEFAULT">{label}</span>
                    {recommended && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-fg-muted mt-0.5">{description}</p>
                </div>
              </div>
            ))}

            <p className="text-xs text-fg-subtle">
              Vos données sont hébergées en Europe (Supabase EU-West). Aucune donnée n'est
              vendue ni partagée hors SONABHY.{" "}
              <a href="/politique-confidentialite" className="text-primary-600 hover:underline">
                Politique de confidentialité complète
              </a>
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("bienvenue")} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Retour
              </Button>
              <Button onClick={() => setStep("profil")} className="flex-1">
                Continuer <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── ÉTAPE 3 : Profil ────────────────────────────────── */}
      {step === "profil" && (
        <Card>
          <CardHeader>
            <CardTitle>Votre profil</CardTitle>
            <CardDescription>
              Ces informations permettent de personnaliser vos formations et de vous
              identifier dans les rapports agrégés.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Prénom NOM"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Adresse email</Label>
              <Input type="email" value={email} disabled className="bg-bg-subtle" />
              <p className="text-xs text-fg-subtle">Pré-remplie depuis votre invitation.</p>
            </div>

            {error && (
              <p className="text-sm text-risk-critical">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("consentements")} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Retour
              </Button>
              <Button
                onClick={() => setStep("confirmation")}
                disabled={!fullName.trim()}
                className="flex-1"
              >
                Vérifier <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── ÉTAPE 4 : Confirmation ──────────────────────────── */}
      {step === "confirmation" && (
        <Card>
          <CardHeader>
            <CardTitle>Tout est prêt ?</CardTitle>
            <CardDescription>
              Vérifiez vos choix avant de finaliser votre inscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Récapitulatif */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <p className="text-xs text-fg-subtle uppercase tracking-wide">Nom</p>
                <p className="text-sm font-medium text-fg-DEFAULT">{fullName}</p>
              </div>
              <div>
                <p className="text-xs text-fg-subtle uppercase tracking-wide">Email</p>
                <p className="text-sm text-fg-muted">{email}</p>
              </div>
              <div>
                <p className="text-xs text-fg-subtle uppercase tracking-wide mb-2">Consentements</p>
                <div className="space-y-1">
                  {[
                    ["Simulations phishing", consents.phishing_simulation],
                    ["Analyse comportementale", consents.behavior_analytics],
                    ["Rapport individuel RSSI", consents.individual_reporting],
                  ].map(([label, granted]) => (
                    <div key={label as string} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          granted ? "bg-green-100" : "bg-bg-muted"
                        }`}
                      >
                        {granted ? (
                          <CheckCircle className="w-3 h-3 text-risk-low" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-fg-subtle" />
                        )}
                      </div>
                      <span className={granted ? "text-fg-DEFAULT" : "text-fg-subtle"}>
                        {label as string} {granted ? "✓" : "(refusé)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-risk-critical">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("profil")} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Modifier
              </Button>
              <Button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Enregistrement…" : "Finaliser mon inscription"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
