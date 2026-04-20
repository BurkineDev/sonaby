-- Migration: 20260101000400_scoring_and_audit.sql
-- Purpose: Risk scores (snapshots), cohort scores (CMI), audit log (append-only), scoring config,
--          vues matérialisées KPI, pg_cron jobs
-- Rollback: drop tables cohort_scores, risk_scores, scoring_config, audit_log;

begin;

-- ──────────────────────────────────────────────────────────────────────────────
-- SCORING_CONFIG (paramètres du moteur — versionnés)
-- ──────────────────────────────────────────────────────────────────────────────

create table scoring_config (
  id                  uuid        primary key default gen_random_uuid(),
  version             text        unique not null,  -- ex: 'v1.0.0'
  is_active           boolean     not null default false,
  weight_quiz         numeric(4,2) not null default 0.35,
  weight_phishing     numeric(4,2) not null default 0.45,
  weight_engagement   numeric(4,2) not null default 0.20,
  lambda_quiz         numeric(6,4) not null default 0.0110,  -- demi-vie ~63j
  lambda_phishing     numeric(6,4) not null default 0.0080,  -- demi-vie ~87j
  penalty_click       numeric(4,2) not null default 8.00,
  penalty_submit      numeric(4,2) not null default 20.00,
  penalty_attachment  numeric(4,2) not null default 15.00,
  bonus_report_before numeric(4,2) not null default 15.00,
  bonus_report_after  numeric(4,2) not null default 5.00,
  max_report_bonus    numeric(4,2) not null default 5.00,
  factor_easy         numeric(3,1) not null default 1.0,
  factor_medium       numeric(3,1) not null default 1.3,
  factor_hard         numeric(3,1) not null default 1.6,
  note                text,
  created_at          timestamptz not null default now()
);

comment on table scoring_config is 'Un seul enregistrement actif (is_active=true) à la fois. Changement de poids = nouvelle version.';

-- Contrainte : un seul config actif à la fois
create unique index on scoring_config (is_active) where is_active = true;

-- Seed config v1.0.0
insert into scoring_config (version, is_active, note)
values ('v1.0.0', true, 'Configuration initiale — voir 04-scoring-engine.md');

alter table scoring_config enable row level security;

create policy scoring_config_super_admin on scoring_config
  for all using (auth.current_profile_role() = 'super_admin');

create policy scoring_config_admin_read on scoring_config
  for select using (auth.current_profile_role() in ('admin', 'rssi'));

-- ──────────────────────────────────────────────────────────────────────────────
-- RISK_SCORES (snapshots journaliers par user)
-- ──────────────────────────────────────────────────────────────────────────────

