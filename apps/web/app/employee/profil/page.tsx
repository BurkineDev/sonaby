import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { ConsentToggle } from "./consent-toggle";
import { Shield, Info, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon profil" };
export const dynamic = "force-dynamic";

const CONSENT_META = {
  phishing_simulation: {
    label: "Simulations de phishing",
    description:
      "Autoriser SONABHY à m'envoyer de faux emails de phishing pour tester ma vigilance et déclencher des formations ciblées.",
    recommended: true,
  },
  behavior_analytics: {
    label: "Analyse comportementale",
    description:
      "Autoriser l'analyse de mon comportement sur la plateforme (temps de lecture, résultats des quiz) pour personnaliser mon parcours.",
    recommended: true,
  },
  individual_reporting: {
    label: "Rapport individuel",
    description:
      "Autoriser le RSSI à consulter mes indicateurs individuels dans le cadre d'un suivi personnalisé justifié.",
    recommended: false,
  },
} as const;

type ConsentScope = keyof typeof CONSENT_META;

export default async function ProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: consents }, { data: lastScore }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, role, onboarding_done, created_at")
        .eq("id", user.id)
        .single(),

      // Tous les consentements de l'utilisateur, ordonnés par date
      supabase
        .from("security_consents")
        .select("scope, granted, granted_at")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false }),

      supabase
        .from("risk_scores")
        .select("score, snapshot_date")
        .eq("user_id", user.id)
        .order("snapshot_date", { ascending: false })
        .limit(1),
    ]);

  // Calculer l'état actif de chaque consentement (dernier enregistrement par scope)
  const activeConsents: Record<ConsentScope, { granted: boolean; date: string | null }> = {
    phishing_simulation: { granted: false, date: null },
    behavior_analytics: { granted: false, date: null },
    individual_reporting: { granted: false, date: null },
  };

  if (consents) {
    (["phishing_simulation", "behavior_analytics", "individual_reporting"] as ConsentScope[]).forEach(
      (scope) => {
        const latest = consents.find((c) => c.scope === scope);
        if (latest) {
          activeConsents[scope] = {
            granted: latest.granted,
            date: latest.granted_at,
          };
        }
      }
    );
  }

  const memberSince = profile?.created_at
    ? formatDate(profile.created_at)
    : "—";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-8 md:ml-56">
      <h1 className="text-2xl font-semibold text-fg-DEFAULT">Mon profil</h1>

      {/* Informations personnelles */}
      <section aria-labelledby="profile-section">
        <h2 id="profile-section" className="text-base font-semibold text-fg-DEFAULT mb-4">
          Informations personnelles
        </h2>
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <ProfileForm
            fullName={profile?.full_name ?? ""}
            email={profile?.email ?? user.email ?? ""}
          />
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-fg-subtle">
            <span>Membre depuis : {memberSince}</span>
            <span className="capitalize">Rôle : {profile?.role ?? "—"}</span>
          </div>
        </div>
      </section>

      {/* Score */}
      {lastScore?.[0] && (
        <section className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-fg-subtle uppercase tracking-wide font-medium">
                Votre Risk Score actuel
              </p>
              <p className="text-4xl font-bold font-mono text-fg-DEFAULT mt-1">
                {lastScore[0].score}
                <span className="text-lg text-fg-muted"> / 100</span>
              </p>
              <p className="text-xs text-fg-subtle mt-1">
                Mis à jour le {formatDate(lastScore[0].snapshot_date)}
              </p>
            </div>
            <a
              href="/employee/score"
              className="text-sm text-primary-600 hover:underline"
            >
              Voir l&apos;historique →
            </a>
          </div>
        </section>
      )}

      {/* Consentements */}
      <section aria-labelledby="consent-section">
        <div className="flex items-center gap-2 mb-4">
          <h2 id="consent-section" className="text-base font-semibold text-fg-DEFAULT">
            Gestion des consentements
          </h2>
          <Shield className="w-4 h-4 text-primary-600" />
        </div>

        <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 flex gap-2 text-xs text-primary-800 mb-4">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary-600" />
          <span>
            Conformément à la loi 010-2004/AN BF, vous pouvez retirer votre consentement à tout moment. Les modifications prennent effet immédiatement.
          </span>
        </div>

        <div className="space-y-3">
          {(["phishing_simulation", "behavior_analytics", "individual_reporting"] as ConsentScope[]).map(
            (scope) => {
              const meta = CONSENT_META[scope];
              const current = activeConsents[scope];
              return (
                <ConsentToggle
                  key={scope}
                  scope={scope}
                  label={meta.label}
                  description={
                    current.date
                      ? `${meta.description} Dernière modification : ${formatDate(current.date)}`
                      : meta.description
                  }
                  isGranted={current.granted}
                  recommended={meta.recommended}
                />
              );
            }
          )}
        </div>
      </section>

      {/* Déconnexion */}
      <section>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-2 text-sm text-fg-muted hover:text-risk-high transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  );
}
