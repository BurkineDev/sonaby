"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  User,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type LoginMode = "magic_link" | "password";
type LoadingTarget = "admin" | "employee" | "form" | null;

interface Props {
  redirect?: string;
  error?: string;
}

function getAuthErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "missing_code":
      return "Lien incomplet. Ouvrez le lien magique complet depuis votre email.";
    case "exchange_failed":
    case "otp_verification_failed":
      return "Lien expiré ou déjà utilisé. Demandez un nouveau lien de connexion.";
    case "no_user":
      return "Session non trouvée après validation. Réessayez avec un nouveau lien.";
    default:
      return "Session expirée ou lien invalide. Reconnectez-vous.";
  }
}

export function LoginForm({ redirect, error }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<LoginMode>("magic_link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingTarget, setLoadingTarget] = useState<LoadingTarget>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const redirectPath = redirect ?? "/";
  const demoAdminEmail = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL?.trim() ?? "";
  const demoAdminPassword = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD?.trim() ?? "";
  const demoEmployeeEmail = process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_EMAIL?.trim() ?? "";
  const demoEmployeePassword = process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_PASSWORD?.trim() ?? "";
  const canUseDemoAdmin = Boolean(demoAdminEmail && demoAdminPassword);
  const canUseDemoEmployee = Boolean(demoEmployeeEmail && demoEmployeePassword);
  const hasDemoConfig = canUseDemoAdmin || canUseDemoEmployee;

  function getSafeRedirectPath() {
    return redirectPath.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : "/";
  }

  function getAppOrigin() {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!configuredUrl) return window.location.origin;
    const urlWithProtocol = /^https?:\/\//i.test(configuredUrl)
      ? configuredUrl
      : `https://${configuredUrl}`;
    try {
      return new URL(urlWithProtocol).origin;
    } catch {
      return window.location.origin;
    }
  }

  function getMagicLinkRedirectUrl() {
    const callbackUrl = new URL("/auth/callback", getAppOrigin());
    callbackUrl.searchParams.set("redirect", getSafeRedirectPath());
    return callbackUrl.toString();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoadingTarget("form");

    startTransition(async () => {
      try {
        const { error: sendError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: getMagicLinkRedirectUrl() },
        });

        if (sendError) {
          setFeedback({ type: "error", message: "Erreur lors de l'envoi. Vérifiez votre adresse email." });
        } else {
          setFeedback({
            type: "success",
            message: "Lien de connexion envoyé sur votre messagerie SONABHY. Vérifiez vos spams si besoin.",
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: "Impossible d'envoyer le lien pour le moment. Réessayez dans quelques instants.",
        });
      } finally {
        setLoadingTarget(null);
      }
    });
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoadingTarget("form");

    startTransition(async () => {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        setFeedback({
          type: "error",
          message: "Identifiants incorrects. Utilisez le lien magique si vous avez oublié votre mot de passe.",
        });
        setLoadingTarget(null);
      } else {
        router.push(getSafeRedirectPath());
        router.refresh();
      }
    });
  }

  function handleDemoLogin(target: "admin" | "employee") {
    setFeedback(null);
    setLoadingTarget(target);

    const credentials =
      target === "admin"
        ? { email: demoAdminEmail, password: demoAdminPassword }
        : { email: demoEmployeeEmail, password: demoEmployeePassword };

    if (!credentials.email || !credentials.password) {
      setFeedback({
        type: "error",
        message: "Comptes de démo non configurés. Définissez les variables NEXT_PUBLIC_DEMO_* dans .env.local.",
      });
      setLoadingTarget(null);
      return;
    }

    startTransition(async () => {
      const { error: demoError } = await supabase.auth.signInWithPassword(credentials);

      if (demoError) {
        setFeedback({
          type: "error",
          message:
            target === "admin"
              ? "Connexion admin de démo impossible. Vérifiez les identifiants dans .env.local."
              : "Connexion employé de démo impossible. Vérifiez les identifiants dans .env.local.",
        });
        setLoadingTarget(null);
        return;
      }

      const fallbackPath = target === "admin" ? "/admin" : "/employee";
      const safeRedirectPath = getSafeRedirectPath();
      const finalPath =
        safeRedirectPath !== "/auth/login" && safeRedirectPath !== "/"
          ? safeRedirectPath
          : fallbackPath;

      router.push(finalPath);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Erreur URL */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{getAuthErrorMessage(error)}</span>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
            feedback.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Section Accès Démo ─────────────────────────────────────────── */}
      <Card className="border-2 overflow-hidden" style={{ borderColor: "rgba(201,139,26,0.40)" }}>
        {/* En-tête démo */}
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{
            backgroundColor: "rgba(232,162,40,0.09)",
            borderBottom: "1px solid rgba(201,139,26,0.20)",
          }}
        >
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: "#E8A228" }}
          >
            Démo
          </span>
          <p className="text-xs font-medium" style={{ color: "#C98B1A" }}>
            Accès rapide pour la présentation
          </p>
        </div>

        <CardContent className="p-3 space-y-2">
          {/* Bouton Admin / RSSI */}
          <button
            type="button"
            onClick={() => handleDemoLogin("admin")}
            disabled={isPending || !canUseDemoAdmin}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left"
            style={{
              backgroundColor: canUseDemoAdmin ? "rgba(22,48,97,0.05)" : "rgba(0,0,0,0.02)",
              borderColor: canUseDemoAdmin ? "#163061" : "#DDE2EE",
              cursor: canUseDemoAdmin ? "pointer" : "not-allowed",
              opacity: (!canUseDemoAdmin || (isPending && loadingTarget !== "admin")) ? 0.55 : 1,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: canUseDemoAdmin
                  ? "linear-gradient(135deg, #163061, #1F3F7A)"
                  : "#E4E8F0",
              }}
            >
              {loadingTarget === "admin" ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : canUseDemoAdmin ? (
                <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold"
                style={{ color: canUseDemoAdmin ? "#163061" : "#9CA3AF" }}
              >
                RSSI / Administrateur
              </p>
              <p className="text-xs text-gray-400 truncate">
                Tableau de bord direction · Campagnes · Rapports
              </p>
            </div>
            {canUseDemoAdmin && loadingTarget !== "admin" && (
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "#163061" }} aria-hidden="true" />
            )}
          </button>

          {/* Bouton Employé */}
          <button
            type="button"
            onClick={() => handleDemoLogin("employee")}
            disabled={isPending || !canUseDemoEmployee}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left"
            style={{
              backgroundColor: canUseDemoEmployee ? "rgba(232,162,40,0.06)" : "rgba(0,0,0,0.02)",
              borderColor: canUseDemoEmployee ? "#C98B1A" : "#DDE2EE",
              cursor: canUseDemoEmployee ? "pointer" : "not-allowed",
              opacity: (!canUseDemoEmployee || (isPending && loadingTarget !== "employee")) ? 0.55 : 1,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: canUseDemoEmployee
                  ? "linear-gradient(135deg, #E8A228, #C98B1A)"
                  : "#E4E8F0",
              }}
            >
              {loadingTarget === "employee" ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : canUseDemoEmployee ? (
                <User className="w-4 h-4 text-white" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold"
                style={{ color: canUseDemoEmployee ? "#C98B1A" : "#9CA3AF" }}
              >
                Employé SONABHY
              </p>
              <p className="text-xs text-gray-400 truncate">
                Score de vigilance · Modules · Parcours de formation
              </p>
            </div>
            {canUseDemoEmployee && loadingTarget !== "employee" && (
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "#C98B1A" }} aria-hidden="true" />
            )}
          </button>

          {!hasDemoConfig && (
            <p className="text-xs text-center pt-1 text-gray-400">
              Configurez{" "}
              <code className="px-1 py-0.5 rounded bg-gray-100 font-mono text-gray-600">
                NEXT_PUBLIC_DEMO_*
              </code>{" "}
              dans{" "}
              <code className="px-1 py-0.5 rounded bg-gray-100 font-mono text-gray-600">
                .env.local
              </code>{" "}
              pour activer l'accès rapide.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Séparateur collapsible ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: "#DDE2EE" }} />
        <button
          type="button"
          onClick={() => {
            setShowEmailForm(!showEmailForm);
            setFeedback(null);
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors select-none"
        >
          {showEmailForm ? (
            <>
              Masquer <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              Connexion par email <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </>
          )}
        </button>
        <div className="h-px flex-1" style={{ backgroundColor: "#DDE2EE" }} />
      </div>

      {/* ── Formulaire email (collapsible) ────────────────────────────── */}
      {showEmailForm && (
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <form
              onSubmit={mode === "magic_link" ? handleMagicLink : handlePasswordLogin}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse email professionnelle</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="prenom.nom@sonabhy.bf"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              {mode === "password" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending}
                    minLength={12}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending || !email}>
                {loadingTarget === "form" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {mode === "magic_link"
                  ? loadingTarget === "form"
                    ? "Envoi en cours…"
                    : "Recevoir le lien de connexion"
                  : loadingTarget === "form"
                  ? "Connexion…"
                  : "Se connecter"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "magic_link" ? "password" : "magic_link");
                  setFeedback(null);
                }}
                className="text-sm text-primary-600 hover:underline focus:outline-none"
              >
                {mode === "magic_link"
                  ? "Utiliser mon mot de passe à la place"
                  : "Recevoir un lien de connexion par email"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
