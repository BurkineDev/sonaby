import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { EmailOtpType } from "@supabase/supabase-js";

const OTP_TYPES = {
  magiclink: true,
  recovery: true,
  invite: true,
  email: true,
  email_change: true,
} as const;

function isEmailOtpType(value: string): value is EmailOtpType {
  return value in OTP_TYPES;
}

/**
 * Route Handler : callback OAuth/Magic Link Supabase Auth.
 * Échange le code PKCE pour une session, puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const redirectParam = searchParams.get("redirect") ?? "/";

  // Valider le redirect pour éviter les open redirects
  const safeRedirect = redirectParam.startsWith("/") ? redirectParam : "/";

  if (error) {
    logger.warn({ error, errorDescription }, "[Auth Callback] Erreur OAuth");
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`);
  }

  const supabase = await createClient();

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logger.error({ error: exchangeError.message }, "[Auth Callback] Échec échange code");
      return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
    }
  } else if (tokenHash && typeParam && isEmailOtpType(typeParam)) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam,
    });

    if (verifyError) {
      logger.error({ error: verifyError.message }, "[Auth Callback] Échec vérification OTP magic link");
      return NextResponse.redirect(`${origin}/auth/login?error=otp_verification_failed`);
    }
  } else {
    logger.warn({ codePresent: Boolean(code), tokenHashPresent: Boolean(tokenHash), typeParam }, "[Auth Callback] Paramètres de callback manquants");
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  // Récupérer le profil pour voir si l'onboarding est terminé
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_done, role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_done) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  logger.info({ userId: user.id }, "[Auth Callback] Connexion réussie");
  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
