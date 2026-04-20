import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Route de tracking phishing : /phishing/click?token=...
 *
 * Flux :
 * 1. Récupérer le send_token depuis la DB (pas de calcul HMAC ici — le token est opaque)
 * 2. Enregistrer l'événement 'clicked' dans phishing_events
 * 3. Le trigger JIT Learning crée automatiquement un module_completion
 * 4. Rediriger vers la landing page factice (puis debrief)
 *
 * Sécurité :
 * - Le token est cherché tel quel en DB (colonne unique, indexée)
 * - Une fois un 'clicked' enregistré, les doublons sont ignorés
 * - Pas de PII dans les logs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    logger.warn("[Phishing Click] Token manquant");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Utiliser le service_role exclusivement côté serveur (Edge Function ou Route Handler)
  // Ici : on utilise le client server pour insérer les événements via une fonction SQL sécurisée
  const supabase = await createClient();

  // Chercher le send correspondant au token
  const { data: send, error: sendError } = await supabase
    .from("phishing_sends")
    .select("id, user_id, campaign_id, phishing_campaigns(template_id, phishing_templates(landing_page_slug))")
    .eq("send_token", token)
    .single();

  if (sendError || !send) {
    logger.warn({ token: token.slice(0, 8) + "…" }, "[Phishing Click] Token invalide");
    // Rediriger vers l'accueil sans révéler que le token était invalide
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Enregistrer l'événement 'clicked' (le trigger JIT s'exécute automatiquement en DB)
  const { error: eventError } = await supabase.from("phishing_events").insert({
    send_id: send.id,
    user_id: send.user_id,
    campaign_id: send.campaign_id,
    event_type: "clicked",
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  if (eventError) {
    logger.error(
      { sendId: send.id, error: eventError.message },
      "[Phishing Click] Erreur insertion événement"
    );
  } else {
    logger.info({ sendId: send.id }, "[Phishing Click] Événement 'clicked' enregistré");
  }

  // Récupérer le slug de la landing page
  const campaign = send.phishing_campaigns as unknown as {
    template_id: string;
    phishing_templates: { landing_page_slug: string | null } | null;
  } | null;
  const landingSlug = campaign?.phishing_templates?.landing_page_slug ?? "default";

  // Rediriger vers la landing page factice (3 secondes de crédibilité, puis debrief)
  const landingUrl = new URL(`/phishing-landing/${landingSlug}`, request.url);
  landingUrl.searchParams.set("send", send.id);
  return NextResponse.redirect(landingUrl);
}
