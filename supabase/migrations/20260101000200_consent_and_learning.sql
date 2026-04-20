-- Migration: 20260101000200_consent_and_learning.sql
-- Purpose: Consentements RGPD/loi 010-2004 BF + engine learning (parcours, modules, complétions, quiz)
-- Rollback: drop tables module_completions, quiz_attempts, modules, learning_paths, security_consents;

begin;

-- ──────────────────────────────────────────────────────────────────────────────
-- SECURITY_CONSENTS (append-only — loi 010-2004 Burkina Faso)
-- ──────────────────────────────────────────────────────────────────────────────

create table security_consents (
  id            uuid          primary key default gen_random_uuid(),
  user_id       uuid          not null references profiles on delete cascade,
  scope         consent_scope not null,
  granted       boolean       not null,
  granted_at    timestamptz   not null default now(),
  ip_address    inet,
  user_agent    text,
  revocation_at timestamptz,
  unique (user_id, scope, granted_at)
);

comment on table security_consents is 'Append-only. Une révocation = nouvelle ligne granted=false. Historique conservé pour audit.';

create index on security_consents (user_id, scope);
create index on security_consents (granted_at desc);

alter table security_consents enable row level security;

-- Un user voit ses propres consentements
create policy consents_self_read on security_consents
  for select using (user_id = auth.uid());

-- Un user peut insérer ses consentements
create policy consents_self_insert on security_consents
  for insert with check (user_id = auth.uid());

-- Admin/RSSI lisent les consentements de leur org
create policy consents_admin_read on security_consents
  for select using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and exists (
      select 1 from profiles p
      where p.id = security_consents.user_id
        and p.organization_id = auth.current_org_id()
    )
  );

-- Pas de UPDATE/DELETE — append-only imposé par la logique applicative

-- ──────────────────────────────────────────────────────────────────────────────
-- LEARNING_PATHS
-- ──────────────────────────────────────────────────────────────────────────────

create table learning_paths (
  id              uuid              primary key default gen_random_uuid(),
  organization_id uuid              not null references organizations on delete cascade,
  slug            text              not null,
  title           text              not null,
  description     text,
  target_role     user_role,
  target_difficulty module_difficulty,
  is_active       boolean           not null default true,
  created_at      timestamptz       not null default now(),
  updated_at      timestamptz       not null default now(),
  unique (organization_id, slug)
);

create index on learning_paths (organization_id);
create index on learning_paths (is_active);

create trigger set_updated_at_learning_paths
  before update on learning_paths
  for each row execute function tg_set_updated_at();

alter table learning_paths enable row level security;

create policy learning_paths_read on learning_paths
  for select using (
    organization_id = auth.current_org_id()
    and is_active = true
  );

create policy learning_paths_admin_write on learning_paths
  for all using (
    auth.current_profile_role() in ('admin', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- MODULES
-- ──────────────────────────────────────────────────────────────────────────────

create table modules (
  id               uuid               primary key default gen_random_uuid(),
  organization_id  uuid               not null references organizations on delete cascade,
  learning_path_id uuid               references learning_paths,
  slug             text               not null,
  title            text               not null,
  kind             module_kind        not null,
  difficulty       module_difficulty  not null default 'medium',
  estimated_minutes smallint          not null default 5,
  topic_tags       text[]             not null default '{}',
  body             jsonb              not null,             -- blocs de contenu structurés
  prerequisites    uuid[]             default '{}',
  is_published     boolean            not null default false,
  created_at       timestamptz        not null default now(),
  updated_at       timestamptz        not null default now(),
  unique (organization_id, slug)
);

comment on column modules.body is 'Contenu structuré en blocs (heading, paragraph, image, quiz, callout). Format : {blocks: Block[]}';
comment on column modules.topic_tags is 'Ex: ["phishing", "mobile_money", "orange_money"]. Utilisé par le moteur JIT.';

create index on modules (organization_id);
create index on modules (learning_path_id);
create index on modules (is_published);
create index on modules using gin (topic_tags);
create index on modules using gin (body jsonb_path_ops);

create trigger set_updated_at_modules
  before update on modules
  for each row execute function tg_set_updated_at();

alter table modules enable row level security;

create policy modules_user_read on modules
  for select using (
    organization_id = auth.current_org_id()
    and is_published = true
  );

create policy modules_admin_all on modules
  for all using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and organization_id = auth.current_org_id()
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- MODULE_COMPLETIONS
-- ──────────────────────────────────────────────────────────────────────────────

create table module_completions (
  id                  uuid               primary key default gen_random_uuid(),
  user_id             uuid               not null references profiles on delete cascade,
  module_id           uuid               not null references modules,
  status              completion_status  not null default 'started',
  score               numeric(5,2),
  time_spent_seconds  integer,
  trigger             text,              -- 'manual' | 'assigned' | 'jit_phishing' | 'jit_quiz_fail'
  started_at          timestamptz        not null default now(),
  completed_at        timestamptz,
  metadata            jsonb              not null default '{}'::jsonb
);

create index on module_completions (user_id);
create index on module_completions (module_id);
create index on module_completions (status);
create index on module_completions (completed_at desc);

alter table module_completions enable row level security;

-- Un user voit ses propres complétions
create policy completions_self_read on module_completions
  for select using (user_id = auth.uid());

-- Un user peut insérer/mettre à jour ses complétions
create policy completions_self_write on module_completions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin/RSSI lisent toutes les complétions de leur org
create policy completions_admin_read on module_completions
  for select using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and exists (
      select 1 from profiles p
      where p.id = module_completions.user_id
        and p.organization_id = auth.current_org_id()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- QUIZ_ATTEMPTS (append-only)
-- ──────────────────────────────────────────────────────────────────────────────

create table quiz_attempts (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references profiles,
  module_id         uuid        not null references modules,
  question_id       text        not null,     -- id de la question dans body jsonb
  answer            jsonb       not null,
  is_correct        boolean     not null,
  time_to_answer_ms integer,
  created_at        timestamptz not null default now()
);

comment on table quiz_attempts is 'Append-only. Ne jamais UPDATE ni DELETE. Historique utilisé pour le scoring.';

create index on quiz_attempts (user_id, created_at desc);
create index on quiz_attempts (module_id);
create index on quiz_attempts (user_id, question_id, created_at desc);

alter table quiz_attempts enable row level security;

create policy quiz_self_read on quiz_attempts
  for select using (user_id = auth.uid());

create policy quiz_self_insert on quiz_attempts
  for insert with check (user_id = auth.uid());

create policy quiz_admin_read on quiz_attempts
  for select using (
    auth.current_profile_role() in ('admin', 'rssi', 'super_admin')
    and exists (
      select 1 from profiles p
      where p.id = quiz_attempts.user_id
        and p.organization_id = auth.current_org_id()
    )
  );

commit;
