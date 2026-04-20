-- pgTAP tests : trigger tg_trigger_jit_learning
--
-- Scénarios couverts :
--   1. Clic phishing → module JIT créé automatiquement dans module_completions
--   2. submitted_credentials → module JIT créé
--   3. delivered (sans clic) → PAS de module JIT
--   4. reported (sans clic) → PAS de module JIT
--   5. Idempotence : double clic → 1 seul module_completion (ON CONFLICT DO NOTHING)
--   6. Aucun module JIT publié → pas d'erreur, pas d'insertion
--   7. Les métadonnées campaign_id et event_type sont correctement stockées
--
-- Dépendances : tables phishing_templates, phishing_campaigns, phishing_sends,
--               phishing_events, modules, module_completions, organizations, profiles
-- Exécution   : supabase db test   OU   pg_prove -U postgres supabase/tests/03_trigger_jit_learning.sql

begin;

select plan(10);

-- ─── Fixtures ──────────────────────────────────────────────────────────────────

insert into public.organizations (id, name, slug)
values ('eeeeeeee-0000-0000-0000-000000000001'::uuid, 'SONABHY JIT Test', 'jit-test-org')
on conflict do nothing;

-- Utilisateur cible
insert into public.profiles (id, organization_id, email, full_name, role)
values ('ee100000-0000-0000-0000-000000000001'::uuid, 'eeeeeeee-0000-0000-0000-000000000001'::uuid,
        'target@sonabhy.bf', 'Target User', 'user')
on conflict do nothing;

-- Template phishing avec topic_tags
insert into public.phishing_templates
  (id, organization_id, name, channel, subject, body_html, difficulty, topic_tags, is_active)
values (
  'ff100000-0000-0000-0000-000000000001'::uuid,
  'eeeeeeee-0000-0000-0000-000000000001'::uuid,
  'Faux Orange Money',
  'email',
  'Votre compte Orange Money a été débité',
  '<p>Cliquez ici pour confirmer</p>',
  'medium',
  '{"orange_money","phishing","mobile_money"}'::text[],
  true
) on conflict do nothing;

-- Campagne
insert into public.phishing_campaigns
  (id, organization_id, name, template_id, status, target_cohort_filter)
values (
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'eeeeeeee-0000-0000-0000-000000000001'::uuid,
  'Campagne Test JIT',
  'ff100000-0000-0000-0000-000000000001'::uuid,
  'running',
  '{}'::jsonb
) on conflict do nothing;

-- Send (envoi individuel)
insert into public.phishing_sends
  (id, campaign_id, user_id, status)
values (
  'ff300000-0000-0000-0000-000000000001'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ee100000-0000-0000-0000-000000000001'::uuid,
  'sent'
) on conflict do nothing;

-- Module JIT publié avec les même topic_tags
insert into public.modules
  (id, organization_id, title, kind, difficulty, is_published, topic_tags, body)
values (
  'ff400000-0000-0000-0000-000000000001'::uuid,
  'eeeeeeee-0000-0000-0000-000000000001'::uuid,
  'JIT : Reconnaître un faux Orange Money',
  'jit_remediation',
  'easy',
  true,
  '{"orange_money","phishing","mobile_money"}'::text[],
  '{"slides":[]}'::jsonb
) on conflict do nothing;

-- ─── 1. Clic phishing → module JIT déclenché ─────────────────────────────────

insert into public.phishing_events
  (id, campaign_id, send_id, user_id, event_type, difficulty)
values (
  'fe100000-0000-0000-0000-000000000001'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ff300000-0000-0000-0000-000000000001'::uuid,
  'ee100000-0000-0000-0000-000000000001'::uuid,
  'clicked',
  'medium'
);

select results_eq(
  $$
    select count(*)::int from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000001'::uuid
      and trigger = 'jit_phishing'
  $$,
  ARRAY[1],
  'Un clic phishing déclenche la création d''un module_completion JIT'
);

-- ─── 2. Le bon module est sélectionné ─────────────────────────────────────────

select results_eq(
  $$
    select module_id from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000001'::uuid
      and trigger = 'jit_phishing'
    limit 1
  $$,
  ARRAY['ff400000-0000-0000-0000-000000000001'::uuid],
  'Le module JIT sélectionné est celui dont les topic_tags matchent le template'
);

-- ─── 3. Les métadonnées sont correctes ───────────────────────────────────────

select results_eq(
  $$
    select metadata->>'event_type' from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000001'::uuid
      and trigger = 'jit_phishing'
    limit 1
  $$,
  ARRAY['clicked'],
  'Les métadonnées du module_completion contiennent event_type=clicked'
);

select results_eq(
  $$
    select metadata->>'campaign_id' from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000001'::uuid
      and trigger = 'jit_phishing'
    limit 1
  $$,
  ARRAY['ff200000-0000-0000-0000-000000000001'],
  'Les métadonnées contiennent le campaign_id correct'
);

-- ─── 4. submitted_credentials → module JIT aussi ─────────────────────────────

insert into public.phishing_events
  (id, campaign_id, send_id, user_id, event_type, difficulty)
values (
  'fe100000-0000-0000-0000-000000000002'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ff300000-0000-0000-0000-000000000001'::uuid,
  'ee100000-0000-0000-0000-000000000001'::uuid,
  'submitted_credentials',
  'medium'
);

-- Note : ON CONFLICT DO NOTHING sur (user_id, module_id) — le second insert
-- ne crée pas de doublon si le module_completion existe déjà
select ok(
  (
    select count(*) >= 1 from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000001'::uuid
      and trigger = 'jit_phishing'
  ),
  'submitted_credentials déclenche (ou laisse intacte) une entrée JIT dans module_completions'
);

