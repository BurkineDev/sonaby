# 10 — Testing & QA

> Règle d'or : **pas de test, pas de merge**. Une PR qui touche la logique métier sans test associé est rejetée d'office. Le coverage n'est pas un objectif en soi — la **confiance** l'est.

## 1. Pyramide de tests

```
                    ┌─────────────────┐
                    │   E2E (rare)    │        ~5 % du volume
                    │   Playwright    │        Les parcours critiques uniquement
                    └─────────────────┘
                   ┌───────────────────┐
                   │  Integration      │       ~15 %
                   │  pgTAP + Vitest   │       RLS, API, queries
                   └───────────────────┘
                ┌─────────────────────────┐
                │   Unit (majoritaire)    │    ~80 %
                │   Vitest                │    Services, scoring, utils
                └─────────────────────────┘
```

Rationale : les tests unitaires sont rapides et nombreux ; les E2E sont lents et fragiles, donc réservés aux flows critiques.

## 2. Outillage

| Couche | Outil | Fichiers |
|---|---|---|
| Unit (TS) | Vitest | `*.test.ts` co-localisés |
| Component (React) | Vitest + Testing Library | `*.test.tsx` |
| Database / RLS | pgTAP | `supabase/tests/*.sql` |
| E2E | Playwright | `apps/web/e2e/*.spec.ts` |
| Accessibility | `@axe-core/playwright` | intégré aux specs E2E |
| Performance | Lighthouse CI | `.lighthouserc.json` |
| API contract | Zod + vitest-schema | `packages/shared/schemas/*.test.ts` |
| Property-based | fast-check | sur le scoring engine |
| Visual regression | Playwright screenshots | Phase 2 (optionnel) |

## 3. Tests unitaires — standards

### 3.1 Périmètre prioritaire

- **Moteur de scoring** (`packages/shared/services/scoring/`) : 100 % des branches couvertes.
- **Validation HMAC** (`packages/shared/services/simulation/token.ts`).
- **Logique de répétition espacée** (SM-2).
- **Règles de filtrage consentement** (ciblage campagne).
- **Helpers de décroissance temporelle** (`decay`).

### 3.2 Convention

```ts
// packages/shared/services/scoring/__tests__/risk-score.test.ts
import { describe, it, expect } from 'vitest';
import { computeRiskScore } from '../risk-score';
import { baseConfig, withFixtures } from './fixtures';

describe('computeRiskScore', () => {
  it('retourne null pour un user enrôlé depuis moins de 7 jours', () => {
    const input = withFixtures({ daysSinceEnrollment: 3 });
    const result = computeRiskScore(input, baseConfig);
    expect(result.score).toBeNull();
    expect(result.dataQuality.hasBaseline).toBe(false);
  });

  it('clampe le score à 100 même avec un bonus signalement maximal', () => {
    const input = withFixtures({
      quiz: 95, phishing: 95, engagement: 95, reports: 20,
    });
    const result = computeRiskScore(input, baseConfig);
    expect(result.score).toBe(100);
  });

  it('applique la décroissance temporelle au quiz (demi-vie ~63j)', () => {
    const recent = withFixtures({ quizDaysAgo: [0, 0, 0] });
    const old    = withFixtures({ quizDaysAgo: [63, 63, 63] });
    const r1 = computeRiskScore(recent, baseConfig);
    const r2 = computeRiskScore(old, baseConfig);
    expect(r1.components.quiz).toBeGreaterThan(r2.components.quiz * 1.8);
  });
});
```

### 3.3 Property-based (scoring engine)

```ts
import fc from 'fast-check';

it('le score est toujours dans [0, 100]', () => {
  fc.assert(fc.property(arbUserScoringInput(), (input) => {
    const r = computeRiskScore(input, baseConfig);
    if (r.score !== null) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  }));
});

it('ajouter un signalement ne diminue jamais le score', () => {
  fc.assert(fc.property(arbUserScoringInput(), (input) => {
    const withoutReport = computeRiskScore(input, baseConfig);
    const withReport    = computeRiskScore(
      { ...input, reports: [...input.reports, newLegitimateReport()] },
      baseConfig,
    );
    expect(withReport.score ?? 0).toBeGreaterThanOrEqual(withoutReport.score ?? 0);
  }));
});
```

## 4. Golden tests (scoring)

Jeu de données de référence dans `tests/fixtures/scoring-golden.json` :

```json
[
  {
    "caseId": "GOLD-001",
    "description": "User expert : quiz 90, pas de clic, 3 signalements",
    "input": { ... },
    "expected": { "score": 88.4, "version": "v1.0.0" }
  },
  ...
]
```

Toute modification du moteur qui change un golden → PR dédiée avec :
- Justification dans le CHANGELOG du scoring engine.
- Nouvelle version (SemVer).
- Mise à jour du JSON avec les nouveaux scores.
- Mention explicite dans le titre de PR : `feat(scoring): v1.3.0 — ajuste la pénalité des attachments (breaking)`.

Les scores historiques en base **ne sont pas recalculés** automatiquement — le versioning protège l'auditabilité.