create table risk_scores (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references profiles on delete cascade,
  snapshot_date         date        not null,
  score                 numeric(5,2) not null check (score between 0 and 100),
  quiz_component        numeric(5,2) not null check (quiz_component between 0 and 100),
  phishing_component    numeric(5,2) not null check (phishing_component between 0 and 100),
  engagement_component  numeric(5,2) not null check (engagement_component between 0 and 100),
  report_bonus          numeric(5,2) not null default 0,
  computation_version   text        not null,
  created_at            timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

comment on table risk_scores is 'Un snapshot par user par jour. Score courant = dernier snapshot. Historique pour les courbes.';

create index on risk_scores (user_id, snapshot_date desc);
create index on risk_scores (snapshot_date);
create index on risk_scores (score);

alter table risk_scores enable row level security;

-- Un user voit son propre score
create policy scores_self_read on risk_scores
  for select using (user_id = auth.uid());

-- Manager : PAS accès aux scores individuels → agrégats uniquement via cohort_scores
-- (absence de policy = pas d'accès)

-- RSSI/super_admin : accès individuel (tracé en audit_log côté applicatif)
create policy scores_rssi_read on risk_scores
  for select using (
    auth.current_profile_role() in ('rssi', 'super_admin')
    and exists (
      select 1 from profiles p
      where p.id = risk_scores.user_id
        and p.organization_id = auth.current_org_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- COHORT_SCORES (agrégats par département et org — KPIs Comex)
-- ──────────────────────────────────────────────────────────────────────────────

create table cohort_scores (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references organizations on delete cascade,
  department_id       uuid        references departments,  -- null = org entière (CMI global)
  snapshot_date       date        not null,
  avg_score           numeric(5,2) not null,
  median_score        numeric(5,2) not null,
  p25_score           numeric(5,2) not null,
  p75_score           numeric(5,2) not null,
  user_count          integer     not null,
  phishing_click_rate numeric(5,4),  -- ex: 0.1230 = 12.3%
  phishing_report_rate numeric(5,4),
  completion_rate     numeric(5,4),
  cyber_maturity_index numeric(5,2), -- CMI 0-100
  created_at          timestamptz not null default now(),
  unique (organization_id, department_id, snapshot_date)
);

create index on cohort_scores (organization_id, snapshot_date desc);
create index on cohort_scores (department_id, snapshot_date desc);

alter table cohort_scores enable row level security;

-- Manager voit les agrégats de son département
create policy cohort_manager_read on cohort_scores
  for select using (
    auth.current_profile_role() = 'manager'
    and department_id = (select department_id from profiles where id = auth.uid())
    and organization_id = auth.current_org_id()
  );

-- Admin/RSSI voient tous les agrégats de leur org
create policy cohort_admin_read on cohort_scores
  for select using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- AUDIT_LOG (append-only critique — seul super_admin peut lire)
-- ──────────────────────────────────────────────────────────────────────────────

create table audit_log (
  id              bigserial    primary key,
  actor_id        uuid         references profiles,
  actor_email     text         not null,
  action          audit_action not null,
  target_user_id  uuid         references profiles,
  target_resource text,
  justification   text,        -- obligatoire pour view_individual_report
  ip_address      inet,
  user_agent      text,
  occurred_at     timestamptz  not null default now(),
  metadata        jsonb        not null default '{}'::jsonb
);

comment on table audit_log is 'Append-only. Aucun UPDATE/DELETE possible (voir triggers ci-dessous). Seul super_admin peut lire.';

create index on audit_log (actor_id, occurred_at desc);
create index on audit_log (action);
create index on audit_log (target_user_id, occurred_at desc);
create index on audit_log (occurred_at desc);

alter table audit_log enable row level security;

-- Seul super_admin peut lire l'audit log
create policy audit_super_admin_read on audit_log
  for select using (auth.current_profile_role() = 'super_admin');

-- Triggers pour interdire UPDATE/DELETE (append-only garanti au niveau DB)
create or replace function tg_deny_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log est append-only : UPDATE et DELETE sont interdits.';
end;
$$;

create trigger deny_update_audit
  before update on audit_log
  for each row execute function tg_deny_mutation();

create trigger deny_delete_audit
  before delete on audit_log
  for each row execute function tg_deny_mutation();

-- ──────────────────────────────────────────────────────────────────────────────
-- VUE MATÉRIALISÉE : KPIs phishing par org et par jour
-- ──────────────────────────────────────────────────────────────────────────────

create materialized view mv_org_kpis_daily as
select
  p.organization_id,
  date_trunc('day', e.occurred_at)::date as day,
  count(*) filter (where e.event_type = 'delivered')            as delivered,
  count(*) filter (where e.event_type = 'clicked')              as clicked,
  count(*) filter (where e.event_type = 'submitted_credentials') as submitted,
  count(*) filter (where e.event_type = 'reported')             as reported,
  round(
    100.0 * count(*) filter (where e.event_type = 'clicked')
    / nullif(count(*) filter (where e.event_type = 'delivered'), 0),
    2
  ) as click_rate_pct,
  round(
    100.0 * count(*) filter (where e.event_type = 'reported')
    / nullif(count(*) filter (where e.event_type = 'delivered'), 0),
    2
  ) as report_rate_pct
from phishing_events e
join profiles p on p.id = e.user_id
group by 1, 2;

create unique index on mv_org_kpis_daily (organization_id, day);

-- ──────────────────────────────────────────────────────────────────────────────
-- VUE MATÉRIALISÉE : scores par département (pour dashboard manager/RSSI)
-- ──────────────────────────────────────────────────────────────────────────────

create materialized view mv_dept_scores_latest as
select
  p.organization_id,
  p.department_id,
  d.name                        as department_name,
  count(*)                      as user_count,
  round(avg(rs.score)::numeric, 2)    as avg_score,
  round(percentile_cont(0.5) within group (order by rs.score)::numeric, 2) as median_score
from profiles p
join departments d on d.id = p.department_id
join risk_scores rs on rs.user_id = p.id
  and rs.snapshot_date = (
    select max(snapshot_date) from risk_scores where user_id = p.id
  )
where p.is_active = true
group by 1, 2, 3;

create unique index on mv_dept_scores_latest (organization_id, department_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- pg_cron : rafraîchissement nocturne des vues matérialisées
-- (Active l'extension pg_cron depuis le dashboard Supabase avant d'appliquer)
-- ──────────────────────────────────────────────────────────────────────────────

-- select cron.schedule(
--   'refresh-kpis-daily',
--   '15 2 * * *',
--   $$refresh materialized view concurrently mv_org_kpis_daily$$
-- );

-- select cron.schedule(
--   'refresh-dept-scores',
--   '30 2 * * *',
--   $$refresh materialized view concurrently mv_dept_scores_latest$$
-- );

commit;
