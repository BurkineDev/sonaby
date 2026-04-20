/**
 * Helpers d'authentification pour les tests E2E Playwright.
 *
 * Stratégie : on bypasse le magic link en créant une session directement
 * via l'API Supabase admin (service_role), puis on injecte le cookie de session
 * dans le browser Playwright.
 *
 * Cette approche évite de dépendre d'un serveur email en CI et rend les tests
 * déterministes et rapides (~200ms vs ~5s pour un vrai magic link).
 */

import { createClient } from "@supabase/supabase-js";
import type { Page, BrowserContext } from "@playwright/test";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key";

// Comptes de test pré-seedés (voir supabase/seed.sql)
export const TEST_USERS = {
  employee: {
    email: "alice@sonabhy.bf",
    password: "Test1234!",
    role: "user" as const,
  },
  admin: {
    email: "admin@sonabhy.bf",
    password: "Test1234!",
    role: "admin" as const,
  },
  rssi: {
    email: "rssi@sonabhy.bf",
    password: "Test1234!",
    role: "rssi" as const,
  },
} as const;

/**
 * Authentifie un utilisateur et injecte la session dans le contexte Playwright.
 * À appeler dans beforeEach ou au début d'un test qui nécessite une session.
 */
export async function loginAs(
  context: BrowserContext,
  userKey: keyof typeof TEST_USERS
): Promise<void> {
  const user = TEST_USERS[userKey];

  // Créer une session via l'API Supabase (pas de magic link)
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Générer un lien de connexion one-time (pour les comptes avec magic link activé)
  // En mode CI, on utilise la méthode signInWithPassword si disponible
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });

  if (error || !data.properties?.hashed_token) {
    throw new Error(`Impossible de générer un lien de connexion pour ${user.email}: ${error?.message}`);
  }

  // Naviguer vers le lien de confirmation pour établir la session
  const page = await context.newPage();
  const confirmUrl = `${SUPABASE_URL}/auth/v1/verify?token=${data.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/auth/callback`)}`;

  await page.goto(confirmUrl);
  await page.waitForURL(/\/(employee|admin|onboarding)/);
  await page.close();
}

/**
 * Sauvegarde l'état de session après connexion pour le réutiliser entre tests.
 * Utilise Playwright storage state (cookies + localStorage).
 */
export async function saveSessionState(
  page: Page,
  filePath: string
): Promise<void> {
  await page.context().storageState({ path: filePath });
}

/**
 * Vérifie qu'un utilisateur non authentifié est redirigé vers /auth/login.
 */
export async function expectRedirectToLogin(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForURL(/\/auth\/login/);
}
