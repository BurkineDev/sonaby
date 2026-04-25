"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";

type LoginMode = "magic_link" | "password";

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

  function getSafeRedirectPath() {
    return redirectPath.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : "/";
  }

  function getAppOrigin() {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (!configuredUrl) {
      return window.location.origin;
    }

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

    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: getMagicLinkRedirectUrl(),
          },
        });

        if (error) {
          setFeedback({ type: "error", message: "Erreur lors de l'envoi. Vérifiez votre adresse email." });
        } else {
          setFeedback({
            type: "success",
            message: "Lien de connexion envoyé sur votre messagerie SONABHY. Vérifiez vos spams si besoin.",
          });
        }
      } catch (err) {
        console.error("[Login] Magic link error:", err);
        setFeedback({
          type: "error",
          message: "Impossible d'envoyer le lien pour le moment. Réessayez dans quelques instants.",
        });
      }
    });
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setFeedback({
          type: "error",
          message: "Identifiants incorrects. Utilisez le lien magique si vous avez oublié votre mot de passe.",
        });
      } else {
        router.push(getSafeRedirectPath());
        router.refresh();
      }
    });
  }

  function handleDemoLogin(target: "admin" | "employee") {
    setFeedback(null);

    const credentials =
      target === "admin"
        ? { email: demoAdminEmail, password: demoAdminPassword }
        : { email: demoEmployeeEmail, password: demoEmployeePassword };

    if (!credentials.email || !credentials.password) {
      setFeedback({
        type: "error",
        message: "Comptes de démo non configurés. Définissez les variables NEXT_PUBLIC_DEMO_*.",
      });
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        setFeedback({
          type: "error",
          message:
            target === "admin"
              ? "Connexion admin de démo impossible. Vérifiez les identifiants de démo."
              : "Connexion employé de démo impossible. Vérifiez les identifiants de démo.",
        });
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
    <Card className="shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Connexion</CardTitle>
        <CardDescription>
          {mode === "magic_link"
            ? "Recevez un lien de connexion par email — aucun mot de passe requis."
            : "Connectez-vous avec votre email et mot de passe."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Feedback */}
        {feedback && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-md p-3 mb-4 text-sm ${
              feedback.type === "error"
                ? "bg-red-50 text-risk-critical border border-red-200"
                : "bg-green-50 text-risk-low border border-green-200"
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

        {/* Erreur URL */}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md p-3 mb-4 text-sm bg-red-50 text-risk-critical border border-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{getAuthErrorMessage(error)}</span>
          </div>
        )}

        {/* Formulaire */}
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

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !email}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {mode === "magic_link"
              ? isPending
                ? "Envoi en cours…"
                : "Recevoir le lien de connexion"
              : isPending
              ? "Connexion…"
              : "Se connecter"}
          </Button>
        </form>

        {/* Toggle mode */}
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

        {(canUseDemoAdmin || canUseDemoEmployee) && (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs text-fg-subtle mb-3 text-center">Accès rapide démo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {canUseDemoEmployee && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleDemoLogin("employee")}
                >
                  Entrer côté Employé
                </Button>
              )}
              {canUseDemoAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleDemoLogin("admin")}
                >
                  Entrer côté Admin
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
