# 02 — Modèle de données

> Toutes les tables ont `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` avec trigger, RLS activée, et index sur toutes les clés étrangères.

## 1. Philosophie

- **Source unique de vérité** : Postgres. Pas de dénormalisation vers un autre store.
- **Enums Postgres natifs** pour les statuts stables (role, campaign_status…). Enums applicatifs (Zod) synchronisés via génération de types.
- **Append-only là où c'est possible** : `phishing_events`, `audit_log`, `quiz_attempts` ne sont jamais mis à jour ni supprimés.
- **Agrégats précalculés** : les KPIs temps réel s'appuient sur des **materialized views** rafraîchies par `pg_cron`.
- **RLS systématique** : aucune table sans policy. Le `service_role` reste exclusivement côté Edge Functions.

## 2. Schéma logique (ERD simplifié)

```
                  organizations (v1: un seul SONABHY)
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
         departments          profiles ─────────────┐
              │                   │                 │
              └────────┬──────────┘                 │
                       ▼                            ▼
                 cohort_memberships           security_consents
                                                    │
                                                    ▼
  ┌──────────────────┬────────────────┬────────────────┬─────────────────┐
  ▼                  ▼                ▼                ▼                 ▼
learning_paths   quiz_attempts   phishing_sends   risk_scores      audit_log
    │                                 │                 (snapshots)
    ▼                                 ▼
modules                        phishing_events
    │                                 │
    ▼                                 │
module_completions ◄──────────────────┘ (jit_trigger)
```

## 3. Tables principales

### 3.1 `organizations`

```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  locale text not null default 'fr-BF',
  data_region text not null default 'eu-west',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

V1 : une seule ligne (SONABHY). Préparé pour Phase 3.

### 3.2 `profiles`

```sql
create type user_role as enum (
  'user', 'manager', 'security_champion', 'admin', 'rssi', 'super_admin'
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  organization_id uuid not null references organizations,
  department_id uuid references departments,
  email text not null,
  full_name text not null,
  role user_role not null default 'user',
  job_title text,
  site text,          -- site géographique (Ouaga, Bobo, etc.)
  manager_id uuid references profiles,
  enrolled_at timestamptz,
  last_active_at timestamptz,
  is_active boolean not null default true,
  locale text not null default 'fr-BF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on profiles(organization_id);
create index on profiles(department_id);
create index on profiles(role);
create index on profiles(manager_id);
```

Note : l'email est dupliqué depuis `auth.users` pour simplifier les jointures côté RSC, mais reste synchronisé via trigger.

### 3.3 `departments`

```sql
create table departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations,
  name text not null,
  code text,            -- ex: "DSI", "RH", "COMMERCIAL"
  parent_id uuid references departments,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, code)
);
```

### 3.4 `security_consents` (loi 010-2004 Burkina + RGPD)

```sql
create type consent_scope as enum (
  'phishing_simulation',
  'behavior_analytics',
  'individual_reporting'
);

create table security_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  scope consent_scope not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  revocation_at timestamptz,
  unique(user_id, scope, granted_at)
);
```

**Append-only.** Une révocation insère une nouvelle ligne avec `granted = false`. L'historique est intact pour audit.

### 3.5 `learning_paths` et `modules`

```sql
create type module_difficulty as enum ('easy', 'medium', 'hard');
create type module_kind as enum (
  'micro_lesson',     -- 3-5 min
  'quiz',
  'video',
  'scenario',         -- mini-scénario interactif
  'jit_remediation'   -- Just-In-Time après erreur
);

