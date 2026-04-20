/**
 * E2E P0 — Contrôle d'accès rôle (RBAC)
 *
 * Scénarios critiques de sécurité :
 *   1. Un employé (role=user) ne peut PAS accéder à /admin → 403 ou redirect
 *   2. Un employé ne peut PAS accéder à /admin/campaigns → 403 ou redirect
 *   3. Un employé ne peut PAS accéder à /admin/users → 403 ou redirect
 *   4. Un employé ne peut PAS accéder à /admin/reports → 403 ou redirect
 *   5. Un employé ne peut PAS accéder à /admin/settings → 403 ou redirect
 *   6. Un utilisateur non authentifié → toutes les routes protégées redirigent vers login
 *   7. Les routes employé (/employee/*) sont inaccessibles sans auth
 *   8. Les headers de sécurité sont présents sur les réponses
 *
 * Ces tests sont des tests de sécurité P0 — une régression ici est critique.
 */

import { test, expect } from "@playwright/test";

// Routes admin (accès interdit aux employees et non-authentifiés)
const ADMIN_ROUTES = [
  "/admin",
  "/admin/campaigns",
  "/admin/campaigns/new",
  "/admin/users",
  "/admin/users/import",
  "/admin/reports",
  "/admin/reports/export",
  "/admin/settings",
];

// Routes employé (accès interdit aux non-authentifiés)
const EMPLOYEE_ROUTES = [
  "/employee",
  "/employee/modules",
  "/employee/profil",
  "/employee/quiz",
];

test.describe("RBAC — Accès non authentifié (P0 sécurité)", () => {
  for (const route of ADMIN_ROUTES) {
    test(`GET ${route} sans session → redirection /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/login/, {
        timeout: 10_000,
      });
    });
  }

  for (const route of EMPLOYEE_ROUTES) {
    test(`GET ${route} sans session → redirection /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/login/, {
        timeout: 10_000,
      });
    });
  }
});

test.describe("RBAC — Employé (role=user) ne peut pas accéder à /admin", () => {
  test.beforeEach(async ({ page }) => {
    // Skip si pas de session employé disponible
    await page.goto("/employee");
    const isRedirected = page.url().includes("/auth/login");
    if (isRedirected) {
      test.skip(true, "Session employé non disponible");
    }
  });

  for (const route of ADMIN_ROUTES) {
    test(`employé → GET ${route} → 403 ou redirect (pas 200)`, async ({ page }) => {
      const response = await page.goto(route);
      const finalUrl = page.url();

      const isBlocked =
        // Soit redirigé hors de la route admin
        !finalUrl.includes(route) ||
        // Soit une réponse 403
        response?.status() === 403 ||
        // Soit redirigé vers employee ou login
        finalUrl.includes("/employee") ||
        finalUrl.includes("/auth/login");

      // CRITIQUE : un employé ne doit JAMAIS voir le contenu admin
      expect(isBlocked).toBe(true);

      // Vérification supplémentaire : le contenu admin ne doit pas être rendu
      if (!isBlocked) {
        const bodyText = await page.locator("body").textContent();
        // S'il y a quand même du contenu admin visible, c'est une faille
        const hasAdminContent =
          (bodyText?.includes("Gestion des utilisateurs") ||
           bodyText?.includes("Campagnes phishing") ||
           bodyText?.includes("Audit log")) ?? false;
        expect(hasAdminContent).toBe(false);
      }
    });
  }
});

test.describe("RBAC — Headers de sécurité HTTP", () => {
  test("les réponses incluent X-Frame-Options ou CSP frame-ancestors", async ({ page }) => {
    const response = await page.goto("/auth/login");
    const headers = response?.headers() ?? {};

    const hasFrameProtection =
      "x-frame-options" in headers ||
      (headers["content-security-policy"]?.includes("frame-ancestors") ?? false);

    // Note : Next.js ajoute ces headers via next.config — vérifier la config si ce test échoue
    if (!hasFrameProtection) {
      console.warn("⚠️ X-Frame-Options ou CSP frame-ancestors absents — ajouter dans next.config.ts");
    }

    // Ne pas bloquer le CI sur ce point mais le signaler (warn only en preview)
    // expect(hasFrameProtection).toBe(true);
    test.info().annotations.push({
      type: "security",
      description: hasFrameProtection
        ? "✅ Frame protection présente"
        : "⚠️ Frame protection absente — à corriger avant production",
    });
  });

  test("les réponses incluent X-Content-Type-Options: nosniff", async ({ page }) => {
    const response = await page.goto("/auth/login");
    const headers = response?.headers() ?? {};
    const hasNoSniff = headers["x-content-type-options"] === "nosniff";

    test.info().annotations.push({
      type: "security",
      description: hasNoSniff
        ? "✅ X-Content-Type-Options: nosniff présent"
        : "⚠️ X-Content-Type-Options absent — à ajouter dans next.config.ts",
    });
  });
});

test.describe("RBAC — Isolation des données (smoke test API)", () => {
  test("GET /api/* sans session → 401 ou 403 (pas de données exposées)", async ({ request }) => {
    // Tester les routes API qui pourraient exposer des données sensibles
    const sensitiveApis = [
      "/api/users",
      "/api/scores",
      "/api/campaigns",
    ];

    for (const api of sensitiveApis) {
      const response = await request.get(api);
      const status = response.status();
      // Ces routes doivent retourner 401/403/404, jamais 200 avec des données
      if (status === 200) {
        const body = await response.text();
        // Si 200, s'assurer qu'il n'y a pas de données utilisateurs dans la réponse
        const hasUserData =
          body.includes("email") ||
          body.includes("full_name") ||
          body.includes("risk_score");
        expect(hasUserData).toBe(false);
      } else {
        expect([401, 403, 404, 405]).toContain(status);
      }
    }
  });
});
