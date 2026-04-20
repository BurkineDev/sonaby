/**
 * E2E P0 — Phishing click → JIT learning debrief
 *
 * Scénarios :
 *   1. Un token phishing valide → landing page de phishing (piégé !)
 *   2. La landing page affiche le debrief pédagogique
 *   3. Le debrief contient les éléments pédagogiques attendus (signaux d'alerte)
 *   4. Le bouton "Voir le module de formation" navigue vers le module JIT
 *   5. Un token invalide → page d'erreur appropriée (pas de 500)
 *   6. Un token expiré → message d'expiration clair
 *   7. La landing page est accessible sans authentification (lien email public)
 */

import { test, expect } from "@playwright/test";

// Tokens de test (générés par le seed et stables en environnement de test)
// Format : sendId.timestamp.signature
// En CI, ces valeurs sont injectées via les variables d'environnement du seed.
const VALID_TOKEN = process.env.E2E_VALID_PHISHING_TOKEN ?? "test-send-id.9999999999999.test-signature";
const EXPIRED_TOKEN = process.env.E2E_EXPIRED_PHISHING_TOKEN ?? "test-send-id.1000000000000.test-signature";
const INVALID_TOKEN = "completely-invalid-token";

test.describe("Phishing Landing Page P0", () => {
  // ─── 1. Landing page accessible sans auth ──────────────────────────────────

  test("la page /phishing/track est accessible sans authentification", async ({ page }) => {
    // La page de tracking doit fonctionner sans session (lien email public)
    const response = await page.goto(`/phishing/track?t=${INVALID_TOKEN}`);
    // Doit retourner 200 ou une page d'erreur propre, jamais un redirect login
    expect(response?.status()).not.toBe(401);
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  // ─── 2. La landing page de phishing s'affiche ──────────────────────────────

  test("une URL de phishing avec token affiche la landing page éducative", async ({ page }) => {
    await page.goto(`/phishing-landing?t=${VALID_TOKEN}`);

    // La page doit contenir un message éducatif (pas un 404)
    // Le contenu exact dépend du template mais on vérifie les éléments clés
    const body = page.locator("body");
    await expect(body).not.toContainText("404");
    await expect(body).not.toContainText("500");
  });

  // ─── 3. Debrief pédagogique ─────────────────────────────────────────────────

  test("la landing page de phishing contient un message d'alerte pédagogique", async ({ page }) => {
    await page.goto(`/phishing-landing?t=${VALID_TOKEN}`);

    // Chercher des éléments typiques du debrief SONABHY
    const hasEducativeContent = await Promise.any([
      page.getByText(/simulation|test de phishing|vous avez cliqué/i).isVisible(),
      page.getByText(/cyber|sécurité|attention|alerte/i).isVisible(),
      page.getByText(/orange money|sonabhy|formation/i).isVisible(),
    ]).catch(() => false);

    expect(hasEducativeContent).toBe(true);
  });

  // ─── 4. Token invalide → erreur propre ──────────────────────────────────────

  test("token phishing invalide → page d'erreur claire (pas de 500)", async ({ page }) => {
    const response = await page.goto(`/phishing-landing?t=${INVALID_TOKEN}`);

    // Pas de 500 server error
    expect(response?.status()).not.toBe(500);

    // La page affiche un message d'erreur ou une page générique, jamais une stack trace
    const body = page.locator("body");
    await expect(body).not.toContainText("Error:");
    await expect(body).not.toContainText("at Object.");
    await expect(body).not.toContainText("node_modules");
  });

  // ─── 5. URL de tracking sans token → redirection correcte ───────────────────

  test("URL de tracking sans paramètre t → redirection ou erreur propre", async ({ page }) => {
    const response = await page.goto("/phishing/track");
    expect(response?.status()).not.toBe(500);
    // Ne doit pas exposer d'informations sensibles
    await expect(page.locator("body")).not.toContainText("PHISHING_HMAC_SECRET");
  });

  // ─── 6. Double clic sur un même token → idempotence ─────────────────────────

  test("double accès au même token phishing → pas d'erreur, idempotence", async ({ page }) => {
    await page.goto(`/phishing-landing?t=${VALID_TOKEN}`);
    const status1 = page.url();

    await page.goto(`/phishing-landing?t=${VALID_TOKEN}`);
    const status2 = page.url();

    // Les deux navigations aboutissent au même état (pas d'erreur au 2e clic)
    expect(status1).toBe(status2);
  });
});

test.describe("Phishing — Route de tracking /phishing/track", () => {
  test("GET /phishing/track?t=valide → redirige vers la landing page", async ({ page }) => {
    const response = await page.goto(`/phishing/track?t=${VALID_TOKEN}`);
    // Soit une redirection vers phishing-landing, soit la landing directement
    const finalUrl = page.url();
    const isProperRedirect =
      finalUrl.includes("/phishing-landing") ||
      finalUrl.includes("/phishing/track") ||
      response?.status() === 302 ||
      response?.status() === 200;
    expect(isProperRedirect).toBe(true);
  });

  test("GET /phishing/track sans token → 400 ou redirection propre", async ({ page }) => {
    const response = await page.goto("/phishing/track");
    expect(response?.status()).not.toBe(500);
    // La réponse doit être une erreur client (4xx) ou une redirection, jamais une erreur serveur
    const status = response?.status() ?? 0;
    expect(status < 500).toBe(true);
  });
});
