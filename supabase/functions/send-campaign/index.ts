/**
 * Edge Function: send-campaign
 *
 * Envoie une campagne de simulation phishing approuvée.
 * Déclenché par pg_cron à l'heure planifiée, ou manuellement par un admin.
 *
 * Flux :
 * 1. Récupérer la campagne et les utilisateurs cibles
 * 2. Générer un send_token HMAC unique par user
 * 3. Insérer phishing_sends
 * 4. Envoyer via Resend (ou SES fallback)
 * 5. Mettre à jour le statut campagne
 *
 * Sécurité :
 * - Service role uniquement
 * - Vérifier que les users ont consenti à phishing_simulation
 * - Tokens HMAC non-devinables
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const PHISHING_HMAC_SECRET = Deno.env.get("PHISHING_HMAC_SECRET")!;
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://cyberguard.sonabhy.bf";
const PHISHING_TRACKING_BASE_URL =
  Deno.env.get("PHISHING_TRACKING_BASE_URL") ?? APP_URL;

// ─── Génération du token HMAC ─────────────────────────────────────────────────

async function generateSendToken(sendId: string, userId: string): Promise<string> {
  const timestamp = Date.now();
  const message = `${sendId}|${userId}|${timestamp}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PHISHING_HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${sendId}.${timestamp}.${b64}`;
}

// ─── Personnalisation de l'email ─────────────────────────────────────────────

function personalizeBody(
  bodyHtml: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    bodyHtml
  );
}

// ─── Handler principal ────────────────────────────────────────────────────────

interface SendCampaignPayload {
  campaign_id: string;
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: SendCampaignPayload;
  try {
    payload = (await req.json()) as SendCampaignPayload;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { campaign_id } = payload;
  if (!campaign_id) {
    return new Response("campaign_id requis", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  // 1. Récupérer la campagne
  const { data: campaign, error: campaignError } = await supabase
    .from("phishing_campaigns")
    .select(`
      id, name, status, target_cohort_filter, organization_id,
      phishing_templates(
        id, name, channel, subject, body_html, body_text,
        sender_name, sender_email, landing_page_slug, difficulty, topic_tags
      )
    `)
    .eq("id", campaign_id)
    .eq("status", "scheduled")
    .single();

  if (campaignError || !campaign) {
    console.error("[send-campaign] Campagne introuvable ou non planifiée:", campaign_id);
    return new Response("Campaign not found or not scheduled", { status: 404 });
  }

  const template = campaign.phishing_templates as {
    id: string;
    channel: string;
    subject: string | null;
    body_html: string | null;
    sender_name: string | null;
    sender_email: string | null;
    landing_page_slug: string | null;
    difficulty: string;
  } | null;

  if (!template || template.channel !== "email") {
    console.error("[send-campaign] Seul le canal email est supporté en v1");
    return new Response("Only email channel supported in v1", { status: 400 });
  }

  // 2. Identifier les utilisateurs cibles avec consentement
  const cohortFilter = campaign.target_cohort_filter as {
    departments?: string[];
    roles?: string[];
    sites?: string[];
  };

  let usersQuery = supabase
    .from("profiles")
    .select("id, email, full_name, department_id, role, site")
    .eq("organization_id", campaign.organization_id)
    .eq("is_active", true)
    .not("enrolled_at", "is", null);

  if (cohortFilter.departments && cohortFilter.departments.length > 0) {
    usersQuery = usersQuery.in("department_id", cohortFilter.departments);
  }
  if (cohortFilter.roles && cohortFilter.roles.length > 0) {
    usersQuery = usersQuery.in("role", cohortFilter.roles);
  }
  if (cohortFilter.sites && cohortFilter.sites.length > 0) {
    usersQuery = usersQuery.in("site", cohortFilter.sites);
  }

  const { data: allUsers } = await usersQuery;
  if (!allUsers || allUsers.length === 0) {
    console.warn("[send-campaign] Aucun utilisateur éligible");
    return new Response("No eligible users", { status: 200 });
  }

  // Filtrer uniquement les users ayant consenti aux simulations phishing
  const { data: consentedUsers } = await supabase
    .from("security_consents")
    .select("user_id")
    .eq("scope", "phishing_simulation")
    .eq("granted", true)
    .in("user_id", allUsers.map((u) => u.id));

  const consentedIds = new Set((consentedUsers ?? []).map((c) => c.user_id));
  const eligibleUsers = allUsers.filter((u) => consentedIds.has(u.id));

  console.log(
    `[send-campaign] ${eligibleUsers.length}/${allUsers.length} utilisateurs éligibles (consentement vérifié)`
  );

  // Marquer la campagne comme "running"
  await supabase
    .from("phishing_campaigns")
    .update({ status: "running", sent_at: new Date().toISOString() })
    .eq("id", campaign_id);

  let sent = 0;
  let failed = 0;

  // 3. Envoyer un email par user
  for (const user of eligibleUsers) {
    try {
      // Créer le send record avec un token temporaire
      const { data: sendRecord, error: sendError } = await supabase
        .from("phishing_sends")
        .insert({
          campaign_id,
          user_id: user.id,
          send_token: crypto.randomUUID(), // token temporaire
        })
        .select("id")
        .single();

      if (sendError || !sendRecord) {
        console.error(`[send-campaign] Erreur création send pour ${user.id}:`, sendError);
        failed++;
        continue;
      }

      // Générer le vrai token HMAC
      const token = await generateSendToken(sendRecord.id, user.id);

      // Mettre à jour avec le vrai token
      await supabase
        .from("phishing_sends")
        .update({ send_token: token, sent_at: new Date().toISOString() })
        .eq("id", sendRecord.id);

      // Construire l'URL de tracking
      const clickUrl = `${PHISHING_TRACKING_BASE_URL}/phishing/click?token=${encodeURIComponent(token)}`;

      // Personnaliser le body
      const body = personalizeBody(template.body_html ?? "", {
        prenom: user.full_name.split(" ")[0] ?? user.full_name,
        nom: user.full_name,
        email: user.email,
        click_url: clickUrl,
        action_url: clickUrl,
      });

      // Envoyer via Resend
      const { error: emailError } = await resend.emails.send({
        from: `${template.sender_name ?? "SONABHY"} <${template.sender_email ?? "noreply@sonabhy-info.com"}>`,
        to: user.email,
        subject: template.subject ?? "Information importante",
        html: body,
      });

      if (emailError) {
        console.error(`[send-campaign] Erreur envoi email ${user.email}:`, emailError);
        await supabase
          .from("phishing_sends")
          .update({ bounced: true })
          .eq("id", sendRecord.id);
        failed++;
      } else {
        // Enregistrer l'événement 'delivered'
        await supabase.from("phishing_events").insert({
          send_id: sendRecord.id,
          user_id: user.id,
          campaign_id,
          event_type: "delivered",
        });
        sent++;
      }
    } catch (err) {
      console.error(`[send-campaign] Exception pour ${user.id}:`, err);
      failed++;
    }
  }

  // 4. Marquer la campagne terminée si tous envoyés
  if (failed === 0) {
    await supabase
      .from("phishing_campaigns")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", campaign_id);
  }

  const result = { campaign_id, eligible: eligibleUsers.length, sent, failed };
  console.log("[send-campaign] Résultat:", result);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
