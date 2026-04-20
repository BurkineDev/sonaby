-- Migration: 20260101000000_init_enums_and_organizations.sql
-- Purpose: Enums de base + table organizations (tenant v1 = SONABHY)
-- Rollback: drop table organizations; drop type consent_scope, user_role, module_difficulty, module_kind,
--           completion_status, campaign_status, campaign_channel, phishing_event_type, audit_action;

begin;

-- ──────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────────────────────

create type user_role as enum (
  'user',
  'manager',
  'security_champion',
  'admin',
  'rssi',
  'super_admin'
);

create type consent_scope as enum (
  'phishing_simulation',
  'behavior_analytics',
  'individual_reporting'
);

create type module_difficulty as enum ('easy', 'medium', 'hard');

create type module_kind as enum (
  'micro_lesson',
  'quiz',
  'video',
  'scenario',
  'jit_remediation'
);

create type completion_status as enum ('started', 'completed', 'failed', 'abandoned');

create type campaign_status as enum (
  'draft',
  'scheduled',
  'running',
  'completed',
  'cancelled'
);

create type campaign_channel as enum ('email', 'sms', 'whatsapp');

create type phishing_event_type as enum (
  'delivered',
  'opened',
  'clicked',
  'submitted_credentials',
  'reported',
  'attachment_opened'
);

create type audit_action as enum (
  'login',
  'logout',
  'mfa_challenge',
  'view_individual_report',
  'export_report',
  'create_campaign',
  'launch_campaign',
  'cancel_campaign',
  'role_change',
  'consent_grant',
  'consent_revoke',
  'data_export_request',
  'data_deletion_request'
);

-- ──────────────────────────────────────────────────────────────────────────────
-- FONCTION TRIGGER : updated_at automatique
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- ORGANIZATIONS (V1 : une seule ligne SONABHY)
-- ──────────────────────────────────────────────────────────────────────────────

create table organizations (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        unique not null,
  locale      text        not null default 'fr-BF',
  data_region text        not null default 'eu-west',
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger set_updated_at_organizations
  before update on organizations
  for each row execute function tg_set_updated_at();

-- RLS : organisation visible uniquement par ses membres (policy ajoutée après profiles)
alter table organizations enable row level security;

commit;
