# 07 — Contrat API & Edge Functions

> Source de vérité des endpoints. Toute route API ajoutée doit être documentée ici. Le contrat est versionné via le path (`/api/v1/...`).

## 1. Principes

- **REST par défaut**, Server Actions pour les mutations côté front Next.js.
- **Zod sur chaque input** — pas d'exception.
- **Réponses cohérentes** : succès → data ; erreur → `{ error: { code, message, details? } }`.
- **Codes HTTP** :
  - 200 : succès idempotent
  - 201 : création
  - 204 : succès sans contenu
  - 400 : input invalide (body)
  - 401 : non authentifié
  - 403 : authentifié mais non autorisé
  - 404 : ressource absente
  - 409 : conflit (ex. doublon)
  - 422 : validation échouée
  - 429 : rate limit
  - 500 : erreur serveur (log Sentry obligatoire)
- **Rate limiting** appliqué au niveau Edge (Vercel) + vérif applicative pour les routes sensibles.
- **Auditable** : toute route modifiant des données sensibles écrit dans `audit_log`.

## 2. Format d'erreur standardisé

```jsonc
{
  "error": {
    "code": "validation_error",       // kebab_case, stable
    "message": "Le champ email est invalide.",
    "details": {                       // optionnel, non sensible
      "field": "email",
      "reason": "format"
    }
  }
}
```

Codes stables (non exhaustif) :

- `unauthenticated`
- `forbidden`
- `not_found`
- `validation_error`
- `rate_limited`
- `conflict`
- `consent_missing`
- `mfa_required`
- `server_error`

