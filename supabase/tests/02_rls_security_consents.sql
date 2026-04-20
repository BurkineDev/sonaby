-- pgTAP tests : RLS sur security_consents
--
-- Scénarios couverts :
--   1. Un user ne voit que ses propres consentements
--   2. Un user peut insérer son propre consentement (append-only)
--   3. Un user ne peut PAS insérer un consentement au nom d'un autre
--   4. La table est append-only : UPDATE et DELETE sont interdits
--   5. Un admin lit les consentements de son org
--   6. Un admin ne lit pas les consentements d'une autre org
--   7. RLS activée + policies attendues présentes
--
-- Note : security_consents est append-only par design (loi BF 010-2004/AN).
-- Aucun UPDATE ni DELETE n'est autorisé, y compris pour les admins.

begin;

select plan(13);

-- ─── Fixtures ──────────────────────────────────────────────────────────────────

insert into public.organizations (id, name, slug)
values
  ('cccccccc-0000-0000-0000-000000000001'::uuid, 'SONABHY Consents A', 'consents-org-a'),
  ('cccccccc-0000-0000-0000-000000000002'::uuid, 'Autre Org Consents', 'consents-org-b')
on conflict do nothing;

insert into public.profiles (id, organization_id, email, full_name, role)
values
  ('cc100000-0000-0000-0000-000000000001'::uuid, 'cccccccc-0000-0000-0000-000000000001'::uuid,
   'alice@sonabhy.bf', 'Alice', 'user'),
  ('cc100000-0000-0000-0000-000000000002'::uuid, 'cccccccc-0000-0000-0000-000000000001'::uuid,
   'bob@sonabhy.bf', 'Bob Admin', 'admin'),
  ('cc200000-0000-0000-0000-000000000001'::uuid, 'cccccccc-0000-0000-0000-000000000002'::uuid,
   'carol@autre.bf', 'Carol', 'user')
on conflict do nothing;

-- Pré-insérer quelques consentements (en tant que postgres)
insert into public.security_consents (user_id, scope, granted)
values
  ('cc100000-0000-0000-0000-000000000001'::uuid, 'phishing_simulation', true),
  ('cc100000-0000-0000-0000-000000000001'::uuid, 'score_visibility', true),
  ('cc200000-0000-0000-0000-000000000001'::uuid, 'phishing_simulation', true)
on conflict do nothing;

-- ─── 1. Un user voit uniquement ses propres consentements ────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"cc100000-0000-0000-0000-000000000001","role":"authenticated"}'::text,
  true
);

select results_eq(
  $$
    select count(*)::int from public.security_consents
    where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[2],
  'Alice voit ses 2 consentements'
);

-- Alice ne voit pas les consentements de Carol (autre org)
select results_eq(
  $$
    select count(*)::int from public.security_consents
    where user_id = 'cc200000-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[0],
  'Alice ne voit pas les consentements de Carol (autre org)'
);

-- Alice ne voit que ses propres consentements dans la table entière
select results_eq(
  $$
    select count(*)::int from public.security_consents
  $$,
  ARRAY[2],
  'User ne voit que ses propres consentements dans la table complète'
);

-- ─── 2. Un user peut insérer son propre consentement ─────────────────────────

-- Alice insert un nouveau consentement
insert into public.security_consents (user_id, scope, granted)
values ('cc100000-0000-0000-0000-000000000001'::uuid, 'anonymous_benchmark', true);

select results_eq(
  $$
    select count(*)::int from public.security_consents
    where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid
      and scope = 'anonymous_benchmark'
  $$,
  ARRAY[1],
  'Alice peut insérer son propre consentement'
);

reset role;

-- ─── 3. Un user ne peut PAS insérer au nom d'un autre ────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"cc100000-0000-0000-0000-000000000001","role":"authenticated"}'::text,
  true
);

-- Tentative d'insertion frauduleuse au nom de Carol
select throws_ok(
  $$
    insert into public.security_consents (user_id, scope, granted)
    values ('cc200000-0000-0000-0000-000000000001'::uuid, 'phishing_simulation', false)
  $$,
  '42501',
  null,
  'Un user ne peut pas insérer un consentement au nom d''un autre (RLS violation)'
);

reset role;

-- ─── 4. UPDATE interdit (append-only) ────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"cc100000-0000-0000-0000-000000000001","role":"authenticated"}'::text,
  true
);

-- Tentative de modification → 0 lignes affectées (pas de policy UPDATE)
update public.security_consents
set granted = false
where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid
  and scope = 'phishing_simulation';

-- Vérifier que la valeur n'a pas changé
select results_eq(
  $$
    select granted from public.security_consents
    where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid
      and scope = 'phishing_simulation'
    order by granted_at desc
    limit 1
  $$,
  ARRAY[true],
  'Le consentement ne peut pas être modifié (append-only, UPDATE bloqué par absence de policy)'
);

-- ─── 5. DELETE interdit ───────────────────────────────────────────────────────

delete from public.security_consents
where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid;

select results_eq(
  $$
    select count(*)::int from public.security_consents
    where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[3],
  'Les consentements ne peuvent pas être supprimés (DELETE bloqué par absence de policy)'
);

reset role;

-- ─── 6. Admin lit les consentements de son org ───────────────────────────────

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"cc100000-0000-0000-0000-000000000002","role":"authenticated"}'::text,
  true
);

-- Bob (admin org A) voit les consentements de Alice (org A)
select results_eq(
  $$
    select count(*)::int from public.security_consents
    where user_id = 'cc100000-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[3],
  'Admin voit les consentements des users de son organisation'
);

-- Bob ne voit pas les consentements de Carol (org B)
select results_eq(
  $$
    select count(*)::int from public.security_consents
    where user_id = 'cc200000-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[0],
  'Admin ne voit pas les consentements d''une autre organisation'
);

reset role;

-- ─── 7. RLS activée + policies présentes ─────────────────────────────────────

select ok(
  (select relrowsecurity from pg_class where relname = 'security_consents'),
  'RLS est activée sur security_consents'
);

select has_policy('public', 'security_consents', 'consents_self_read',
  'La policy consents_self_read existe');

select has_policy('public', 'security_consents', 'consents_self_insert',
  'La policy consents_self_insert existe');

select has_policy('public', 'security_consents', 'consents_admin_read',
  'La policy consents_admin_read existe');

select * from finish();

rollback;
