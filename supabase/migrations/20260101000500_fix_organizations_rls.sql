-- Migration: 20260101000500_fix_organizations_rls.sql
-- Purpose: Ajouter les policies RLS manquantes sur organizations et departments.
--
-- Problème : organizations a RLS activée dans migration 00 mais aucune policy SELECT
-- n'a été définie. Résultat : un utilisateur authentifié sans profil (ex: onboarding)
-- ne peut pas lire son organisation → erreur "Erreur de configuration. Contactez la DSI."
--
-- Décision : les champs name/slug d'une organisation ne sont pas confidentiels.
-- Tout utilisateur authentifié peut lire les organisations (lecture seule).
-- L'écriture reste réservée aux super_admin.

begin;

-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

-- Tout utilisateur authentifié peut lire les organisations
create policy organizations_authenticated_read on organizations
  for select using (auth.uid() is not null);

-- Seul super_admin peut modifier les organisations
create policy organizations_super_admin_write on organizations
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
-- Idem : les noms de départements ne sont pas confidentiels.

-- Tout utilisateur authentifié peut lire les départements de son organisation
create policy departments_authenticated_read on departments
  for select using (auth.uid() is not null);

-- Admin/super_admin modifient les départements de leur organisation
create policy departments_admin_write on departments
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
        and p.organization_id = departments.organization_id
    )
  );

commit;
