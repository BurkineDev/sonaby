-- Migration: 20260101000100_profiles_and_departments.sql
-- Purpose: Tables profiles (utilisateurs) et departments (organigramme)
-- Rollback: drop table departments, profiles; drop type user_role (si non utilisé ailleurs)

begin;

-- ──────────────────────────────────────────────────────────────────────────────
-- DEPARTMENTS
-- ──────────────────────────────────────────────────────────────────────────────

create table departments (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references organizations on delete cascade,
  name            text        not null,
  code            text,                        -- ex: 'DSI', 'RH', 'COMMERCIAL'
  parent_id       uuid        references departments,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, code)
);

create index on departments (organization_id);
create index on departments (parent_id);

create trigger set_updated_at_departments
  before update on departments
  for each row execute function tg_set_updated_at();

alter table departments enable row level security;

-- ──────────────────────────────────────────────────────────────────────────────
-- PROFILES (mirror de auth.users)
-- ──────────────────────────────────────────────────────────────────────────────

create table profiles (
  id              uuid        primary key references auth.users on delete cascade,
  organization_id uuid        not null references organizations on delete restrict,
  department_id   uuid        references departments,
  email           text        not null,
  full_name       text        not null,
  role            user_role   not null default 'user',
  job_title       text,
  site            text,                        -- site géographique (Ouaga, Bobo, etc.)
  manager_id      uuid        references profiles,
  enrolled_at     timestamptz,
  last_active_at  timestamptz,
  is_active       boolean     not null default true,
  locale          text        not null default 'fr-BF',
  onboarding_done boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column profiles.email is 'Dupliqué depuis auth.users pour les jointures RSC — synchronisé via trigger.';
comment on column profiles.role  is 'Rôle RBAC — vérifiable par RLS, ne jamais faire confiance uniquement côté applicatif.';

create index on profiles (organization_id);
create index on profiles (department_id);
create index on profiles (role);
create index on profiles (manager_id);
create index on profiles (is_active);

create trigger set_updated_at_profiles
  before update on profiles
  for each row execute function tg_set_updated_at();

-- Synchronisation email depuis auth.users → profiles
create or replace function tg_sync_profile_email()
returns trigger language plpgsql security definer as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger sync_profile_email
  after update of email on auth.users
  for each row execute function tg_sync_profile_email();

-- Création automatique du profil après signup (avec invitation admin)
create or replace function tg_create_profile_on_signup()
returns trigger language plpgsql security definer as $$
begin
  -- Le profil sera créé via Server Action d'onboarding, pas ici automatiquement.
  -- Ce trigger sert de fallback pour les signups directs (admin flow).
  return new;
end;
$$;

alter table profiles enable row level security;

-- ──────────────────────────────────────────────────────────────────────────────
-- HELPERS RLS
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function auth.current_profile_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function auth.current_org_id()
returns uuid language sql stable security definer as $$
  select organization_id from profiles where id = auth.uid()
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS — PROFILES
-- ──────────────────────────────────────────────────────────────────────────────

-- Un user voit uniquement son propre profil
create policy profiles_self_read on profiles
  for select using (id = auth.uid());

-- Un manager voit les profils de son département (pas les scores individuels)
create policy profiles_manager_read on profiles
  for select using (
    auth.current_profile_role() = 'manager'
    and department_id = (select department_id from profiles where id = auth.uid())
    and organization_id = auth.current_org_id()
  );

-- Admin/RSSI/super_admin lisent tous les profils de leur org
create policy profiles_admin_read on profiles
  for select using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- Un user met à jour son propre profil (champs limités via applicatif)
create policy profiles_self_update on profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Le rôle ne peut être changé que par admin
    and role = (select role from profiles where id = auth.uid())
  );

-- Admin/super_admin modifient les profils de leur org
create policy profiles_admin_update on profiles
  for update using (
    auth.current_profile_role() in ('admin', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- Insert : uniquement via service_role (onboarding Edge Function) ou self
create policy profiles_insert on profiles
  for insert with check (id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS — DEPARTMENTS
-- ──────────────────────────────────────────────────────────────────────────────

create policy departments_read on departments
  for select using (
    organization_id = auth.current_org_id()
  );

create policy departments_admin_write on departments
  for all using (
    auth.current_profile_role() in ('admin', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS — ORGANIZATIONS
-- ──────────────────────────────────────────────────────────────────────────────

create policy organizations_member_read on organizations
  for select using (
    id = auth.current_org_id()
  );

create policy organizations_super_admin_write on organizations
  for all using (
    auth.current_profile_role() = 'super_admin'
  );

commit;