create table learning_paths (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations,
  slug text not null,
  title text not null,
  description text,
  target_role user_role,
  target_difficulty module_difficulty,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations,
  learning_path_id uuid references learning_paths,
  slug text not null,
  title text not null,
  kind module_kind not null,
  difficulty module_difficulty not null default 'medium',
  estimated_minutes smallint not null default 5,
  topic_tags text[] not null default '{}',   -- ex: ['phishing', 'mobile_money']
  body jsonb not null,                       -- contenu structuré (blocks)
  prerequisites uuid[] default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index on modules using gin(topic_tags);
create index on modules using gin(body jsonb_path_ops);
```

Le champ `body jsonb` stocke le contenu sous forme de blocs structurés (Notion-like) — permet l'évolution sans migration.

### 3.6 `module_completions`

```sql
create type completion_status as enum ('started', 'completed', 'failed', 'abandoned');

create table module_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  module_id uuid not null references modules,
  status completion_status not null default 'started',
  score numeric(5,2),               -- 0 à 100
  time_spent_seconds integer,
  trigger text,                     -- 'manual' | 'assigned' | 'jit_phishing' | 'jit_quiz_fail'
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create index on module_completions(user_id);
create index on module_completions(module_id);
create index on module_completions(status);
create index on module_completions(completed_at desc);
```

### 3.7 `quiz_attempts` (append-only)

```sql
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles,
  module_id uuid not null references modules,
  question_id text not null,        -- id dans body jsonb
  answer jsonb not null,
  is_correct boolean not null,
  time_to_answer_ms integer,
  created_at timestamptz not null default now()
);

create index on quiz_attempts(user_id, created_at desc);
create index on quiz_attempts(module_id);
```

### 3.8 Simulation phishing

```sql
create type campaign_status as enum (
  'draft', 'scheduled', 'running', 'completed', 'cancelled'
);

create type campaign_channel as enum ('email', 'sms', 'whatsapp');

create table phishing_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations,
  name text not null,
  channel campaign_channel not null,
  subject text,
  body_html text,
  body_text text,
  sender_name text,
  sender_email text,                -- domaine spoofable dédié
  landing_page_slug text,           -- page factice type login SONABHY
  difficulty module_difficulty not null default 'medium',
  locale text not null default 'fr-BF',
  topic_tags text[] default '{}',
  context_tags text[] default '{}', -- ex: ['orange_money','sonabhy_rh','min_finances']
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table phishing_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations,
  name text not null,
  template_id uuid not null references phishing_templates,
  status campaign_status not null default 'draft',
  target_cohort_filter jsonb not null, -- filtre département/rôle/site
  scheduled_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table phishing_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references phishing_campaigns on delete cascade,
  user_id uuid not null references profiles,
  send_token text unique not null,  -- HMAC signé, pour tracking liens
  sent_at timestamptz,
  bounced boolean default false,
  created_at timestamptz not null default now(),
  unique(campaign_id, user_id)
);

create index on phishing_sends(user_id);
create index on phishing_sends(campaign_id);
```

### 3.9 `phishing_events` (append-only, cœur du scoring)

```sql
create type phishing_event_type as enum (
  'delivered',
  'opened',
  'clicked',
  'submitted_credentials', -- a saisi des infos sur landing fake
  'reported',              -- a signalé comme suspect (comportement VERTUEUX)
  'attachment_opened'
);

create table phishing_events (
  id uuid primary key default gen_random_uuid(),
  send_id uuid not null references phishing_sends on delete cascade,
  user_id uuid not null references profiles,
  campaign_id uuid not null references phishing_campaigns,
  event_type phishing_event_type not null,
  occurred_at timestamptz not null default now(),
  dwell_time_ms integer,   -- temps entre 'delivered' et 'clicked'
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb
);

create index on phishing_events(user_id, occurred_at desc);
create index on phishing_events(campaign_id);
create index on phishing_events(event_type);
```

### 3.10 `risk_scores` (snapshots journaliers)

```sql
create table risk_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  snapshot_date date not null,
  score numeric(5,2) not null check (score between 0 and 100),
  quiz_component numeric(5,2) not null,
  phishing_component numeric(5,2) not null,
  engagement_component numeric(5,2) not null,
  report_bonus numeric(5,2) not null default 0,
  computation_version text not null,  -- ex: 'v1.2.0', pour traçabilité
  created_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

