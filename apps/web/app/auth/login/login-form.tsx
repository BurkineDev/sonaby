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

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
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
        router.push(redirectPath);
        router.refresh();
      }
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
            <span>Session expirée ou lien invalide. Reconnectez-vous.</span>
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
      </CardContent>
    </Card>
  );
}