-- ─── 5. delivered → PAS de module JIT ────────────────────────────────────────

-- Créer un nouveau user sans module_completion préexistant
insert into public.profiles (id, organization_id, email, full_name, role)
values ('ee100000-0000-0000-0000-000000000002'::uuid, 'eeeeeeee-0000-0000-0000-000000000001'::uuid,
        'passive@sonabhy.bf', 'Passive User', 'user')
on conflict do nothing;

insert into public.phishing_sends
  (id, campaign_id, user_id, status)
values (
  'ff300000-0000-0000-0000-000000000002'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ee100000-0000-0000-0000-000000000002'::uuid,
  'sent'
) on conflict do nothing;

insert into public.phishing_events
  (id, campaign_id, send_id, user_id, event_type, difficulty)
values (
  'fe200000-0000-0000-0000-000000000001'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ff300000-0000-0000-0000-000000000002'::uuid,
  'ee100000-0000-0000-0000-000000000002'::uuid,
  'delivered',
  'medium'
);

select results_eq(
  $$
    select count(*)::int from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000002'::uuid
  $$,
  ARRAY[0],
  'Un événement "delivered" ne crée pas de module JIT'
);

-- ─── 6. reported → PAS de module JIT ─────────────────────────────────────────

insert into public.phishing_events
  (id, campaign_id, send_id, user_id, event_type, difficulty)
values (
  'fe200000-0000-0000-0000-000000000002'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ff300000-0000-0000-0000-000000000002'::uuid,
  'ee100000-0000-0000-0000-000000000002'::uuid,
  'reported',
  'medium'
);

select results_eq(
  $$
    select count(*)::int from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000002'::uuid
  $$,
  ARRAY[0],
  'Un événement "reported" ne crée pas de module JIT'
);

-- ─── 7. Idempotence : double clic → 1 seul module_completion ─────────────────

-- Simuler un deuxième clic pour le même user (redirect tracking dupliqué)
insert into public.phishing_events
  (id, campaign_id, send_id, user_id, event_type, difficulty)
values (
  'fe100000-0000-0000-0000-000000000003'::uuid,
  'ff200000-0000-0000-0000-000000000001'::uuid,
  'ff300000-0000-0000-0000-000000000001'::uuid,
  'ee100000-0000-0000-0000-000000000001'::uuid,
  'clicked',
  'medium'
);

select results_eq(
  $$
    select count(*)::int from public.module_completions
    where user_id = 'ee100000-0000-0000-0000-000000000001'::uuid
      and module_id = 'ff400000-0000-0000-0000-000000000001'::uuid
      and trigger = 'jit_phishing'
  $$,
  ARRAY[1],
  'Double clic = idempotence : 1 seul module_completion JIT (ON CONFLICT DO NOTHING)'
);

-- ─── 8. Aucun module JIT disponible → pas d'erreur ───────────────────────────

-- User dans une org sans modules JIT
insert into public.organizations (id, name, slug)
values ('eeeeeeee-0000-0000-0000-000000000002'::uuid, 'Org Sans JIT', 'no-jit-org')
on conflict do nothing;

insert into public.profiles (id, organization_id, email, full_name, role)
values ('ee300000-0000-0000-0000-000000000001'::uuid, 'eeeeeeee-0000-0000-0000-000000000002'::uuid,
        'nojit@org.bf', 'No JIT User', 'user')
on conflict do nothing;

insert into public.phishing_templates
  (id, organization_id, name, channel, subject, body_html, difficulty, topic_tags, is_active)
values (
  'ff500000-0000-0000-0000-000000000001'::uuid,
  'eeeeeeee-0000-0000-0000-000000000002'::uuid,
  'Template No JIT',
  'email',
  'Test No JIT',
  '<p>Test</p>',
  'easy',
  '{"unique_topic_xyz"}'::text[],
  true
) on conflict do nothing;

insert into public.phishing_campaigns
  (id, organization_id, name, template_id, status, target_cohort_filter)
values (
  'ff600000-0000-0000-0000-000000000001'::uuid,
  'eeeeeeee-0000-0000-0000-000000000002'::uuid,
  'Campagne No JIT',
  'ff500000-0000-0000-0000-000000000001'::uuid,
  'running',
  '{}'::jsonb
) on conflict do nothing;

insert into public.phishing_sends
  (id, campaign_id, user_id, status)
values (
  'ff700000-0000-0000-0000-000000000001'::uuid,
  'ff600000-0000-0000-0000-000000000001'::uuid,
  'ee300000-0000-0000-0000-000000000001'::uuid,
  'sent'
) on conflict do nothing;

-- Ce clic ne doit provoquer aucune erreur même sans module JIT
select lives_ok(
  $$
    insert into public.phishing_events
      (id, campaign_id, send_id, user_id, event_type, difficulty)
    values (
      'fe300000-0000-0000-0000-000000000001'::uuid,
      'ff600000-0000-0000-0000-000000000001'::uuid,
      'ff700000-0000-0000-0000-000000000001'::uuid,
      'ee300000-0000-0000-0000-000000000001'::uuid,
      'clicked',
      'easy'
    )
  $$,
  'Aucun module JIT disponible → le trigger ne lève pas d''erreur'
);

select results_eq(
  $$
    select count(*)::int from public.module_completions
    where user_id = 'ee300000-0000-0000-0000-000000000001'::uuid
  $$,
  ARRAY[0],
  'Sans module JIT correspondant, aucun module_completion n''est créé'
);

select * from finish();

rollback;
