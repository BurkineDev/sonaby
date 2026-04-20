/**
 * E2E — Export PDF rapport direction
 *
 * Scénarios couverts :
 *   1. Non authentifié → redirect /auth/login (pas de PDF)
 *   2. Employé (rôle user) → 403 Forbidden
 *   3. Admin authentifié → réponse 200 avec Content-Type: application/pdf
 *   4. Paramètre ?days= validé (jours hors plage → normalisé silencieusement)
 *   5. Le Content-Disposition contient le nom de fichier attendu
 *
 * Notes :
 *   - Les tests nécessitent des fixtures d'auth (adminPage, employeePage)
 *     définies dans fixtures/auth.ts.
 *   - Le fichier PDF n'est pas parsé — on vérifie le header magic (%PDF-)
 *     pour confirmer que le buffer est un vrai PDF.
 */

import { test, expect } from "@playwright/test";

const EXPORT_URL = "/admin/reports/export";
const TODAY = new Date().toISOString().split("T")[0]!;
const EXPECTED_FILENAME = `rapport-cyberguard-sonabhy-${TODAY}.pdf`;

// ─── Accès non authentifié ────────────────────────────────────────────────────

test.describe("PDF Export — Accès non authentifié", () => {
  test("GET /admin/reports/export sans session → redirect /auth/login", async ({ request }) => {
    const response = await request.get(EXPORT_URL, {
      maxRedirects: 0,
    });

    // Route handler redirige vers /auth/login (302)
    expect([301, 302, 307, 308]).toContain(response.status());
    const location = response.headers()["location"] ?? "";
    expect(location).toContain("/auth/login");
  });

  test("Navigateur non authentifié → page login (pas de PDF affiché)", async ({ page }) => {
    await page.goto(EXPORT_URL);
    // Doit atterrir sur la page de login, jamais servir le PDF
    await expect(page).toHaveURL(/\/auth\/login/);
    // Aucun lien PDF dans la page de login
    const body = await page.content();
    expect(body).not.toContain("%PDF-");
  });
});

// ─── Accès employé (rôle insuffisant) ────────────────────────────────────────

test.describe("PDF Export — Accès employé refusé (P0 sécurité)", () => {
  // Ces tests requièrent une session employé active.
  // Ils seront skippés si la fixture n'est pas configurée (CI sans seed).
  test.skip(
    !process.env.E2E_EMPLOYEE_EMAIL,
    "E2E_EMPLOYEE_EMAIL non défini — skip tests d'accès employé"
  );

  test("Employé → 403 sur /admin/reports/export", async ({ request }) => {
    // La fixture d'auth employé est injectée via la config Playwright
    // (storageState: 'e2e/fixtures/employee-session.json').
    // En l'absence de session pré-configurée, ce test est skippé ci-dessus.
    const response = await request.get(EXPORT_URL);
    expect(response.status()).toBe(403);

    const body = await response.text();
    expect(body).not.toContain("%PDF-");
    expect(body.toLowerCase()).toContain("autorisé");
  });
});

// ─── Admin — happy path ───────────────────────────────────────────────────────

test.describe("PDF Export — Admin (happy path)", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL,
    "E2E_ADMIN_EMAIL non défini — skip tests admin PDF"
  );

  test("Admin → 200, Content-Type: application/pdf", async ({ request }) => {
    const response = await request.get(EXPORT_URL);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });

  test("Admin → Content-Disposition avec nom de fichier daté", async ({ request }) => {
    const response = await request.get(EXPORT_URL);
    const cd = response.headers()["content-disposition"] ?? "";

    expect(cd).toContain("attachment");
    expect(cd).toContain(EXPECTED_FILENAME);
  });

  test("Admin → le buffer PDF commence par %PDF- (magic bytes)", async ({ request }) => {
    const response = await request.get(EXPORT_URL);
    const buffer = await response.body();

    // Vérification que le fichier est un vrai PDF
    const magic = buffer.slice(0, 5).toString("ascii");
    expect(magic).toBe("%PDF-");
  });

  test("Admin → ?days=90 fonctionne (période longue)", async ({ request }) => {
    const response = await request.get(`${EXPORT_URL}?days=90`);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");

    const buffer = await response.body();
    const magic = buffer.slice(0, 5).toString("ascii");
    expect(magic).toBe("%PDF-");
  });

  test("Admin → ?days=999 normalisé à 90 (pas d'erreur)", async ({ request }) => {
    // Le handler normalise days = Math.min(90, Math.max(7, days))
    const response = await request.get(`${EXPORT_URL}?days=999`);
    expect(response.status()).toBe(200);
  });

  test("Admin → Cache-Control: no-store (données temps réel)", async ({ request }) => {
    const response = await request.get(EXPORT_URL);
    const cc = response.headers()["cache-control"] ?? "";

    expect(cc).toContain("no-store");
  });

  test("Admin → X-Content-Type-Options: nosniff présent", async ({ request }) => {
    const response = await request.get(EXPORT_URL);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });
});

// ─── Validation paramètre ?days ───────────────────────────────────────────────

test.describe("PDF Export — Paramètre ?days (validation publique)", () => {
  // Ces tests vérifient le comportement sans auth → toujours redirect,
  // donc on peut les exécuter sans fixture d'auth.

  test("?days=abc → redirect login (pas de 500)", async ({ request }) => {
    const response = await request.get(`${EXPORT_URL}?days=abc`, {
      maxRedirects: 0,
    });
    // Pas d'erreur 5xx — le handler normalise les valeurs invalides
    expect(response.status()).not.toBeGreaterThanOrEqual(500);
  });

  test("?days=-1 → redirect login (pas de 500)", async ({ request }) => {
    const response = await request.get(`${EXPORT_URL}?days=-1`, {
      maxRedirects: 0,
    });
    expect(response.status()).not.toBeGreaterThanOrEqual(500);
  });
});
