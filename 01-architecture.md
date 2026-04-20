# 01 — Architecture technique

## 1. Principe directeur

**Monolithe modulaire sur Supabase + Next.js App Router.**

Pas de micro-services prématurés. L'architecture doit rester **lisible par un seul ingénieur** sur les 12 mois du contrat, et transférable à une équipe SONABHY en fin de mission. Chaque complexité ajoutée doit être justifiée par un besoin mesurable.

## 2. Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────┐
│                        UTILISATEURS                              │
│   Employés SONABHY (web + mobile PWA)    Admins / RSSI (web)     │
└───────────────┬──────────────────────────────┬───────────────────┘
                │                              │
                │ HTTPS                        │ HTTPS + MFA
                ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 15 (Vercel EU-West)                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ App Router     │  │ Route Handlers │  │ Server Actions     │  │
│  │ (RSC + client) │  │ (/api/*)       │  │ (mutations)        │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
└───────────────┬──────────────────────────────────────────────────┘
                │ supabase-js (anon key + RLS)
                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SUPABASE (EU-West)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ Postgres │  │   Auth   │  │ Storage  │  │ Edge Functions  │   │
│  │  + RLS   │  │  (MFA)   │  │(contenus)│  │   (Deno)        │   │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ pg_cron  │  pg_net  │  pgTAP  │  pgvector (recherche)    │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────┬──────────────────────────────────────────┬──────────────┘
         │                                          │
         ▼                                          ▼
┌─────────────────┐                      ┌──────────────────────┐
│   RESEND        │                      │   SENTRY             │
│ Emails phishing │                      │ Erreurs + perf       │
│ + notifications │                      │                      │
└─────────────────┘                      └──────────────────────┘
```

## 3. Choix techniques et justifications

### 3.1 Next.js 15 (App Router)

**Pourquoi.**
- React Server Components réduisent le JS client → critique en contexte faible bande passante Burkina.
- Server Actions simplifient les mutations sans API REST intermédiaire.
- PWA installable nativement, satisfait l'exigence « mode offline partiel ».
- Déploiement Vercel EU-West → latence acceptable depuis Ouagadougou (~150-200ms).

**Alternatives écartées.**
- Remix : bonne DX mais écosystème déploiement moins mature, moins de devs locaux familiers.
- SvelteKit : plus léger, mais équipe réduite et courbe d'apprentissage pour un potentiel successeur SONABHY.
- Nuxt/Vue : pas d'argument technique décisif, et Aristide est TS/React natif.

### 3.2 Supabase (Postgres + Auth + Storage + Edge Functions)

**Pourquoi.**
- Un seul fournisseur pour 80 % des besoins → réduction de la surface opérationnelle.
- RLS Postgres offre une sécurité **au niveau base de données**, pas seulement au niveau applicatif. C'est structurellement plus solide que « toutes les autorisations dans une couche middleware ».
- Auth intégré avec MFA TOTP, magic link, OTP SMS — tout ce qu'il faut.
- Realtime sur Postgres pour le dashboard temps réel sans architecture WebSocket dédiée.
- Edge Functions (Deno) pour la logique lourde : envoi de campagnes, calcul de scoring nocturne.
- Open source → stratégie de sortie : self-host possible si SONABHY l'exige en Phase 3.

**Alternatives écartées.**
- Firebase : non-Postgres (NoSQL), pas de RLS au sens SQL, vendor lock-in plus fort.
- AWS Amplify : puissant mais surdimensionné, coûts imprévisibles, courbe raide.
- Backend Node custom + Postgres managé : ~3x plus de code à maintenir, pas de bénéfice compensateur.

### 3.3 PostgreSQL comme source unique de vérité

Toute donnée métier vit dans Postgres. Pas de MongoDB, pas de Redis (sauf cache Next.js natif), pas de stockage dual.

**Exceptions autorisées :**
- Supabase Storage pour les contenus lourds (vidéos, PDF formation).
- Sentry pour les logs d'erreur (pas métier).

### 3.4 TypeScript strict partout

```jsonc
// tsconfig.json — extrait
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Types auto-générés depuis Supabase :

```bash
pnpm supabase gen types typescript --project-id "$PROJECT_REF" > packages/db/types.ts
```

## 4. Couches applicatives

```
┌──────────────────────────────────────────────────────┐
│ PRESENTATION                                         │
│ apps/web/app/**   RSC, pages, layouts, composants    │
└──────────────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────────────┐
│ ACTIONS / API                                        │
│ apps/web/app/api/*  + Server Actions                 │
│ Validation Zod, gestion erreurs, RBAC applicatif     │
└──────────────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────────────┐
│ DOMAIN SERVICES                                      │
│ packages/shared/services/  logique métier pure       │
│ scoring, simulation, learning, reporting             │
│ aucune dépendance framework, 100% testable           │
└──────────────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────────────┐
│ DATA ACCESS                                          │
│ packages/db/  queries Supabase typées                │
│ pas de query SQL brut ailleurs                       │
└──────────────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────────────┐
│ POSTGRES + RLS (source de vérité)                    │
└──────────────────────────────────────────────────────┘
```

**Règles d'importation :**
- Une couche ne peut importer que de la couche inférieure.
- Les services métier (`packages/shared/services/`) ne connaissent **pas** Next.js, ni React, ni Supabase client. Ils reçoivent un port (interface) et sont testables sans infra.

## 5. Rôles applicatifs et RBAC

| Rôle | Capacités principales |
|---|---|
| `user` | Suivre ses modules, répondre aux quiz, voir son score, signaler un email |
| `manager` | Tout `user` + voir les métriques agrégées de son département (anonymisées) |
| `security_champion` | Tout `user` + contenus avancés + accès à un canal de remontée |
| `admin` | Gestion utilisateurs, création campagnes, création modules |
| `rsssi` | Tout `admin` + accès aux rapports individuels (tracés en audit log) |
| `super_admin` | Tout `rsssi` + gestion des rôles, audit log, configuration plateforme |

Les rôles sont stockés dans `profiles.role` (enum Postgres) et **vérifiés par les policies RLS**, pas uniquement côté applicatif.

## 6. Flux critiques

### 6.1 Flux : un utilisateur reçoit un phishing simulé

```
1. Admin crée une campagne (dashboard) → insert dans phishing_campaigns
2. Scheduler (pg_cron) déclenche l'envoi à l'heure H
3. Edge Function "send-campaign" :
   - sélectionne les users cibles
   - génère un lien unique par user (token signé HMAC)
   - appelle Resend pour l'envoi
   - insert dans phishing_sends (statut: sent)
4. User reçoit l'email sur sa boîte pro
5a. User clique → hit /phishing/click?token=...
    - validation HMAC
    - insert phishing_events (type: click)
    - redirect vers page "formation immédiate" (JIT Learning)
    - lancement d'un micro-module sur le thème raté
5b. User signale l'email (bouton Outlook ou bouton PWA)
    - insert phishing_events (type: report) → BONUS au risk score
6. Edge Function "update-scores" (nightly) :
   - recalcule le risk_score de chaque user impacté
   - recalcule le CMI du département et de l'organisation
```

### 6.2 Flux : baseline T0

```
1. Enrôlement : upload CSV employés (ou SSO)
2. Email d'onboarding → consentement RGPD/loi 010-2004 → création compte
3. Quiz initial (15 questions, ~8 minutes, adaptatif basique)
4. Première simulation phishing (difficulté moyenne) 7 jours après
5. Computation du risk_score initial par user
6. Génération du rapport baseline T0 (PDF + dashboard)
```

### 6.3 Flux : dashboard RSSI temps réel

```
RSC (server) : initial state via queries Supabase (RLS garantit que le RSSI
               ne voit que SONABHY, pas d'autres tenants si multi-tenant
               Phase 3)
                │
                ▼
Client : subscribe Realtime sur vues agrégées (v_kpi_daily, v_cohort_score)
                │
                ▼
Updates live : nouveaux clics phishing, complétions, signalements
```

## 7. Multi-tenant : Phase 3

Pour la v1 (SONABHY seul), **pas de multi-tenancy**. Tout est single-tenant.

Mais le schéma est conçu pour supporter un `tenant_id` ultérieurement (colonne nullable au début, pas en clé). Ajouter un tenant = ajouter une colonne + ajuster les RLS, pas réécrire l'app. Cette décision est notée ici pour être défendable si SONABHY veut licencier la plateforme à d'autres entités publiques plus tard.

## 8. Performance & quotas

| Élément | Cible |
|---|---|
| TTFB dashboard | < 500ms p95 depuis Ouaga |
| Bundle JS initial page employé | < 150 KB gzipped |
| Envoi campagne 1000 emails | < 10 min |
| Calcul nightly scoring 5000 users | < 3 min |
| Disponibilité plateforme | 99.5 % (hors fenêtres de maintenance) |

## 9. Observabilité

- **Sentry** : erreurs front + back, breadcrumbs, release tracking.
- **Supabase Logs** : requêtes lentes, erreurs auth, erreurs RLS.
- **Table `audit_log`** : toute action sensible (accès données individuelles, modification rôle, envoi campagne, export rapport). Append-only, non modifiable, policy RLS spéciale.
- **Dashboard opérationnel interne** : `/admin/ops` — santé des jobs, taux d'erreur, throughput campagnes.

## 10. Arbre de décision : quand ajouter un service externe ?

```
Besoin identifié
      │
      ▼
Supabase le fait-il nativement ?  ──Oui──► Utiliser Supabase
      │ Non
      ▼
Est-ce critique (bloquant) ?  ──Non──► Reporter (YAGNI)
      │ Oui
      ▼
Est-ce dans les exigences contrat ? ──Non──► Valider avec Aristide avant
      │ Oui
      ▼
L'ajouter, documenter le choix dans ce fichier,
mettre à jour CLAUDE.md stack section
```

## 11. Choses qu'on NE fait PAS (et pourquoi)

| Non-choix | Raison |
|---|---|
| Kubernetes | 1 dev, pas de charge justifiant l'orchestration |
| Kafka / RabbitMQ | pg_net + pg_cron couvrent les besoins async actuels |
| GraphQL | REST + Server Actions suffisent, GraphQL ajoute complexité sans valeur ici |
| Microservices | Découpage logique suffit, découpage physique = dette opérationnelle |
| Redis cache dédié | Next.js cache + Postgres suffisent jusqu'à 50k users |
| ElasticSearch | pgvector + FTS Postgres couvrent la recherche de modules |
| MongoDB | Pas de besoin NoSQL, la structure des données est relationnelle |
| ML maison | Scoring heuristique pondéré suffit v1. ML = Phase 3 si données le permettent |
