import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { Flame, Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Connexion — CyberGuard SONABHY",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      className="min-h-screen flex"
      style={{ backgroundColor: "#F8F9FC" }}
    >
      {/* ── Panneau gauche : branding SONABHY (desktop) ───────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0B1933 0%, #163061 50%, #1F3F7A 100%)",
        }}
      >
        {/* Motif décoratif */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, #C98B1A 0%, transparent 50%), radial-gradient(circle at 80% 20%, #2F5696 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
          >
            <Flame className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">CyberGuard</p>
            <p className="text-xs font-semibold" style={{ color: "#E8A228" }}>
              SONABHY
            </p>
          </div>
        </div>

        {/* Accroche centrale */}
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Protéger SONABHY,<br />
            <span style={{ color: "#E8A228" }}>ensemble.</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Programme de sensibilisation cybersécurité — Lot 2.<br />
            Renforcez vos réflexes, réduisez les risques humains.
          </p>

          {/* Avantages clés */}
          <div className="space-y-3">
            {[
              "Simulations phishing contextualisées",
              "Modules adaptés au terrain burkinabè",
              "Score de vigilance personnalisé",
            ].map((txt) => (
              <div key={txt} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(201,139,26,0.25)", border: "1px solid rgba(201,139,26,0.40)" }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E8A228" }} />
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{txt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer branding */}
        <div className="relative">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
            © 2026 WendTech · Marché Lot 2 SONABHY · Confidentiel
          </p>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Retour page d'accueil */}
        <div className="w-full max-w-sm mb-6">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Logo mobile uniquement */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8A228, #C98B1A)" }}
          >
            <Flame className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-bold text-fg-DEFAULT">CyberGuard</p>
            <p className="text-xs font-medium" style={{ color: "#C98B1A" }}>SONABHY</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Titre connexion */}
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-3">
              <Shield
                className="w-5 h-5"
                style={{ color: "#163061" }}
                aria-hidden="true"
              />
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "#163061" }}
              >
                Accès sécurisé
              </span>
            </div>
            <h2 className="text-2xl font-bold text-fg-DEFAULT">
              Connexion
            </h2>
            <p className="text-sm text-fg-muted mt-1">
              Accédez à votre espace personnel SONABHY.
            </p>
          </div>

          {/* Formulaire */}
          <LoginForm
            {...(params.redirect ? { redirect: params.redirect } : {})}
            {...(params.error ? { error: params.error } : {})}
          />

          {/* Support */}
          <p className="mt-8 text-xs text-fg-subtle text-center">
            Problème de connexion ? Contactez la{" "}
            <span className="font-medium text-fg-muted">DSI SONABHY</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
