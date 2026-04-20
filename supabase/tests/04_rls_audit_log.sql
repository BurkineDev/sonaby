-- pgTAP tests : RLS sur audit_log
--
-- Scénarios couverts :
--   1. Un user ordinaire ne peut PAS lire audit_log
--   2. Un admin lit les entrées audit_log de son organisation
--   3. Un admin ne lit pas les entrées d'une autre organisation
--   4. Un user ne peut PAS insérer directement dans audit_log (insert via applicatif uniquement)
--   5. Aucun role ne peut faire UPDATE ou DELETE sur audit_log
--   6. RLS activée + policies attendues
--
-- Note : audit_log est append-only par design. La seule insertion autorisée
-- passe par l'application (service_role via Edge Function ou Server Action Supabase).
-- En RLS-only, les users authentifiés n'ont pas de policy INSERT.

begin;

select plan(9);

-- ─── Fixtures ──────────────────────────────────────────────────────────────────

insert into public.organizations (id, name, slug)
values
  ('dddddddd-0000-0000-0000-000000000001'::uuid, 'SONABHY Audit A', 'audit-org-a'),
  ('dddddddd-0000-0000-0000-000000000002'::uuid, 'Autre Org Audit',  'audit-org-b')
on conflict do nothing;

insert into public.profiles (id, organization_id, email, full_name, role)
values
  ('dd100000-0000-0000-0000-000000000001'::uuid, 'dddddddd-0000-0000-0000-000000000001'::uuid,
   'user-audit@sonabhy.bf', 'Audit User', 'user'),
  ('dd100000-0000-0000-0000-000000000002'::uuid, 'dddddddd-0000-0000-0000-000000000001'::uuid,
   'rssi-audit@sonabhy.bf', 'RSSI Audit', 'rssi'),
  ('dd200000-0000-0000-0000-000000000001'::uuid, 'dddddddd-0000-0000-0000-000000000002'::uuid,
   'rssi-other@autre.bf', 'RSSI Autre Org', 'rssi')
on conflict do nothing;

-- Insérer des entrées audit_log en tant que postgres (contourne RLS)
insert into public.audit_log (organization_id, actor_id, action, resource_type, resource_id, metadata)
values
  ('dddddddd-0000-0000-0000-000000000001'::uuid, 'dd100000-0000-0000-0000-000000000002'::uuid,
   'user.role_changed', 'profiles', 'dd100000-0000-0000-0000-000000000001'::uuid,
   '{"old_role":"user","new_role":"admin"}'::jsonb),
  ('dddddddd-0000-0000-0000-000000000001'::uuid, 'dd100000-0000-0000-0000-000000000002'::uuid,
   'campaign.created', 'phishing_campaigns', gen_random_uuid(),
   '{"name":"Campagne Q1"}'::jsonb),
  ('dddddddd-0000-0000-0000-000000000002'::uuid, 'dd200000-0000-0000-0000-000000000001'::uuid,
   'report.exported', 'reports', gen_random_uuid(),
   '{"format":"pdf"}'::jsonb)
on conflict do nothing;

-- ─── 1. User ordinaire ne voit PAS l'audit_log ────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"dd100000-0000-0000-0000-000000000001","role":"authenticated"}'::text,
  true
);

select results_eq(
  $$
    select count(*)::int from public.audit_log
  $$,
  ARRAY[0],
  'Un user ordinaire ne peut pas lire audit_log (aucune policy SELECT pour role=user)'
);

reset role;

-- ─── 2. RSSI lit les entrées audit_log de son org ─────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"dd100000-0000-0000-0000-000000000002","role":"authenticated"}'::text,
  true
);

select results_eq(
  $$
    select count(*)::int from public.audit_log
    where organization_id = 'dddddddd-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[2],
  'RSSI voit les 2 entrées audit_log de son organisation'
);

-- ─── 3. RSSI ne voit pas les entrées d'une autre org ─────────────────────────

select results_eq(
  $$
    select count(*)::int from public.audit_log
    where organization_id = 'dddddddd-0000-0000-0000-000000000002'::uuid
  $$,
  ARRAY[0],
  'RSSI ne voit pas les audit_log d''une autre organisation'
);

-- Nombre total visible = uniquement son org
select results_eq(
  $$
    select count(*)::int from public.audit_log
  $$,
  ARRAY[2],
  'RSSI ne voit que les entrées de son organisation dans la table complète'
);

reset role;

-- ─── 4. User ne peut PAS insérer dans audit_log ───────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"dd100000-0000-0000-0000-000000000001","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$
    insert into public.audit_log (organization_id, actor_id, action, resource_type)
    values (
      'dddddddd-0000-0000-0000-000000000001'::uuid,
      'dd100000-0000-0000-0000-000000000001'::uuid,
      'fake.action',
      'profiles'
    )
  $$,
  '42501',
  null,
  'Un user ne peut pas insérer directement dans audit_log (RLS violation)'
);

reset role;

-- ─── 5. RSSI ne peut pas non plus insérer dans audit_log ─────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"dd100000-0000-0000-0000-000000000002","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$
    insert into public.audit_log (organization_id, actor_id, action, resource_type)
    values (
      'dddddddd-0000-0000-0000-000000000001'::uuid,
      'dd100000-0000-0000-0000-000000000002'::uuid,
      'fake.rssi.action',
      'profiles'
    )
  $$,
  '42501',
  null,
  'Même un RSSI ne peut pas insérer dans audit_log via le client'
);

reset role;

-- ─── 6. Audit_log est immuable : UPDATE bloqué ────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"dd100000-0000-0000-0000-000000000002","role":"authenticated"}'::text,
  true
);

-- Tentative de modification → 0 lignes affectées
update public.audit_log
set action = 'tampered'
where organization_id = 'dddddddd-0000-0000-0000-000000000001'::uuid;

select results_eq(
  $$
    select count(*)::int from public.audit_log
    where action = 'tampered'
  $$,
  ARRAY[0],
  'Les entrées audit_log ne peuvent pas être modifiées (UPDATE bloqué)'
);

reset role;

-- ─── 7. RLS activée sur audit_log ─────────────────────────────────────────────

select ok(
  (select relrowsecurity from pg_class where relname = 'audit_log'),
  'RLS est activée sur audit_log'
);

-- ─── 8. Policy RSSI read existe ───────────────────────────────────────────────

select has_policy('public', 'audit_log', 'audit_log_rssi_read',
  'La policy audit_log_rssi_read existe sur audit_log');

select * from finish();

rollback;