## 3. Authentification

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/v1/auth/login` | POST | Délégué à Supabase Auth (email+password) |
| `/api/v1/auth/logout` | POST | Invalide la session |
| `/api/v1/auth/magic-link` | POST | Demande un magic link |
| `/api/v1/auth/mfa/enroll` | POST | Enrôle un TOTP |
| `/api/v1/auth/mfa/verify` | POST | Vérifie un code TOTP |
| `/api/v1/auth/mfa/recover` | POST | Procédure de récupération (via super_admin) |

Toutes protégées par rate limit (5 tentatives / 15 min / IP + email).

## 4. Utilisateurs

### 4.1 `GET /api/v1/me`

Retourne le profil de l'utilisateur courant.

**Réponse** :
```ts
type MeResponse = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: { id: string; name: string } | null;
  consents: Array<{ scope: ConsentScope; granted: boolean; grantedAt: string }>;
  enrolledAt: string | null;
  locale: string;
};
```

### 4.2 `GET /api/v1/me/score`

Retourne le score actuel de l'utilisateur et l'historique récent.

**Réponse** :
```ts
type MyScoreResponse = {
  current: RiskScoreBreakdown | null;
  history: Array<{ date: string; score: number }>;  // 90 derniers jours
  computationVersion: string;
};
```

### 4.3 `GET /api/v1/me/data-export`

**Droit d'accès** (loi 010-2004, art. 20). Retourne toutes les données personnelles.

- Auth : user connecté
- Rate limit : 1 / 24h
- Format : JSON ou ZIP (avec param `?format=zip`)
- Tracé : `audit_log` avec `action = 'data_export_request'`

### 4.4 `POST /api/v1/me/data-deletion-request`

Crée une demande de suppression. Ne supprime pas immédiatement (vérifications légales obligatoires).

- Auth : user connecté
- Workflow : notification RSSI, délai 30 jours
- Tracé : `audit_log` avec `action = 'data_deletion_request'`

### 4.5 `POST /api/v1/me/consents`

Accorde ou révoque un consentement.

**Body** :
```ts
{
  scope: ConsentScope;       // 'phishing_simulation' | 'behavior_analytics' | 'individual_reporting'
  granted: boolean;
}
```

- Auth : user connecté
- Effet : insert append-only dans `security_consents`
- Tracé : `audit_log` avec `action = 'consent_grant'` ou `consent_revoke`

## 5. Learning

### 5.1 `GET /api/v1/learning/assignments`

Modules assignés au user courant.

**Query params** :
- `status` : `active` | `completed` | `overdue` | `all` (défaut: active)
- `limit`, `cursor` (pagination curseur)

**Réponse** :
```ts
type AssignmentsResponse = {
  items: Array<{
    moduleId: string;
    title: string;
    kind: ModuleKind;
    estimatedMinutes: number;
    assignedAt: string;
    dueAt: string | null;
    status: CompletionStatus;
    trigger: string;
    lastScore: number | null;
  }>;
  nextCursor: string | null;
};
```

### 5.2 `GET /api/v1/learning/modules/:id`

Détail d'un module. Le body jsonb est retourné.

- Auth : user connecté (RLS filtrera selon rôle)
- Cache : ISR Next.js 60s (le contenu bouge peu)

### 5.3 `POST /api/v1/learning/modules/:id/start`

Démarre un module (crée un `module_completions` statut `started`).

### 5.4 `POST /api/v1/learning/modules/:id/answer`

Enregistre une réponse à une question de module.

**Body** :
```ts
{
  questionId: string;
  answer: unknown;        // validé selon le type de question
  timeToAnswerMs: number;
}
```

- Écrit dans `quiz_attempts` (append-only)

### 5.5 `POST /api/v1/learning/modules/:id/complete`

Finalise le module.

**Body** :
```ts
{
  timeSpentSeconds: number;
}
```

- Calcule le score total à partir des `quiz_attempts`
- Met à jour `module_completions` statut `completed`
- Met à jour `spaced_repetitions.next_due_at`
- Déclenche recalcul score (async via `pg_net`)

## 6. Simulations phishing

### 6.1 `GET /api/v1/admin/campaigns`

Liste les campagnes de l'org.

- Auth : `admin`, `rssi`, `super_admin`
- Pagination curseur

### 6.2 `POST /api/v1/admin/campaigns`

Crée une campagne (statut `draft`).

**Body** :
```ts
{
  name: string;
  templateId: string;
  targetCohortFilter: {
    departmentIds?: string[];
    roles?: UserRole[];
    sites?: string[];
    exclusions?: string[];   // user ids à exclure
  };
  scheduledAt?: string;      // ISO date
}
```

- Auth : `admin`, `rssi`
- Valide : consentements suffisants dans la cohorte (> 90 % sinon warning)
- Tracé : `audit_log` avec `action = 'create_campaign'`

### 6.3 `POST /api/v1/admin/campaigns/:id/launch`

Passe la campagne en `scheduled`.

- Auth : `admin`, `rssi`
- MFA récent obligatoire (< 15 min)
- Tracé : `audit_log` avec `action = 'launch_campaign'` + justification optionnelle

### 6.4 `POST /api/v1/admin/campaigns/:id/cancel`

Annule une campagne (seulement si pas encore envoyée).

- Auth : `admin`, `rssi`
- Tracé : `audit_log`

### 6.5 `GET /api/v1/admin/campaigns/:id/metrics`

Métriques agrégées d'une campagne.

**Réponse** :
```ts
type CampaignMetrics = {
  campaignId: string;
  status: CampaignStatus;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
  clickRate: number;       // 0-1
  reportRate: number;      // 0-1
  dwellTimeMedianMs: number | null;
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    sent: number;
    clicked: number;
    reported: number;
    clickRate: number;
  }>;
  // ⚠️ Pas de données individuelles ici
};
```

### 6.6 `GET /p/click?t={token}` (public, tracking)

Route publique qui reçoit les clics phishing.

- Pas d'auth
- Validation HMAC du token
- Insert `phishing_events` type `clicked`
- Redirect 302 vers `/p/land/{slug}` ou 404 si token invalide

### 6.7 `POST /p/submit-fake` (public, fake submit)

Reçoit les tentatives de submit sur landing fake.

- **Ne lit pas les valeurs du formulaire** (seul le fait du submit compte)
- Body attendu : `{ token: string }`
- Insert `phishing_events` type `submitted_credentials`
- Redirect vers page JIT Learning

### 6.8 `POST /api/v1/phishing/report`

Un user signale un email comme suspect.

**Body** :
```ts
{
  token?: string;           // si bouton signaler dans une simulation
  rawEmail?: string;        // si signalement manuel (copie du contenu)
}
```

- Auth : user connecté
- Écrit `phishing_events` type `reported` (si token matche une campagne)
- Sinon : crée un ticket pour revue admin (pourrait être un vrai phishing)
- Bonus score appliqué au prochain calcul

## 7. Reporting

### 7.1 `GET /api/v1/reports/org/kpis`

KPIs organisationnels agrégés.

- Auth : `admin`, `rssi`, `manager` (filtré à son département)
- Query : `from`, `to`, `granularity` (day/week/month)

**Réponse** :
```ts
type OrgKpisResponse = {
  organizationId: string;
  period: { from: string; to: string };
  cmi: { current: number; previous: number; delta: number };
  coverage: { enrolled: number; active30d: number; total: number };
  phishing: {
    clickRate: number;
    reportRate: number;
    clickRateTrend: Array<{ date: string; value: number }>;
    reportRateTrend: Array<{ date: string; value: number }>;
  };
  learning: {
    completionRate: number;
    avgQuizScore: number;
  };
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    cmi: number;
    clickRate: number;
    completionRate: number;
  }>;
};
```

### 7.2 `POST /api/v1/reports/export`

Génère un rapport (PDF ou CSV).

**Body** :
```ts
{
  type: 'monthly_exec' | 'quarterly_full' | 'campaign_debrief' | 'custom';
  period: { from: string; to: string };
  filters?: { departmentIds?: string[] };
  format: 'pdf' | 'csv';
  scope: 'aggregate' | 'individual';  // 'individual' réservé à RSSI + justification
}
```

- Auth : `admin`, `rssi`
- Si `scope = 'individual'` : champ `justification` obligatoire, MFA récent, `audit_log` avec `action = 'view_individual_report'`
- Retourne un job id ; le PDF est généré en arrière-plan (Edge Function) et récupéré via `/api/v1/reports/download/:jobId`

### 7.3 `GET /api/v1/reports/download/:jobId`

Télécharge le rapport généré. Signature URL à durée limitée (Supabase Storage).

## 8. Admin — gestion utilisateurs

### 8.1 `POST /api/v1/admin/users/bulk-import`

Import CSV d'utilisateurs.

- Auth : `admin`, `super_admin`
- Body : multipart/form-data, fichier CSV
- Validation : colonnes obligatoires, format emails, pas de doublons, < 5000 lignes
- Retour : résumé (créés / ignorés / erreurs)
- **Ne déclenche pas** d'envoi automatique de campagne. L'enrôlement suit son propre flux (consentement requis).

### 8.2 `PATCH /api/v1/admin/users/:id`

Met à jour un profil user.

- Auth : `admin`, `super_admin`
- Champs modifiables : `departmentId`, `role`, `jobTitle`, `site`, `managerId`, `isActive`
- Changement de rôle = `audit_log` avec `action = 'role_change'`

### 8.3 `POST /api/v1/admin/users/:id/disable`

Désactive un compte (user parti).

- Auth : `admin`, `super_admin`
- Effet : `isActive = false`, sessions invalidées, exclusion des prochaines campagnes
- Purge différée selon politique (section 6.4 du doc sécurité)

## 9. Security Champions

### 9.1 `GET /api/v1/champions`

Liste des Security Champions de l'org.

- Auth : `admin`, `rssi`, `security_champion`

### 9.2 `POST /api/v1/champions/:userId/nominate`

Nomme un user Security Champion.

- Auth : `admin`, `rssi`
- Effet : change le rôle en `security_champion` (si confirmation user)
- Send : email de notification + parcours dédié

### 9.3 `POST /api/v1/champions/reports`

Un Champion remonte un signal faible (ex. email suspect croisé en interne).

**Body** :
```ts
{
  category: 'suspicious_email' | 'phishing_attempt' | 'social_engineering' | 'other';
  description: string;
  attachments?: string[];     // storage paths
}
```

## 10. Edge Functions (Supabase, Deno)

Routes internes, appelées par `pg_cron` ou webhooks. Non exposées à l'utilisateur final.

| Function | Trigger | Rôle |
|---|---|---|
| `send-campaign` | Cron 5 min | Envoie les campagnes scheduled |
| `compute-scores` | Cron 02:00 UTC | Calcule snapshots quotidiens |
| `refresh-mv` | Cron 02:15 UTC | Rafraîchit les materialized views |
| `generate-report` | Invoqué par `/api/v1/reports/export` | Génère PDF/CSV |
| `process-bounce-webhook` | Webhook Resend | Traite les bounces |
| `purge-expired-data` | Cron mensuel | Applique la politique de rétention |

Chaque Edge Function :
- Utilise le `SUPABASE_SERVICE_ROLE_KEY` (jamais côté client)
- Log structuré (JSON)
- Erreurs remontées dans Sentry
- Idempotente dans la mesure du possible

## 11. Pagination

Curseur opaque, jamais offset (performance + stabilité).

```ts
type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
  prevCursor: string | null;
};
```

Query params : `?limit=50&cursor=...` (limit max 100, défaut 20).

## 12. Versioning

- Préfixe `/api/v1/...` dès le début.
- Une rupture de contrat majeure = `/api/v2/...` avec co-existence pendant 6 mois.
- Pas de breaking change sur v1 sans avertissement + plan de migration.

## 13. OpenAPI

Le contrat sera matérialisé dans un fichier `docs/appendix/openapi.yaml` (à générer à partir des schémas Zod via `zod-to-openapi`). Sert :
- Documentation générée (Swagger UI à `/docs/api`)
- Génération de clients SDK pour intégrations futures
- Tests de contrat en CI
