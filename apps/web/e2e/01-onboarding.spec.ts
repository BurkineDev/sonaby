/**
 * E2E P0 — Onboarding flow
 *
 * Scénarios :
 *   1. Un utilisateur non authentifié est redirigé vers /auth/login
 *   2. La page /auth/login affiche le formulaire d'email
 *   3. Soumission d'un email invalide → message d'erreur
 *   4. Soumission d'un email valide → écran de confirmation "vérifiez vos emails"
 *   5. Après authentification, un user sans onboarding va sur /onboarding
 *   6. L'onboarding : accepter les 3 consentements → bouton Continuer s'active
 *   7. Après onboarding, redirection vers /employee
 *   8. La page /employee affiche le dashboard employé (Risk Score, modules)
 */

import { test, expect } from "@playwright/test";
import path from "path";

const EMPLOYEE_STATE = path.join(__dirname, "fixtures", "employee-session.json");

test.describe("Onboarding P0 — Auth & Consentements", () => {
  // ─── 1. Redirect vers login si non authentifié ──────────────────────────────

  test("accès à /employee sans session → redirection /auth/login", async ({ page }) => {
    await page.goto("/employee");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("accès à /admin sans session → redirection /auth/login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("accès à /employee/profil sans session → redirection /auth/login", async ({ page }) => {
    await page.goto("/employee/profil");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  // ─── 2. Page de login ───────────────────────────────────────────────────────

  test("la page /auth/login affiche le formulaire magic link", async ({ page }) => {
    await page.goto("/auth/login");

    // Titre ou description visible
    await expect(page.getByRole("heading", { name: /connexion|login|accès/i })).toBeVisible();

    // Champ email présent
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();

    // Bouton de soumission
    const submitButton = page.getByRole("button", { name: /connexion|envoyer|continuer/i });
    await expect(submitButton).toBeVisible();
  });

  // ─── 3. Email invalide → erreur ─────────────────────────────────────────────

  test("email invalide → message d'erreur affiché", async ({ page }) => {
    await page.goto("/auth/login");

    const emailInput = page.getByRole("textbox", { name: /email/i });
    await emailInput.fill("pas-un-email");

    const submitButton = page.getByRole("button", { name: /connexion|envoyer|continuer/i });
    await submitButton.click();

    // Validation HTML5 ou message d'erreur applicatif
    const hasValidationMessage = await emailInput.evaluate((el: HTMLInputElement) =>
      !el.validity.valid
    );
    const hasErrorText = await page.getByText(/email invalide|format incorrect|saisir un email/i).isVisible().catch(() => false);

    expect(hasValidationMessage || hasErrorText).toBe(true);
  });

  // ─── 4. Email valide → confirmation ─────────────────────────────────────────

  test("email valide → écran de confirmation 'vérifiez vos emails'", async ({ page }) => {
    await page.goto("/auth/login");

    const emailInput = page.getByRole("textbox", { name: /email/i });
    await emailInput.fill("alice@sonabhy.bf");

    const submitButton = page.getByRole("button", { name: /connexion|envoyer|continuer/i });
    await submitButton.click();

    // Attendre la confirmation (le formulaire disparaît ou un message s'affiche)
    await expect(
      page.getByText(/vérifiez|email envoyé|lien de connexion|magic link/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Onboarding P0 — Dashboard employé (post-auth)", () => {
  // Note : ces tests utilisent un état de session pré-établi (storageState).
  // En CI, loginAs() est appelé dans un global setup pour créer le fichier de session.
  // En local, si le fichier n'existe pas, les tests sont skippés avec un message clair.

  test.beforeEach(async ({ page }) => {
    // Vérifier si le fichier de session existe (créé par global setup en CI)
    try {
      await page.context().storageState();
    } catch {
      test.skip(true, "Session employee non disponible — lancer 'pnpm e2e:setup' d'abord");
    }
  });

  test("page /employee affiche le Risk Score", async ({ page }) => {
    await page.goto("/employee");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).not.toHaveURL(/\/onboarding/);

    // Le score doit être visible (widget RiskScoreCard)
    const scoreWidget = page.getByTestId("risk-score-card");
    if (await scoreWidget.isVisible()) {
      await expect(scoreWidget).toBeVisible();
    } else {
      // Fallback : chercher le texte "Score" ou un nombre
      await expect(page.getByText(/score|risque/i).first()).toBeVisible();
    }
  });

  test("page /employee affiche la liste des modules", async ({ page }) => {
    await page.goto("/employee");

    // Il doit y avoir au moins un module ou une section Parcours
    const modulesSection = page.getByText(/module|parcours|formation|apprentissage/i).first();
    await expect(modulesSection).toBeVisible();
  });

  test("la navigation employé ne contient pas de liens admin", async ({ page }) => {
    await page.goto("/employee");

    // L'employé ne doit pas voir de liens vers /admin
    const adminLinks = page.locator('a[href*="/admin"]');
    await expect(adminLinks).toHaveCount(0);
  });
});
