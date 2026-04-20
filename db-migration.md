# /db-migration — Créer une migration Supabase

Tu crées une migration de base de données **sûre, réversible, testée**.

## Contexte à charger

1. `CLAUDE.md`
2. `docs/02-data-model.md` — schéma existant et conventions
3. `docs/03-security-compliance.md` section RLS
4. Inventaire des migrations existantes : `supabase/migrations/`

## Règles absolues

- **Jamais de DROP** (table, column, type) sans validation explicite d'Aristide + backup vérifié.
- **Toujours un rollback documenté** dans l'en-tête du fichier.
- **Toujours activer la RLS** sur une nouvelle table, avec au moins une policy.
- **Toujours indexer les FK** et les colonnes utilisées en filtre.
- **Jamais de données réelles** dans les migrations (seulement du DDL + DML de référence).
- **Jamais de rebase** d'une migration déjà appliquée en prod.

## Étape 1 — Cadrage

Avant de rédiger le SQL, tu réponds à :

- **Quel est le besoin métier ?** (1 phrase)
- **Quelles tables sont créées / modifiées ?**
- **Quel est l'impact RLS ?** (nouvelles policies à écrire)
- **Quels index ajouter ?**
- **Quels triggers ajouter ?** (updated_at, audit, JIT…)
- **Y a-t-il un risque de downtime ?** (réécriture de table, index sur grande table)
- **Comment tester ?** (pgTAP + quel scénario)
- **Plan de rollback ?**

## Étape 2 — Nommage du fichier

Format strict :

```
supabase/migrations/YYYYMMDDHHMMSS_<snake_case_description>.sql
```

Ex: `20260418163500_add_spaced_repetitions.sql`

Utiliser l'heure UTC au moment de la création pour garantir l'ordre.

## Étape 3 — Structure du fichier

```sql
-- =============================================================
-- Migration: <description courte>
-- Auteur: <initiales>
-- Date: YYYY-MM-DD
-- Purpose: <1-2 phrases>
-- Rollback:
--   <commandes SQL à exécuter pour défaire proprement>
-- Impact:
--   - tables: <list>
--   - RLS: <list>
--   - triggers: <list>
--   - downtime: <none | low | moderate>
-- =============================================================

begin;

-- 1. Types (enums)
--    (si applicable)

-- 2. Tables
--    (CREATE TABLE avec toutes les colonnes + contraintes)

-- 3. Index
--    (un par FK + un par colonne en filtre fréquent)

-- 4. RLS
alter table <nom> enable row level security;
--    policies explicites

-- 5. Triggers
--    (updated_at, audit, JIT, etc.)

-- 6. Grants (si besoin spécifique au-delà des defaults Supabase)

commit;
```

## Étape 4 — Checklist RLS

Pour chaque nouvelle table, vérifier :

- [ ] `alter table X enable row level security;`
- [ ] Au moins une policy `SELECT`
- [ ] Policies `INSERT` / `UPDATE` / `DELETE` définies explicitement (pas de default)
- [ ] Les policies utilisent `auth.uid()` et `auth.current_role()`, pas des joins complexes côté client
- [ ] Les policies sont **testées** via pgTAP

## Étape 5 — Checklist indexes

- [ ] Chaque FK a un index
- [ ] Les colonnes utilisées en `WHERE` fréquent ont un index (timestamp desc, user_id, status)
- [ ] Les colonnes de recherche jsonb utilisent `jsonb_path_ops` si applicable
- [ ] Les arrays utilisés en filtre ont un index `GIN`
- [ ] Ne pas sur-indexer : chaque index coûte en écriture

## Étape 6 — Triggers usuels

- `updated_at` automatique : trigger `tg_set_updated_at`
- Append-only (audit_log, quiz_attempts, phishing_events, security_consents) :
  - `tg_deny_mutation` sur UPDATE et DELETE
- Dérivés automatiques (ex: JIT learning) : triggers dédiés

## Étape 7 — Tests pgTAP

Créer en parallèle : `supabase/tests/<feature>.test.sql`

```sql
begin;
select plan(<n>);

-- Setup données
-- ...

-- Test 1 : la table est créée
select has_table('public', '<table>', 'table existe');

-- Test 2 : RLS est activée
select ok(
  (select relrowsecurity from pg_class where relname = '<table>'),
  'RLS activée sur <table>'
);

-- Test 3 : un user autorisé peut lire
-- ...

-- Test 4 : un user non autorisé ne peut PAS lire
-- ...

-- Test 5 : policy INSERT
-- ...

select * from finish();
rollback;
```

## Étape 8 — Régénération des types TS

Après application de la migration en local :

```bash
pnpm supabase db reset     # réapplique toutes les migrations + seed
pnpm db:types              # regénère packages/db/types.ts
pnpm typecheck             # vérifie qu'aucun type n'est cassé
```

## Étape 9 — Commit

Format :

```
feat(db): <description> (migration)

- Tables: <list>
- RLS: <list>
- Indexes: <list>
- Tests: pgTAP <nom>

Ref: docs/02-data-model.md
```

## Exemples de pièges fréquents

| Piège | Comment l'éviter |
|---|---|
| Oublier la RLS sur la nouvelle table | Template structuré force à l'écrire |
| Indexer la table mais pas les FKs | Checklist étape 5 |
| Dropper une colonne pendant une release | Interdit sans validation Aristide |
| Renommer une colonne en prod | Toujours : add new col → backfill → switch app → drop old col (3 migrations) |
| Mettre des seeds dans une migration | Les seeds vont dans `supabase/seed.sql`, séparés |
| Faire un index CREATE INDEX sans CONCURRENTLY sur prod | Utiliser CONCURRENTLY si la table contient > 100k lignes |
| Enum ALTER qui lock la table | Attention : `alter type ... add value` peut être bloquant sur Postgres < 12 |

## Format de réponse

Quand tu m'es demandé de produire une migration :

1. D'abord le **cadrage** (étape 1) — stop pour validation si ambigu
2. Ensuite le **fichier SQL complet** avec en-tête documenté
3. Ensuite le **fichier pgTAP associé**
4. À la fin : **commandes pour appliquer et tester** en local
5. **Trade-offs et dette** en conclusion
