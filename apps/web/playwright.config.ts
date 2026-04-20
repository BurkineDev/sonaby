/**
 * Playwright E2E Configuration — CyberGuard SONABHY
 *
 * P0 flows prioritaires :
 *   1. Onboarding (login magic link → consentements → dashboard)
 *   2. Phishing click → JIT learning debrief
 *   3. Révocation de consentement
 *   4. Contrôle d'accès rôle (403 /admin pour un employé)
 *
 * Environnements :
 *   - Local     : BASE_URL = http://localhost:3000, Supabase local
 *   - CI        : BASE_URL injectée par la CI, Supabase local via Docker
 *   - Preview   : BASE_URL = URL Vercel preview (smoke tests uniquement)
 */

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false, // Les tests E2E partagent un état DB → séquentiels
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(process.env.CI ? [["github"] as ["github"]] : []),
  ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "fr-BF",
    timezoneId: "Africa/Ouagadougou",
    // Simule Android mobile (contrainte terrain SONABHY)
    ...devices["Pixel 7"],
  },
  projects: [
    // Mobile (prioritaire — parc Android SONABHY)
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        baseURL: BASE_URL,
      },
      testMatch: "**/*.spec.ts",
    },
    // Desktop (admin/RSSI seulement)
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
      },
      testMatch: "**/admin/**/*.spec.ts",
    },
  ],
  webServer: {
    command: "pnpm start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    },
  },
});
