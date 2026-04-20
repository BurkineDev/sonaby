import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Route Handler : callback OAuth/Magic Link Supabase Auth.
 * Échange le code PKCE pour une session, puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const redirectParam = searchParams.get("redirect") ?? "/";

  // Valider le redirect pour éviter les open redirects
  const safeRedirect = redirectParam.startsWith("/") ? redirectParam : "/";

  if (error) {
    logger.warn({ error, errorDescription }, "[Auth Callback] Erreur OAuth");
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    logger.warn("[Auth Callback] Code PKCE manquant");
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    logger.error({ error: exchangeError.message }, "[Auth Callback] Échec échange code");
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
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