## 5. Tests de base de données (pgTAP)

Critiques pour valider la RLS et les triggers. Pas de confiance aveugle dans Supabase.

### 5.1 Installation

```sql
create extension if not exists pgtap;
```

### 5.2 Suite RLS : test par rôle sur chaque table sensible

```sql
-- supabase/tests/rls_profiles.test.sql
begin;
select plan(6);

-- Préparer deux users de rôles différents dans deux départements différents
insert into profiles (id, organization_id, department_id, email, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111', org_a, dept_1, 'alice@sonabhy.bf', 'Alice', 'user'),
  ('22222222-2222-2222-2222-222222222222', org_a, dept_1, 'bob@sonabhy.bf',   'Bob',   'manager'),
  ('33333333-3333-3333-3333-333333333333', org_a, dept_2, 'carol@sonabhy.bf', 'Carol', 'user');

-- En tant qu'Alice (user), elle voit uniquement son profil
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from profiles),
  1::bigint,
  'alice voit 1 profil (le sien)'
);

select ok(
  exists(select 1 from profiles where id = '11111111-1111-1111-1111-111111111111'),
  'alice voit son propre profil'
);

-- En tant que Bob (manager du dept_1), il voit les users de son département
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is(
  (select count(*) from profiles where department_id = dept_1),
  2::bigint,
  'bob voit les 2 users de son département'
);

select is(
  (select count(*) from profiles where department_id = dept_2),
  0::bigint,
  'bob ne voit pas les users d''un autre département'
);

-- Bob ne peut pas modifier les profils
select throws_ok(
  $$update profiles set full_name = 'hack' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  NULL,
  'bob (manager) ne peut pas modifier un profil'
);

-- audit_log est append-only
select throws_ok(
  $$update audit_log set action = 'login' where id = 1$$,
  NULL,
  'audit_log is append-only',
  'impossible de modifier audit_log'
);

select * from finish();
rollback;
```

### 5.3 Suite triggers

```sql
-- supabase/tests/trigger_jit_learning.test.sql
begin;
select plan(2);

-- Insert un phishing_event clicked
insert into phishing_events (send_id, user_id, campaign_id, event_type)
values (send_1, user_alice, camp_1, 'clicked');

-- Vérifier qu'un module_completions JIT a été créé
select is(
  (select count(*) from module_completions
   where user_id = user_alice and trigger = 'jit_phishing'),
  1::bigint,
  'un module JIT est créé suite à un clic phishing'
);

-- Vérifier qu'un event 'reported' ne déclenche PAS de JIT
insert into phishing_events (send_id, user_id, campaign_id, event_type)
values (send_2, user_bob, camp_1, 'reported');

select is(
  (select count(*) from module_completions
   where user_id = user_bob and trigger = 'jit_phishing'),
  0::bigint,
  'pas de JIT sur signalement'
);

select * from finish();
rollback;
```

### 5.4 Exécution CI

```yaml
# .github/workflows/pgtap.yml (extrait)
- run: supabase db reset
- run: supabase db execute --file supabase/tests/run-all.sql
```

## 6. Tests E2E (Playwright)

### 6.1 Flows critiques obligatoires

| Flow | Fichier | Priorité |
|---|---|---|
| Onboarding employé complet (invite → consentement → baseline quiz) | `e2e/onboarding.spec.ts` | P0 |
| Clic sur phishing simulé → JIT learning | `e2e/phishing-click-jit.spec.ts` | P0 |
| Création campagne admin → approbation RSSI → lancement | `e2e/campaign-creation.spec.ts` | P0 |
| Génération rapport individuel avec justification + MFA | `e2e/individual-report.spec.ts` | P0 |
| Complétion module en mode offline puis sync | `e2e/offline-module.spec.ts` | P1 |
| Export de ses données personnelles (RGPD) | `e2e/data-export.spec.ts` | P1 |
| Révocation de consentement → exclusion des campagnes | `e2e/consent-revoke.spec.ts` | P0 |

### 6.2 Structure d'un test

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Onboarding employé', () => {
  test('un nouvel user complète l''onboarding sans erreur a11y', async ({ page }) => {
    // 1. Click magic link (simulation via URL)
    await page.goto(buildMagicLinkUrl('alice@sonabhy.bf'));

    // 2. Écran bienvenue
    await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible();
    await page.getByRole('button', { name: /commencer/i }).click();

    // 3. Consentements : 3 switchs
    await page.getByLabel(/simulations phishing/i).check();
    await page.getByLabel(/analyse comportementale/i).check();
    // laisser le 3e non coché (facultatif)
    await page.getByRole('button', { name: /valider/i }).click();

    // 4. Quiz baseline
    await expect(page.getByText(/quiz baseline/i)).toBeVisible();
    // ... répondre 15 questions

    // 5. Vérification a11y sur la page finale
    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
  });
});
```

### 6.3 Tests par rôle

Chaque rôle (`user`, `manager`, `admin`, `rssi`, `super_admin`) a un test vérifiant qu'il **n'accède pas** aux surfaces d'autres rôles :

```ts
test('un user ne peut pas accéder à /admin', async ({ page, loginAs }) => {
  await loginAs('user');
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(403);
});
```

## 7. Accessibilité

### 7.1 Audit automatisé (CI bloquant)

- `@axe-core/playwright` sur chaque page de chaque test E2E.
- Violations bloquantes : `serious`, `critical`. Les `moderate` lèvent un warning.

### 7.2 Audit manuel (trimestriel)

- Lecture au lecteur d'écran (NVDA) sur les 3 parcours critiques.
- Navigation clavier complète.
- Test avec zoom 200 %.

## 8. Performance

### 8.1 Lighthouse CI

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/login",
        "http://localhost:3000/app",
        "http://localhost:3000/app/modules/demo"
      ],
      "settings": { "preset": "mobile" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn",  { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo":           ["warn", { "minScore": 0.85 }]
      }
    }
  }
}
```