create index on risk_scores(user_id, snapshot_date desc);
create index on risk_scores(snapshot_date);
```

Le score actuel = dernier snapshot. L'historique permet les courbes d'évolution sans recalcul.

### 3.11 `cohort_scores` (agrégats par département et organisation)

```sql
create table cohort_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations,
  department_id uuid references departments,  -- null = org entière
  snapshot_date date not null,
  avg_score numeric(5,2) not null,
  median_score numeric(5,2) not null,
  p25_score numeric(5,2) not null,
  p75_score numeric(5,2) not null,
  user_count integer not null,
  phishing_click_rate numeric(5,4),
  phishing_report_rate numeric(5,4),
  completion_rate numeric(5,4),
  cyber_maturity_index numeric(5,2),     -- CMI 0-100
  created_at timestamptz not null default now(),
  unique(organization_id, department_id, snapshot_date)
);
```

### 3.12 `audit_log` (append-only, critique)

```sql
create type audit_action as enum (
  'login', 'logout', 'mfa_challenge',
  'view_individual_report',      -- accès à données individuelles
  'export_report',
  'create_campaign', 'launch_campaign', 'cancel_campaign',
  'role_change',
  'consent_grant', 'consent_revoke',
  'data_export_request',
  'data_deletion_request'
);

create table audit_log (
  id bigserial primary key,
  actor_id uuid references profiles,
  actor_email text,
  action audit_action not null,
  target_user_id uuid references profiles,
  target_resource text,
  justification text,            -- obligatoire pour accès individuel
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

create index on audit_log(actor_id, occurred_at desc);
create index on audit_log(action);
create index on audit_log(target_user_id, occurred_at desc);
create index on audit_log(occurred_at desc);
```

**Policy RLS** : seul `super_admin` peut lire. Aucun `UPDATE`, aucun `DELETE`, ni via RLS, ni via trigger `tg_deny_mutation`.

## 4. Triggers essentiels

### 4.1 `updated_at` automatique

```sql
create or replace function tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- À appliquer sur chaque table ayant updated_at
create trigger set_updated_at before update on profiles
  for each row execute function tg_set_updated_at();
```

### 4.2 `audit_log` : refuser mutations

```sql
create or replace function tg_deny_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

create trigger deny_update_audit before update on audit_log
  for each row execute function tg_deny_mutation();
create trigger deny_delete_audit before delete on audit_log
  for each row execute function tg_deny_mutation();
```

### 4.3 Déclencheur JIT Learning

```sql
create or replace function tg_trigger_jit_learning()
returns trigger language plpgsql as $$
declare
  v_module_id uuid;
begin
  if new.event_type in ('clicked', 'submitted_credentials') then
    -- sélectionne un module JIT correspondant au topic de la campagne
    select m.id into v_module_id
    from modules m
    join phishing_campaigns c on c.id = new.campaign_id
    join phishing_templates t on t.id = c.template_id
    where m.kind = 'jit_remediation'
      and m.topic_tags && t.topic_tags
      and m.is_published
    order by m.difficulty asc
    limit 1;

    if v_module_id is not null then
      insert into module_completions (user_id, module_id, trigger, metadata)
      values (new.user_id, v_module_id, 'jit_phishing',
              jsonb_build_object('campaign_id', new.campaign_id))
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger trigger_jit_learning
  after insert on phishing_events
  for each row execute function tg_trigger_jit_learning();
```

## 5. Row Level Security — patterns de base

### 5.1 Helper : rôle courant

```sql
create or replace function auth.current_role()
returns user_role language sql stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function auth.current_org()
returns uuid language sql stable as $$
  select organization_id from profiles where id = auth.uid()
$$;
```

### 5.2 Policies `profiles`

```sql
alter table profiles enable row level security;

-- Un user voit son profil
create policy profiles_self_read on profiles
  for select using (id = auth.uid());

-- Un manager voit les profils de son département (sans champs sensibles)
create policy profiles_manager_read on profiles
  for select using (
    auth.current_role() = 'manager'
    and department_id = (select department_id from profiles where id = auth.uid())
  );

-- Admin/RSSI/super_admin voient tous les profils de leur org
create policy profiles_admin_read on profiles
  for select using (
    auth.current_role() in ('admin', 'rssi', 'super_admin')
    and organization_id = auth.current_org()
  );

-- Seuls admin/super_admin peuvent modifier
create policy profiles_admin_write on profiles
  for update using (
    auth.current_role() in ('admin', 'super_admin')
    and organization_id = auth.current_org()
  );
```

### 5.3 Policies `risk_scores`

```sql
alter table risk_scores enable row level security;

-- Un user voit son propre score (granularité self-service)
create policy scores_self_read on risk_scores
  for select using (user_id = auth.uid());

-- Manager : pas d'accès aux scores individuels, seulement aux agrégats cohort_scores
-- → pas de policy = pas d'accès

-- RSSI : accès individuel conditionné à la présence d'une justification en audit_log
-- → policy simplifiée v1 : accès lecture sur son org
create policy scores_rssi_read on risk_scores
  for select using (
    auth.current_role() in ('rssi', 'super_admin')
    and exists (
      select 1 from profiles p
      where p.id = risk_scores.user_id
      and p.organization_id = auth.current_org()
    )
  );
```

### 5.4 Pattern général

| Table | user | manager | admin | rssi | super_admin |
|---|---|---|---|---|---|
| `profiles` | self | département | org | org | all |
| `modules` | published | published | org | org | all |
| `module_completions` | self | agrégé département | org | org | all |
| `phishing_events` | self | agrégé département | org | org | all |
| `risk_scores` | self | — | — | org | all |
| `cohort_scores` | — | département | org | org | all |
| `audit_log` | — | — | — | — | all |

## 6. Vues matérialisées (KPIs rapides)

```sql
create materialized view mv_org_kpis_daily as
select
  p.organization_id,
  date_trunc('day', e.occurred_at)::date as day,
  count(*) filter (where e.event_type = 'delivered') as delivered,
  count(*) filter (where e.event_type = 'clicked') as clicked,
  count(*) filter (where e.event_type = 'reported') as reported,
  round(
    100.0 * count(*) filter (where e.event_type = 'clicked')
    / nullif(count(*) filter (where e.event_type = 'delivered'), 0),
    2
  ) as click_rate,
  round(
    100.0 * count(*) filter (where e.event_type = 'reported')
    / nullif(count(*) filter (where e.event_type = 'delivered'), 0),
    2
  ) as report_rate
from phishing_events e
join profiles p on p.id = e.user_id
group by 1, 2;

create unique index on mv_org_kpis_daily (organization_id, day);

-- Rafraîchissement nocturne via pg_cron
select cron.schedule(
  'refresh-kpis',
  '15 2 * * *',
  $$refresh materialized view concurrently mv_org_kpis_daily$$
);
```

## 7. Migrations : règles

- Tout changement de schéma = fichier SQL dans `supabase/migrations/`, nommage `YYYYMMDDHHMMSS_description.sql`.
- Aucune migration destructive (DROP TABLE, DROP COLUMN) sans validation explicite d'Aristide + backup Supabase vérifié.
- Toujours proposer un plan de rollback dans le commentaire en tête du fichier de migration.
- Après migration : regénérer les types TS, committer.

```sql
-- Template de migration
-- file: 20260101120000_add_security_consents.sql
-- purpose: Ajouter la table de gestion des consentements (loi 010-2004 BF)
-- rollback: drop table security_consents; drop type consent_scope;

begin;

create type consent_scope as enum (...);
create table security_consents (...);

commit;
```

## 8. Données de test

- Seeds versionnés dans `supabase/seed.sql` pour l'environnement local uniquement.
- Une commande `pnpm db:reset && pnpm db:seed` doit remonter une plateforme démo avec :
  - 1 org SONABHY
  - 5 départements (DSI, RH, COMMERCIAL, TECHNIQUE, DIRECTION)
  - ~50 utilisateurs fictifs avec noms FR-BF
  - 3 parcours de formation, 20 modules
  - 10 templates phishing contextualisés (Orange Money, SONABHY RH, etc.)
  - 2 campagnes historiques avec événements générés
  - 30 jours de `risk_scores` pour tracer des courbes

Les seeds ne contiennent **aucune donnée réelle SONABHY**.
