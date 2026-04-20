# 03 — Sécurité & Conformité

> Ce document est la référence absolue pour toute décision touchant à la sécurité, aux données personnelles ou à la conformité. En cas de conflit avec un autre document, **celui-ci gagne**.

## 1. Principes directeurs

1. **Fail closed, log loud.** En cas de doute sur une autorisation ou une entrée : on refuse et on journalise. Jamais l'inverse.
2. **Defense in depth.** Pas de maillon unique. RLS + validation applicative + rate limiting + audit log.
3. **Least privilege.** Chaque rôle a le minimum de droits nécessaires. Chaque clé technique a le minimum de scopes.
4. **Secrets never in code.** Jamais. Audit `gitleaks` en pre-commit obligatoire.
5. **Zero nominal exposure.** Les rapports agrégés sont la norme ; les rapports individuels nécessitent une justification tracée.
6. **Privacy by design et par défaut.** Toute nouvelle feature doit répondre à : quelle donnée ? pourquoi ? combien de temps ? qui y accède ?

## 2. Cadre légal applicable

### 2.1 Burkina Faso — Loi n° 010-2004/AN

**Loi du 20 avril 2004** portant protection des données à caractère personnel. Autorité de contrôle : **CIL-BF** (Commission de l'Informatique et des Libertés).

Exigences clés appliquées au projet :

| Exigence légale | Implémentation dans la plateforme |
|---|---|
| Consentement préalable du salarié pour traitement | Table `security_consents`, scope `phishing_simulation` + `behavior_analytics` + `individual_reporting` recueillis séparément lors de l'enrôlement |
| Information claire sur la finalité | Page d'onboarding avec texte validé par le RSSI, archivée avec la version |
| Droit d'accès | Endpoint `/api/me/data-export` : export JSON de toutes les données relatives au user |
| Droit de rectification | Interface profil + workflow de contact du RSSI |
| Droit d'opposition / retrait du consentement | Bouton révocation → nouvelle ligne `security_consents granted=false` ; exclusion des futures campagnes |
| Durée de conservation limitée | Politique : données individuelles 24 mois après fin de contrat, agrégats 5 ans. Jobs `pg_cron` de purge |
| Sécurité des traitements | RLS, TLS 1.2+, MFA admin, chiffrement au repos (Supabase), audit log |
| Transfert hors territoire | Hébergement Supabase EU-West par défaut. Option région Afrique à étudier si CIL-BF l'exige |

### 2.2 RGPD (UE) — applicable si hébergement EU

L'hébergement par défaut étant EU-West, le RGPD s'applique en complément. Principes alignés avec la loi 010-2004 + exigences additionnelles :

- **DPIA** (Data Protection Impact Assessment) documentée dans `docs/appendix/dpia.md` (à produire Phase 1).
- **Registre des traitements** tenu par WendTech, copie remise à SONABHY.
- **Notification de violation** sous 72h en cas d'incident affectant des données personnelles.

### 2.3 Référentiels internationaux alignés

- **ISO/IEC 27001** : contrôles de sécurité de l'information. Non certifiable à notre échelle, mais les contrôles pertinents sont appliqués.
- **OWASP ASVS v4.0 niveau 2** : cible minimum de l'application web.
- **OWASP Top 10** : couvert par les sections 4 et 5 ci-dessous.
- **NIST SP 800-50 / 800-16** : programmes de sensibilisation — référentiel de contenu pédagogique.

## 3. Authentification & autorisation

### 3.1 Authentification

- **Supabase Auth** comme fournisseur. Providers activés v1 :
  - Email + mot de passe (obligatoire)
  - Magic link (fallback pour terrain)
  - TOTP (obligatoire pour `admin`, `rssi`, `super_admin`)
- Politique mot de passe : 12 caractères minimum, pas de liste de mots de passe communs (intégration `haveibeenpwned` via Edge Function à l'inscription).
- **Aucun SMS OTP** tant que la couverture réseau Burkina ne le justifie pas en second facteur fiable — alternative : magic link + TOTP.

### 3.2 Session

- Cookies HttpOnly, Secure, SameSite=Lax.
- Durée : 8h actives + refresh, révocables depuis le profil admin.
- Invalidation forcée sur : changement de mot de passe, changement de rôle, révocation de consentement, détection d'anomalie.

### 3.3 MFA obligatoire

| Rôle | MFA requis |
|---|---|
| `user` | Recommandé, non bloquant |
| `manager` | Recommandé, non bloquant |
| `security_champion` | Recommandé |
| `admin` | **Obligatoire** (bloque l'accès tant que non configuré) |
| `rssi` | **Obligatoire** |
| `super_admin` | **Obligatoire** |

Toute action sensible (export de rapport, lecture d'un score individuel, création de campagne) requiert une **réauthentification MFA récente** (< 15 min).

### 3.4 Autorisation

- **RLS Postgres** = défense principale. Voir `02-data-model.md` section 5.
- **Middleware Next.js** = défense de profondeur côté serveur (vérifie le rôle avant même la requête SQL).
- **Guard client** = UX (masquer les boutons), jamais sécurité.

```ts
// apps/web/lib/auth/require-role.ts
export async function requireRole(
  allowed: UserRole[],
): Promise<Profile> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !allowed.includes(profile.role)) {
    await logAudit({
      actorId: user.id,
      action: 'access_denied',
      metadata: { required: allowed, actual: profile?.role },
    });
    redirect('/forbidden');
  }
  return profile;
}
```

## 4. OWASP Top 10 — couverture explicite

| OWASP 2021 | Risque | Mitigation |
|---|---|---|
| A01 Broken Access Control | Un user voit/modifie ce qu'il ne devrait pas | RLS sur toutes les tables, `requireRole` middleware, tests Playwright par rôle |
| A02 Cryptographic Failures | Secrets en clair, TLS faible | HTTPS forcé (HSTS), TLS 1.2+, secrets uniquement en env Vercel/Supabase, chiffrement au repos géré par Supabase (AES-256) |
| A03 Injection | SQLi, XSS, command injection | Zod sur tous les inputs, requêtes Supabase paramétrées uniquement, CSP stricte, `dangerouslySetInnerHTML` interdit (ESLint rule) |
| A04 Insecure Design | Architecture qui contourne la sécurité | Threat modeling par feature sensible (campagnes, rapports individuels), revue Aristide |
| A05 Security Misconfiguration | Headers, verbosité erreurs | Headers via `next.config.js` (voir 4.1), messages d'erreur génériques en prod, Sentry pour détails |
| A06 Vulnerable Components | CVE dans deps | `pnpm audit` en CI, Dependabot actif, politique : pas de dep < 6 mois sans revue |
| A07 Identification & Auth Failures | Brute force, session fixation | Rate limiting login (5/15 min), rotation token après login, invalidation MFA |
| A08 Software & Data Integrity | Dépendances compromises, upload malicieux | `pnpm-lock.yaml` strict, Subresource Integrity sur CDN, scan antivirus sur uploads (ClamAV côté Edge Function) |
| A09 Security Logging Failures | Pas de trace d'incident | `audit_log` append-only, Sentry, retention 12 mois minimum |
| A10 SSRF | Requêtes serveur vers URL controlée par attaquant | Aucune requête externe basée sur input user direct ; allowlist de domaines pour le webhook Resend |

### 4.1 Headers HTTP sécurisés

```ts
// next.config.js — extrait
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // revoir pour nonce
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  },
];
```

## 5. Protection spécifique aux simulations phishing

C'est **le risque juridique principal du projet.** Une campagne mal cadrée peut :
- Violer la vie privée (loi 010-2004)
- Déclencher une action prud'homale si un employé se sent piégé
- Entacher la relation client avec SONABHY

### 5.1 Règles dures

1. **Consentement explicite** : un user qui n'a pas de ligne `security_consents` avec `scope = 'phishing_simulation'` et `granted = true` n'est **jamais** ciblé par une campagne. Filtre appliqué au niveau du service `buildCampaignTargets`.

2. **Domaines dédiés** : les emails phishing simulés sont envoyés depuis `@securite-sonabhy.training` (ou similaire), **jamais** depuis un domaine usurpé de tiers réels (pas d'usurpation de `orangemoneyafrica.com`, on crée `orange-money-bf.info`).

3. **Landing pages claires** : après un clic, l'utilisateur voit **immédiatement** un bandeau « Ceci était une simulation de sécurité CyberGuard » avec explication et formation. Pas de piège prolongé.

4. **Pas de collecte réelle** : si l'utilisateur saisit ses identifiants sur la landing fake, on logue `submitted_credentials` mais **les champs ne sont jamais stockés**. Le formulaire a un `onSubmit` qui ne transmet que le fait du submit, pas les valeurs.

5. **Pas de campagne hors heures ouvrables** sans validation RSSI (éviter : email piège le samedi à 23h).

6. **Pas de ciblage individuel** en première année. Les campagnes ciblent des cohortes (département, site, rôle), jamais un individu isolé.

7. **Debrief obligatoire** : chaque campagne génère une communication post-mortem publique (anonymisée) destinée à tous les employés.

### 5.2 Documentation légale par campagne

Chaque campagne créée produit un artefact « Fiche de campagne » qui documente :

- Objectif pédagogique
- Cohorte ciblée et volumétrie
- Template utilisé et son contenu
- Date d'envoi prévue
- Consentements vérifiés (compteurs)
- Validation RSSI (signature électronique ou approbation horodatée dans l'app)

Ce document est archivé et peut être produit en cas de contestation.

## 6. Gestion des données sensibles

### 6.1 Classification

| Classe | Exemples | Stockage | Accès |
|---|---|---|---|
| **Public** | Titres de modules, brand assets | Repo + Storage | Tous |
| **Interne** | KPIs agrégés, cohort scores | Postgres | Users SONABHY |
| **Confidentiel** | Scores individuels, logs phishing individuels | Postgres chiffré au repos | RSSI + user concerné |
| **Sensible** | `auth.users`, `audit_log` | Postgres restreint | Super admin uniquement |

### 6.2 PII (données à caractère personnel)

- Nom, prénom, email, département, site, manager.
- **Pas** de : numéro de téléphone personnel, date de naissance, NNI, adresse personnelle. Si SONABHY en fournit, on **refuse** : ces données ne sont pas nécessaires au traitement.
- Minimisation : principe directeur.

### 6.3 Chiffrement

| Niveau | Mécanisme |
|---|---|
| Transport | TLS 1.2+ obligatoire, HSTS, certs gérés par Vercel/Cloudflare |
| Repos (base) | AES-256 Supabase (géré fournisseur) |
| Repos (storage) | AES-256 Supabase Storage |
| Secrets applicatifs | Env variables Vercel (chiffrées), jamais en clair dans le repo |
| Tokens phishing | HMAC-SHA256 signé avec secret dédié, rotation annuelle |
| Backups | Chiffrés au repos, rétention 30 jours, restauration testée tous les trimestres |

### 6.4 Durée de conservation et purge

| Donnée | Durée | Méthode |
|---|---|---|
| Compte utilisateur actif | Durée du contrat SONABHY | — |
| Compte utilisateur parti | 24 mois (loi travail) puis anonymisation | Job `pg_cron` mensuel |
| Événements phishing individuels | 24 mois glissants | Job nightly |
| Risk scores individuels | 24 mois glissants | Job nightly |
| Cohort scores (agrégés, non nominatifs) | 60 mois | — |
| Audit log | 60 mois (exigences traçabilité) | — |
| Consentements | Conservés indéfiniment (preuve) | — |

### 6.5 Export et suppression sur demande

- `GET /api/me/data-export` → JSON de toutes les données du user. Authentifié, rate-limité 1/24h.
- `POST /api/me/data-deletion-request` → crée une demande, notifie le RSSI, workflow à valider manuellement (compatibilité obligations légales de conservation).

## 7. Threat model résumé

### 7.1 Acteurs de menace

| Acteur | Motivation | Capacité | Priorité |
|---|---|---|---|
| Employé curieux | Voir le score d'un collègue | Faible (utilisateur légitime) | Haute (fréquent) |
| Manager opportuniste | Identifier "mauvais élèves" pour sanction | Moyenne | Haute |
| Admin véreux | Manipuler scores, exfiltrer données | Élevée | Moyenne |
| Attaquant externe opportuniste | Vol de comptes par phishing inversé | Moyenne | Haute |
| Attaquant ciblé (APT) | Compromettre SONABHY via la plateforme | Élevée | Moyenne (rare mais critique) |
| Concurrent WendTech | Voler le savoir-faire (templates, scoring) | Moyenne | Faible-Moyenne |

### 7.2 Top 10 scénarios à couvrir explicitement

1. Un manager tente de voir le risk_score individuel d'un employé → **bloqué par RLS**, audit_log.
2. Un admin consulte un rapport individuel sans justification → **forcé par UI**, audit_log avec champ `justification` obligatoire.
3. Un employé tente de signaler un email en fournissant un token falsifié → **HMAC invalide**, rejet, audit_log.
4. Une campagne est lancée sur un user sans consentement → **bloqué par filtre serveur**, test E2E dédié.
5. Un attaquant tente un brute force login → **rate limit** 5/15min par IP + 5 par email.
6. Un utilisateur soumet ses identifiants sur la landing fake → **champs non envoyés au serveur**, seul l'événement est loggé.
7. Un bot crawle les emails phishing envoyés et clique tous les liens → **détection via user-agent + dwell time anormalement bas**, exclusion des stats de la campagne.
8. Un admin compromis tente d'exfiltrer la table `profiles` → **volume d'export tracé**, alerte Sentry si > seuil.
9. Un développeur push un `service_role` key par erreur → **gitleaks en pre-commit + CI**, rotation immédiate si détecté.
10. Supabase subit une panne → **dégradation gracieuse** : lecture seule via cache Next.js ISR, page de maintenance sinon.

## 8. Réponse à incident

### 8.1 Catégorisation

| Niveau | Exemple | Délai de réponse | Communication |
|---|---|---|---|
| P0 – Critique | Fuite de données, plateforme down > 1h | < 1h | SONABHY + CIL-BF dans les 72h si PII |
| P1 – Majeur | MFA cassé, scoring incorrect sur toute l'org | < 4h | SONABHY DSI immédiat |
| P2 – Mineur | Bug UI, métrique erronée sur une cohorte | < 24h | Canal standard |
| P3 – Cosmétique | Typo, défaut graphique | < 1 semaine | Backlog |

### 8.2 Plan de réponse P0

1. **Contenir** : couper le vecteur (désactiver campagne, révoquer clé, rollback déploiement).
2. **Tracer** : figer les logs, snapshot base, audit log.
3. **Analyser** : reconstruction chronologique.
4. **Notifier** : SONABHY DSI dans l'heure, CIL-BF si PII affecté sous 72h.
5. **Corriger** : hotfix + post-mortem publié sous 7 jours.
6. **Apprendre** : mise à jour des contrôles + test de régression.

## 9. Revues de sécurité

| Fréquence | Type |
|---|---|
| À chaque PR | Revue automatique (lint, types, audit deps) |
| À chaque PR touchant authn/authz/audit | Revue manuelle obligatoire Aristide |
| Hebdo | Revue Sentry + alertes |
| Mensuel | Revue audit_log + anomalies |
| Trimestriel | Revue menaces + scope élargi (consultant cyber externe) |
| Annuel | Pentest externe (si budget contractuel) |

## 10. Contacts & escalade

| Rôle | Contact | Responsabilité |
|---|---|---|
| Tech Lead WendTech | Aristide | Détection, contention, correction |
| RSSI SONABHY | À définir en kickoff | Décision métier, communication interne |
| Consultant cyber externe | À définir | Expertise forensique, revues |
| CIL-BF | cil@gov.bf (à vérifier) | Notification violation PII |

*À mettre à jour au kickoff projet avec les contacts réels.*
