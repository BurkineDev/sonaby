-- Migration: 20260101000300_phishing_engine.sql
-- Purpose: Moteur de simulation phishing (templates, campaigns, sends, events) + trigger JIT Learning
-- Rollback: drop table phishing_events, phishing_sends, phishing_campaigns, phishing_templates;

begin;

-- ──────────────────────────────────────────────────────────────────────────────
-- PHISHING_TEMPLATES
-- ──────────────────────────────────────────────────────────────────────────────

create table phishing_templates (
  id              uuid               primary key default gen_random_uuid(),
  organization_id uuid               not null references organizations on delete cascade,
  name            text               not null,
  channel         campaign_channel   not null,
  subject         text,
  body_html       text,
  body_text       text,
  sender_name     text,
  sender_email    text,             -- domaine spoofable dédié (ex: rh@sonabhy-info.com)
  landing_page_slug text,           -- ex: 'orange-money-verify' → /phishing-landing/orange-money-verify
  difficulty      module_difficulty  not null default 'medium',
  locale          text               not null default 'fr-BF',
  topic_tags      text[]             not null default '{}',
  context_tags    text[]             not null default '{}', -- ex: ['orange_money', 'sonabhy_rh', 'min_finances']
  is_active       boolean            not null default true,
  created_at      timestamptz        not null default now(),
  updated_at      timestamptz        not null default now()
);

comment on column phishing_templates.sender_email is 'Domaine dédié à SONABHY — jamais de vrais domaines tiers. SPF/DKIM configurés.';
comment on column phishing_templates.landing_page_slug is 'Page factice sur le domaine simulation. Visuellement crédible, jamais malveillante.';

create index on phishing_templates (organization_id);
create index on phishing_templates using gin (topic_tags);
create index on phishing_templates using gin (context_tags);

create trigger set_updated_at_phishing_templates
  before update on phishing_templates
  for each row execute function tg_set_updated_at();

alter table phishing_templates enable row level security;

-- Users ne voient pas les templates (confidentialité des simulations)
create policy templates_admin_only on phishing_templates
  for all using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- PHISHING_CAMPAIGNS
-- ──────────────────────────────────────────────────────────────────────────────

create table phishing_campaigns (
  id                    uuid             primary key default gen_random_uuid(),
  organization_id       uuid             not null references organizations on delete cascade,
  name                  text             not null,
  template_id           uuid             not null references phishing_templates,
  status                campaign_status  not null default 'draft',
  target_cohort_filter  jsonb            not null, -- {departments:[], roles:[], sites:[]}
  scheduled_at          timestamptz,
  sent_at               timestamptz,
  completed_at          timestamptz,
  approved_by           uuid             references profiles,
  approved_at           timestamptz,
  created_by            uuid             not null references profiles,
  created_at            timestamptz      not null default now(),
  updated_at            timestamptz      not null default now()
);

comment on column phishing_campaigns.target_cohort_filter is 'Filtre JSON : {"departments":["uuid1"], "roles":["user"], "sites":["Ouaga"]}. Vide = toute l org.';
comment on column phishing_campaigns.approved_by is 'RSSI qui a approuvé l envoi (workflow 2 yeux pour > 500 users).';

create index on phishing_campaigns (organization_id);
create index on phishing_campaigns (status);
create index on phishing_campaigns (scheduled_at);

create trigger set_updated_at_phishing_campaigns
  before update on phishing_campaigns
  for each row execute function tg_set_updated_at();

alter table phishing_campaigns enable row level security;

create policy campaigns_admin_all on phishing_campaigns
  for all using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- PHISHING_SENDS
-- ──────────────────────────────────────────────────────────────────────────────

create table phishing_sends (
  id          uuid        primary key default gen_random_uuid(),
  campaign_id uuid        not null references phishing_campaigns on delete cascade,
  user_id     uuid        not null references profiles,
  send_token  text        unique not null,  -- HMAC-SHA256 signé, unique par user+campagne
  sent_at     timestamptz,
  bounced     boolean     not null default false,
  created_at  timestamptz not null default now(),
  unique (campaign_id, user_id)
);

comment on column phishing_sends.send_token is 'HMAC-SHA256(campaign_id || user_id || timestamp, PHISHING_HMAC_SECRET). Non-devinable.';

create index on phishing_sends (user_id);
create index on phishing_sends (campaign_id);
create index on phishing_sends (send_token);

alter table phishing_sends enable row level security;

-- Users ne voient pas leurs propres sends (ça casserait la simulation)
create policy sends_admin_only on phishing_sends
  for all using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and exists (
      select 1 from phishing_campaigns c
      where c.id = phishing_sends.campaign_id
        and c.organization_id = auth.current_org_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- PHISHING_EVENTS (append-only — cœur du scoring comportemental)
-- ──────────────────────────────────────────────────────────────────────────────

create table phishing_events (
  id            uuid                 primary key default gen_random_uuid(),
  send_id       uuid                 not null references phishing_sends on delete cascade,
  user_id       uuid                 not null references profiles,
  campaign_id   uuid                 not null references phishing_campaigns,
  event_type    phishing_event_type  not null,
  occurred_at   timestamptz          not null default now(),
  dwell_time_ms integer,             -- ms entre 'delivered' et l'événement
  ip_address    inet,
  user_agent    text,
  metadata      jsonb                not null default '{}'::jsonb
);

comment on table phishing_events is 'Append-only. Source de vérité pour le scoring comportemental et les KPIs.';

create index on phishing_events (user_id, occurred_at desc);
create index on phishing_events (campaign_id);
create index on phishing_events (event_type);
create index on phishing_events (send_id);

alter table phishing_events enable row level security;

-- Users voient uniquement leurs propres événements (pour transparence du score)
create policy events_self_read on phishing_events
  for select using (user_id = auth.uid());

-- Insert via service_role uniquement (Route Handler phishing/click + Edge Function)
-- Pas de policy INSERT pour les users → insertion via supabase admin dans les Edge Functions

-- Admin/RSSI lisent tous les événements de leur org
create policy events_admin_read on phishing_events
  for select using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and exists (
      select 1 from profiles p
      where p.id = phishing_events.user_id
        and p.organization_id = auth.current_org_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- TRIGGER JIT LEARNING : clic phishing → micro-module immédiat
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function tg_trigger_jit_learning()
returns trigger language plpgsql security definer as $$
declare
  v_module_id uuid;
begin
  if new.event_type in ('clicked', 'submitted_credentials') then
    -- Trouver un module JIT dont les topic_tags matchent ceux du template de la campagne
    select m.id into v_module_id
    from modules m
    join phishing_campaigns c on c.id = new.campaign_id
    join phishing_templates t on t.id = c.template_id
    where m.kind = 'jit_remediation'
      and m.is_published = true
      and m.topic_tags && t.topic_tags  -- intersection de tableaux
    order by m.difficulty asc           -- commencer par le plus accessible
    limit 1;

    if v_module_id is not null then
      insert into module_completions (user_id, module_id, trigger, metadata)
      values (
        new.user_id,
        v_module_id,
        'jit_phishing',
        jsonb_build_object(
          'campaign_id', new.campaign_id,
          'event_type', new.event_type
        )
      )
      on conflict do nothing;  -- ne pas dupliquer si déjà assigné
    end if;
  end if;
  return new;
end;
$$;

create trigger trigger_jit_learning
  after insert on phishing_events
  for each row execute function tg_trigger_jit_learning();

commit;
