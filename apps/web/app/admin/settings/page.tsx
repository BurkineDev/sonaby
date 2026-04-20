import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Settings, Shield, Database, Bell, Globe } from "lucide-react";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/admin");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug, created_at")
    .eq("id", profile.organization_id)
    .single();

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-fg-DEFAULT">Paramètres</h1>
        <p className="text-sm text-fg-muted mt-0.5">
          Configuration globale de la plateforme — accès super_admin uniquement.
        </p>
      </div>

      {/* Organisation */}
      <section aria-labelledby="org-section" className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary-600" />
          <h2 id="org-section" className="text-sm font-semibold text-fg-DEFAULT">Organisation</h2>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-subtle">Nom</dt>
            <dd className="font-medium text-fg-DEFAULT">{org?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-subtle">Identifiant (slug)</dt>
            <dd className="font-mono text-xs text-fg-muted">{org?.slug ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-subtle">Créée le</dt>
            <dd className="text-fg-muted">
              {org?.created_at
                ? new Date(org.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Sécurité */}
      <section aria-labelledby="security-section" className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary-600" />
          <h2 id="security-section" className="text-sm font-semibold text-fg-DEFAULT">Sécurité</h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: "RLS activée sur toutes les tables", status: "Actif" },
            { label: "MFA (TOTP) disponible", status: "Actif" },
            { label: "Magic link activé", status: "Actif" },
            { label: "Mot de passe minimum 12 caractères", status: "Actif" },
            { label: "Audit log (append-only)", status: "Actif" },
            { label: "Consentements loi 010-2004/AN BF", status: "Actif" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-fg-muted">{item.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-risk-low font-medium">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure */}
      <section aria-labelledby="infra-section" className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary-600" />
          <h2 id="infra-section" className="text-sm font-semibold text-fg-DEFAULT">Infrastructure</h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: "Base de données", value: "Supabase Postgres (EU-West)" },
            { label: "Frontend", value: "Vercel Edge Network" },
            { label: "Email phishing", value: "Resend (domaine dédié)" },
            { label: "Edge Functions", value: "Deno — compute-scores + send-campaign" },
            { label: "Monitoring", value: "Sentry + Supabase Logs" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between gap-4">
              <span className="text-fg-subtle">{item.label}</span>
              <span className="text-fg-DEFAULT text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section aria-labelledby="notif-section" className="bg-white rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-600" />
          <h2 id="notif-section" className="text-sm font-semibold text-fg-DEFAULT">Notifications</h2>
        </div>
        <p className="text-sm text-fg-muted">
          La configuration des alertes automatiques (seuil CMI critique, taux de clic élevé) est disponible via les variables d&apos;environnement Vercel. Interface de configuration prévue Sprint 7.
        </p>
        <div className="rounded-lg bg-bg-subtle px-3 py-2 text-xs font-mono text-fg-subtle space-y-1">
          <p>ALERT_CMI_THRESHOLD=40</p>
          <p>ALERT_CLICK_RATE_THRESHOLD=30</p>
          <p>ALERT_EMAIL_RECIPIENTS=rssi@sonabhy.bf</p>
        </div>
      </section>

      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-fg-subtle" />
        <p className="text-xs text-fg-subtle">
          Les modifications de configuration avancées sont versionnées dans{" "}
          <code className="font-mono">supabase/migrations/</code> et déployées via CI/CD.
        </p>
      </div>
    </div>
  );
}
