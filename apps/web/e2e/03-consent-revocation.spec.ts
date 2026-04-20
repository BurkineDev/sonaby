/**
 * E2E P0 — Gestion des consentements (profil employé)
 *
 * Scénarios :
 *   1. La page /employee/profil est protégée (redirect login sans session)
 *   2. Les 3 toggles de consentement sont présents et accessibles
 *   3. Les toggles ont des attributs ARIA corrects (role=switch, aria-checked)
 *   4. Activer un consentement → toggle passe à ON sans rechargement
 *   5. Le changement de consentement persiste après rechargement de page
 *   6. Le profil affiche le nom de l'utilisateur (formulaire de nom)
 *   7. Modifier le nom → mise à jour sans erreur
 *
 * Note : Ces tests nécessitent une session employé authentifiée.
 * En l'absence de session, les tests are skipped avec un message.
 */

import { test, expect } from "@playwright/test";

const CONSENT_SCOPES = ["phishing_simulation", "score_visibility", "anonymous_benchmark"];

test.describe("Consentements — /employee/profil (sans session)", () => {
  test("accès sans session → redirection /auth/login", async ({ page }) => {
    await page.goto("/employee/profil");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("Consentements — /employee/profil (avec session)", () => {
  test.beforeEach(async ({ page }) => {
    // Si pas de session disponible, skip le test
    await page.goto("/employee/profil");
    const isRedirected = page.url().includes("/auth/login");
    if (isRedirected) {
      test.skip(true, "Session employé non disponible — nécessite une session authentifiée");
    }
  });

  // ─── 1. Les toggles de consentement sont présents ──────────────────────────

  test("la page /employee/profil affiche les 3 toggles de consentement", async ({ page }) => {
    await page.goto("/employee/profil");

    // Les toggles ont role="switch" (ARIA)
    const switches = page.getByRole("switch");
    await expect(switches).toHaveCount(3);
  });

  // ─── 2. Attributs ARIA corrects ─────────────────────────────────────────────

  test("les toggles ont aria-checked défini (true ou false)", async ({ page }) => {
    await page.goto("/employee/profil");

    const switches = page.getByRole("switch");
    const count = await switches.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const ariaChecked = await switches.nth(i).getAttribute("aria-checked");
      expect(["true", "false"]).toContain(ariaChecked);
    }
  });

  // ─── 3. Activer un consentement ─────────────────────────────────────────────

  test("cliquer sur un toggle désactivé → il passe à ON (aria-checked=true)", async ({ page }) => {
    await page.goto("/employee/profil");

    // Trouver le premier toggle à OFF
    const switches = page.getByRole("switch");
    const count = await switches.count();

    let toggledSwitch = null;
    for (let i = 0; i < count; i++) {
      const isChecked = await switches.nth(i).getAttribute("aria-checked");
      if (isChecked === "false") {
        toggledSwitch = switches.nth(i);
        break;
      }
    }

    if (!toggledSwitch) {
      // Tous les consentements sont déjà ON → désactiver le premier puis réactiver
      await switches.first().click();
      await expect(switches.first()).toHaveAttribute("aria-checked", "false");
      await switches.first().click();
      await expect(switches.first()).toHaveAttribute("aria-checked", "true");
    } else {
      await toggledSwitch.click();
      await expect(toggledSwitch).toHaveAttribute("aria-checked", "true");
    }
  });

  // ─── 4. Persistance du consentement après rechargement ──────────────────────

  test("un consentement activé persiste après rechargement de la page", async ({ page }) => {
    await page.goto("/employee/profil");

    const switches = page.getByRole("switch");

    // S'assurer que le 1er toggle est ON
    const firstSwitch = switches.first();
    const initialState = await firstSwitch.getAttribute("aria-checked");

    if (initialState === "false") {
      await firstSwitch.click();
      await expect(firstSwitch).toHaveAttribute("aria-checked", "true");
    }

    // Recharger et vérifier la persistance
    await page.reload();
    const reloadedSwitch = page.getByRole("switch").first();
    await expect(reloadedSwitch).toHaveAttribute("aria-checked", "true");
  });

  // ─── 5. Formulaire de profil visible ────────────────────────────────────────

  test("la page affiche un champ nom modifiable", async ({ page }) => {
    await page.goto("/employee/profil");

    // Le champ nom est présent
    const nameField = page.getByLabel(/nom|prénom|name/i);
    await expect(nameField).toBeVisible();

    // Le champ email est présent et en lecture seule
    const emailField = page.getByLabel(/email|courriel/i);
    await expect(emailField).toBeVisible();
    const isReadOnly = await emailField.getAttribute("readonly");
    expect(isReadOnly).not.toBeNull();
  });

  // ─── 6. Modifier le nom → succès sans erreur ────────────────────────────────

  test("modifier le nom → formulaire soumis sans erreur", async ({ page }) => {
    await page.goto("/employee/profil");

    const nameField = page.getByLabel(/nom|prénom|name/i).first();
    await nameField.clear();
    await nameField.fill("Aristide Test E2E");

    // Soumettre le formulaire
    const saveButton = page.getByRole("button", { name: /sauvegarder|enregistrer|mettre à jour|save/i });
    await saveButton.click();

    // Pas de message d'erreur
    await expect(page.getByText(/erreur|error|failed/i)).toHaveCount(0);

    // Message de succès ou pas d'erreur
    // (certaines implémentations n'affichent pas de succès explicite)
    await page.waitForTimeout(1000);
    const hasError = await page.getByText(/erreur|error|failed/i).isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