### 8.2 Bundle size monitoring

- `@next/bundle-analyzer` en dev.
- Seuil CI : échec si bundle page employé > 200 KB gzipped.
- Review PR : diff bundle publié en commentaire automatique.

## 9. Tests de sécurité

### 9.1 Automatisés

- **`gitleaks`** en pre-commit + CI : détection de secrets committés.
- **`pnpm audit --audit-level=high`** en CI : vulnérabilités deps.
- **Dependabot** : PRs automatiques de mise à jour.
- **Snyk** (optionnel) : analyse statique sur PR touchant deps.

### 9.2 Manuels (trimestriels)

- Revue threat model (relecture de `03-security-compliance.md`).
- Test manuel d'injection (fuzz des inputs sensibles).
- Revue des logs Sentry pour patterns suspects.

### 9.3 Pentest externe (contractuel)

Si le contrat SONABHY prévoit un pentest final (Mois 11-12) :
- Scope : plateforme web + APIs.
- Méthodologie : OWASP WSTG + ASVS v4.0 niveau 2.
- Prestataire externe (non-WendTech).
- Rapport remis au RSSI + plan de remédiation.

## 10. Environnements de test

| Env | Infrastructure | Données | Usage |
|---|---|---|---|
| `local` | Supabase local (Docker) | seed synthétique | Dev quotidien, tests unit |
| `preview` | Vercel preview + Supabase branch | seed synthétique | Revues PR |
| `staging` | Vercel staging + Supabase staging | copie anonymisée de prod | Recette avant release |
| `production` | Vercel prod + Supabase prod | données réelles SONABHY | — |

Règles :
- **Aucune donnée réelle SONABHY** en dehors de `staging` (anonymisée) et `production`.
- Reset de `local` hebdomadaire.
- Reset de `staging` après chaque release majeure.

## 11. Critères de recette par jalon

### 11.1 Critères L2 (MVP pré-prod)

- [ ] Tous les tests unit passent (0 skip sans ticket)
- [ ] Tous les tests E2E P0 passent
- [ ] Tests pgTAP RLS : 100 % des tables sensibles couvertes
- [ ] Audit `pnpm audit` : 0 vulnérabilité `high`/`critical`
- [ ] Lighthouse : ≥ 85 mobile sur les 3 pages critiques
- [ ] Pas de secret dans le repo (gitleaks clean)
- [ ] Revue consultant cyber externe OK

### 11.2 Critères L4 (Production)

Ajout :
- [ ] Test de charge : 500 users simultanés, latence p95 < 800ms
- [ ] Test de bascule offline/online sans perte de données
- [ ] Audit de rétention et purge (mensuel OK)
- [ ] Plan de réponse incident testé (drill)

## 12. Workflow CI/CD

```
PR opened
  │
  ├─► Lint (ESLint, Prettier, typecheck)           ← bloquant
  ├─► Unit tests (Vitest)                          ← bloquant
  ├─► pgTAP (sur Supabase branch)                  ← bloquant
  ├─► E2E P0 (Playwright headless)                 ← bloquant
  ├─► Lighthouse (preview deploy)                  ← warning
  ├─► Bundle size check                            ← bloquant si > seuil
  ├─► gitleaks                                     ← bloquant
  └─► pnpm audit                                   ← bloquant sur high+

Merge main
  │
  ├─► Build production
  ├─► Tests E2E P1 + P2 (nightly aussi)
  ├─► Deploy staging
  ├─► Smoke tests
  ├─► Promote to production (manuel, 1 click)
  └─► Post-deploy : vérif Sentry + Supabase Logs
```

## 13. Règles non négociables

- Une PR sans test associé sur la logique métier est **rejetée**.
- Un test qui échoue en CI **bloque le merge**. Pas de `skip` temporaire sans ticket ouvert référencé dans le commit.
- Un `TODO` dans le code doit référencer une issue : `// TODO(#123): ...`.
- Un commit qui introduit une exception `any` en TypeScript doit la justifier : `// @ts-expect-error(justification)`.
- Les tests sont la **documentation exécutable** du comportement attendu. Ils doivent être lisibles.
