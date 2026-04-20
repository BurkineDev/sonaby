# /new-feature — Ajouter une nouvelle fonctionnalité

Tu suis rigoureusement ce workflow pour toute nouvelle feature, sans sauter d'étape.

## Contexte à charger

Avant tout, lis :
1. `CLAUDE.md` (racine) — rôle et principes
2. `docs/01-architecture.md` — couches et conventions
3. Le document métier pertinent selon le domaine de la feature :
   - Scoring → `docs/04-scoring-engine.md`
   - Simulation → `docs/05-simulation-engine.md`
   - Learning → `docs/06-learning-engine.md`
   - API → `docs/07-api-contract.md`
   - UX → `docs/08-ui-ux-spec.md`

## Étape 1 — Cadrage (NE PAS CODER)

Produis un **plan court** (pas plus de 15 lignes) couvrant :

- **Objectif métier** en une phrase : quel problème utilisateur résout cette feature ?
- **Acteurs concernés** : quels rôles RBAC sont impactés ?
- **Surface touchée** : fichiers/modules à créer ou modifier (liste à puces)
- **Impact données** : nouvelles tables, nouvelles colonnes, nouvelles policies RLS ?
- **Impact sécurité** : y a-t-il un enjeu d'auth, de consentement, de PII ?
- **Tests prévus** : unit, pgTAP, E2E — lesquels ?
- **Questions ouvertes** (si ambiguïté)

**Stop. Attends validation d'Aristide avant de coder.**

## Étape 2 — Migration DB (si applicable)

Si la feature touche le schéma :

1. Créer le fichier de migration dans `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`
2. Inclure un commentaire d'en-tête : purpose + rollback
3. Activer RLS sur toute nouvelle table
4. Écrire les policies RLS explicitement (voir `docs/02-data-model.md` section 5)
5. Écrire les tests pgTAP correspondants dans `supabase/tests/`
6. Regénérer les types TS : `pnpm db:types`

## Étape 3 — Schemas Zod et types

Dans `packages/shared/schemas/` :
1. Définir le schéma Zod pour les inputs (API, forms)
2. Dériver les types TS via `z.infer<>`
3. Les types publics exportés sont typés explicitement (pas d'inférence implicite)

## Étape 4 — Logique métier pure

Dans `packages/shared/services/<domain>/` :
1. Implémenter la logique sans dépendance framework
2. 0 import de Next.js, React, Supabase
3. Fonctions pures préférées
4. Tests unitaires Vitest en parallèle (TDD si possible)

## Étape 5 — Data access

Dans `packages/db/queries/<domain>.ts` :
1. Fonctions typées (input + output)
2. Requêtes Supabase client uniquement
3. Aucun `service_role` hors Edge Functions
4. Gestion d'erreur explicite (retourner `Result<T, E>` ou lever avec type custom)

## Étape 6 — Route API ou Server Action

1. Validation Zod en premier (fail fast)
2. Vérification auth + RBAC (`requireRole(['admin', 'rssi'])`)
3. Vérification consentement si applicable (`requireConsent(userId, 'phishing_simulation')`)
4. Appel service métier
5. Log audit_log si action sensible
6. Retour conforme au format d'erreur standardisé

## Étape 7 — UI

1. Respecter les design tokens et composants shadcn/ui existants
2. Mobile-first sur les surfaces employé
3. Accessibilité : labels, ARIA, contrastes
4. Skeleton loader pour les états de chargement
5. Messages d'erreur user-friendly (pas de stack traces)

## Étape 8 — Tests

Minimum obligatoire :
- **Unit** sur la logique métier (happy path + 2 cas d'erreur)
- **Integration pgTAP** si migration DB (test RLS par rôle)
- **E2E Playwright** si parcours utilisateur critique
- **Test a11y** (axe) sur la nouvelle page

## Étape 9 — Documentation

- Mettre à jour le MD concerné dans `docs/` si décision technique ajoutée
- Ajouter entrée dans le CHANGELOG si impact public (API, UX majeure)
- Si feature sécurité : paragraphe dans `docs/03-security-compliance.md`

## Étape 10 — PR

Titre format Conventional Commit : `feat(<scope>): <description>`

Description PR :
```markdown
## Objectif
<1 phrase>

## Changements
- <liste>

## Trade-offs assumés
- <liste>

## Dette technique créée
- <liste ou "aucune">

## Questions ouvertes
- <liste ou "aucune">

## Tests ajoutés
- [ ] Unit
- [ ] pgTAP
- [ ] E2E
- [ ] a11y

## Checklist sécurité
- [ ] RLS vérifiée
- [ ] Validation Zod
- [ ] Pas de secret en clair
- [ ] Audit log si sensible
- [ ] Consentement vérifié si applicable
```

## Fin de réponse

Termine toujours par :
1. **Trade-offs assumés** (décisions qui méritent d'être visibles)
2. **Dette créée** (ce qu'on laisse derrière, et pourquoi c'est acceptable)
3. **Questions ouvertes** (ce qui mérite une décision humaine)
