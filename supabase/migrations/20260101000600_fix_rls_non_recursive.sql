-- Migration: 20260101000600_fix_rls_non_recursive.sql
-- Purpose: Remplacer les policies RLS récursives par des versions sûres.
--
-- Problème : les policies qui lisent `profiles` depuis une policy sur `profiles`
-- créent une récursion infinie → PostgREST 500 sur tout upsert/select.
--
-- Solution : des fonctions SECURITY DEFINER qui court-circuitent la RLS pour
-- lire le rôle et l'org de l'utilisateur courant. Ces fonctions s'exécutent
-- avec les droits du propriétaire (postgres), donc sans évaluation des policies
-- du rôle appelant → pas de récursion.
--
-- Policies supprimées au préalable (migration appliquée manuellement) :
--   profiles_admin_read, profiles_self_update, profiles_admin_update,
--   departments_read, departments_admin_write

begin;

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

-- Retourne le rôle de l'utilisateur courant sans passer par la RLS de profiles
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- Retourne l'organization_id de l'utilisateur courant sans passer par la RLS
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

-- Admins/RSSI/super_admin lisent tous les profils de leur organisation
create policy profiles_admin_read on profiles
  for select using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'rssi', 'super_admin')
  );

-- Un utilisateur peut mettre à jour son propre profil
create policy profiles_self_update on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Les admins peuvent mettre à jour les profils de leur organisation
create policy profiles_admin_update on profiles
  for update using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'super_admin')
  )
  with check (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'super_admin')
  );

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

-- Tous les membres de l'organisation peuvent lire les départements
create policy departments_read on departments
  for select using (
    organization_id = public.current_org_id()
  );

-- Admins et super_admin peuvent modifier les départements de leur organisation
create policy departments_admin_write on departments
  for all using (
    organization_id = public.current_org_id()
    and public.current_user_role() in ('admin', 'super_admin')
  );

commit;
