# 04 — Scoring Engine

> Le Risk Score est **le produit**. Tout ce qui précède (learning, simulation) sert à l'alimenter. Tout ce qui suit (reporting, décisions) en dépend. Ce moteur doit être : **explicable, défendable, versionné, auditable**.

## 1. Philosophie

- **Un score individuel** = 0 à 100, où 100 = comportement exemplaire, 0 = risque maximal.
- **Un score organisationnel** (Cyber Maturity Index, CMI) = composite, 0 à 100.
- **Calcul transparent** : chaque user peut voir comment son score est construit.
- **Versionné** : chaque calcul stocke la version (`v1.2.0`) du moteur. Changer la formule n'invalide pas l'historique.
- **Résistant aux manipulations** : un user ne peut pas "farmer" son score artificiellement.
- **Décroissance temporelle** : un bon comportement ancien pèse moins qu'un bon comportement récent. Un score ne peut pas être "acquis à vie".

## 2. Composantes du score individuel

```
Risk Score (0-100) = w_q · Q  +  w_p · P  +  w_e · E  +  B_report
                     ─────────────────────────────────   ────────
                             composante "base"            bonus

avec :  w_q = 0.35   (Quiz)
        w_p = 0.45   (Phishing behavior)
        w_e = 0.20   (Engagement)
        B_report ∈ [0, 5]   (Bonus signalement, plafonné)
        Q, P, E ∈ [0, 100]

Invariant : Risk Score ∈ [0, 100] (clampé si B_report dépasse)
```

Les poids sont dans une table de configuration (`scoring_config`) versionnée, pas en dur. Le RSSI peut ajuster après revue trimestrielle.

### 2.1 Composante Quiz (Q)

Mesure la connaissance déclarative : l'utilisateur sait-il reconnaître les menaces ?

```
Q = moyenne pondérée par difficulté des quiz_attempts des 90 derniers jours
    avec facteur de décroissance exponentielle
```

Formule :

```
Q = Σ( score_i · difficulté_i · exp(-λ_q · Δt_i) ) / Σ( difficulté_i · exp(-λ_q · Δt_i) )

où :
  score_i     ∈ {0, 1} pour chaque question (ou 0-100 pour quiz composite)
  difficulté_i ∈ {1, 2, 3} pour easy/medium/hard
  Δt_i         = jours écoulés depuis la tentative
  λ_q          = 0.011  (demi-vie ≈ 63 jours)
```

**Intuition** : une bonne réponse d'il y a 2 mois compte pour 50 %, d'il y a 6 mois pour 8 %.

**Anti-farming** : chaque question n'est comptée qu'une fois par fenêtre de 30 jours même si retentée.

### 2.2 Composante Phishing (P)

Mesure le comportement réel. C'est la composante qui compte le plus.

```
P_user = 100 − pénalités + bonus (plafonné [0, 100])

pénalités :
  clicked_only                  = -8  · facteur_difficulté · decay
  clicked + submitted           = -20 · facteur_difficulté · decay
  attachment_opened             = -15 · facteur_difficulté · decay

bonus :
  reported_before_clicking      = +15 · facteur_difficulté · decay
  reported_after_clicking       = +5  · decay             (partie saine)

facteur_difficulté : {1.0 easy, 1.3 medium, 1.6 hard}
decay = exp(-λ_p · Δt)   avec λ_p = 0.008  (demi-vie ≈ 87 jours)
```

**Invariants** :
- Un user qui n'a jamais reçu de campagne a `P = null` → traité comme score médian (50) tant que pas baseline.
- Si `P < 0` après pénalités : clampé à 0.
- Si `P > 100` : clampé à 100.

### 2.3 Composante Engagement (E)

Mesure la discipline : le user complète-t-il ses parcours assignés ?

```
E = 0.5 · completion_rate_90d  +  0.3 · streak_factor  +  0.2 · jit_compliance

completion_rate_90d = modules terminés / modules assignés (90 derniers jours) × 100
streak_factor       = min(semaines consécutives avec activité, 12) / 12 × 100
jit_compliance      = modules JIT complétés / modules JIT déclenchés × 100
```

**Intuition** : un user qui a cliqué sur un phishing mais a complété le module JIT immédiatement derrière n'est **pas dans la même catégorie** qu'un user qui ignore la formation. Le JIT compliance capture cette nuance.

### 2.4 Bonus signalement (B_report)

Récompense la culture proactive. Plafonné pour éviter le farming.

```
B_report = min(5, nb_signalements_légitimes_90d × 0.5)

Un signalement "légitime" = signaler un email phishing avant d'avoir cliqué dessus,
                            ou signaler un email suspect réel (validé par l'admin).
```

## 3. Cas limites explicites

| Situation | Comportement |
|---|---|
| User vient d'être enrôlé (< 7 jours) | Score = null, affichage "En cours de baseline" |
| User jamais touché par une campagne phishing | `P = 50` par défaut, indiqué dans l'UI |
| User avec 1 seule tentative de quiz (à 100 %) | `Q = 100` mais indicateur "Données limitées" |
| User parti (désactivé) | Score figé au dernier snapshot, exclu des agrégats |
| User réenrôlé après départ | Reset complet (règle RGPD : pas de chaîne infinie) |
| Révocation de consentement | Score existant gelé, plus de nouveaux calculs, agrégats recalculés sans ce user |

## 4. Cyber Maturity Index (CMI) — score organisationnel

Ne pas confondre avec une moyenne bête. Le CMI capture **5 dimensions** de la maturité.

```
CMI = 0.25 · D_couverture
    + 0.25 · D_comportement
    + 0.20 · D_apprentissage
    + 0.15 · D_culture
    + 0.15 · D_résilience

chaque D ∈ [0, 100]
```

### 4.1 Dimensions détaillées

| Dimension | Mesure | Poids |
|---|---|---|
| **D_couverture** | % employés enrôlés × % actifs 30 derniers jours | 25 % |
| **D_comportement** | Moyenne pondérée des `P_user` actifs | 25 % |
| **D_apprentissage** | Moyenne pondérée des `Q_user` + complétion globale | 20 % |
| **D_culture** | Report Rate organisation + nombre de Security Champions actifs | 15 % |
| **D_résilience** | Progression (Δ CMI sur 90 jours) + temps de réaction moyen à une nouvelle menace | 15 % |

### 4.2 Pourquoi ce design ?

- **D_couverture** est la base. Un super CMI sur 10 % des employés ne veut rien dire.
- **D_comportement** pèse autant que la couverture : on mesure ce qui se passe vraiment.
- **D_culture** inclut le Report Rate — c'est un KPI positif, mesure une attitude proactive, pas juste l'absence d'erreur.
- **D_résilience** récompense la progression. Une org qui passe de 40 à 60 est plus mature qu'une org stable à 70. Important commercialement : démontre la **valeur ajoutée WendTech sur 12 mois**.

### 4.3 Bandes d'interprétation

| CMI | Bande | Interprétation |
|---|---|---|
| 0 – 30 | Critique | Risque humain élevé, aucune culture, priorité absolue |
| 31 – 50 | Insuffisant | Culture émergente, résultats irréguliers, en construction |
| 51 – 70 | Acceptable | Culture installée, quelques zones à risque, continuer l'effort |
| 71 – 85 | Mature | Culture intégrée, comportements réflexes majoritaires |
| 86 – 100 | Exemplaire | Référence sectorielle, auto-entretien du niveau |

Ces bandes sont affichées dans le dashboard RSSI avec coloration.

## 5. Implémentation

### 5.1 Architecture

```
┌─────────────────────────────────────┐
│  Edge Function: compute-scores      │
│  - Exécutée chaque nuit à 02:00 UTC │
│  - Idempotente (rejouable)          │
│  - Versionnée (tag version)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  packages/shared/services/scoring   │
│  ┌──────────────────────────────┐   │
│  │ computeQuizComponent()       │   │
│  │ computePhishingComponent()   │   │
│  │ computeEngagementComponent() │   │
│  │ computeReportBonus()         │   │
│  │ computeRiskScore()           │   │
│  │ computeCMI()                 │   │
│  └──────────────────────────────┘   │
│  Logique pure, testable, sans I/O   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  packages/db/queries/scoring.ts     │
│  - fetchUserEvents(userId, days)    │
│  - saveRiskSnapshot(...)            │
│  - saveCohortSnapshot(...)          │
└─────────────────────────────────────┘
```

### 5.2 Typages

```ts
// packages/shared/services/scoring/types.ts
export type ScoringConfig = {
  version: string;           // "v1.2.0"
  weights: {
    quiz: number;            // 0.35
    phishing: number;        // 0.45
    engagement: number;      // 0.20
  };
  decay: {
    quiz: number;            // lambda_q
    phishing: number;        // lambda_p
  };
  penalties: {
    clicked: number;
    submitted: number;
    attachment: number;
  };
  bonuses: {
    reportedBeforeClick: number;
    reportedAfterClick: number;
    reportCap: number;
  };
  difficultyFactors: Record<'easy'|'medium'|'hard', number>;
};

export type RiskScoreBreakdown = {
  userId: string;
  snapshotDate: string;
  score: number;             // 0-100
  components: {
    quiz: number;
    phishing: number;
    engagement: number;
    reportBonus: number;
  };
  dataQuality: {
    hasBaseline: boolean;
    hasRecentQuiz: boolean;
    hasReceivedPhishing: boolean;
    daysSinceEnrollment: number;
  };
  version: string;
};
```

### 5.3 Fonction de scoring principale (pseudocode typé)

```ts
export function computeRiskScore(
  input: UserScoringInput,
  config: ScoringConfig,
  now: Date = new Date(),
): RiskScoreBreakdown {
  const q = computeQuizComponent(input.quizAttempts, config, now);
  const p = computePhishingComponent(input.phishingEvents, config, now);
  const e = computeEngagementComponent(input.moduleCompletions, input.assignedModules, now);
  const b = computeReportBonus(input.phishingEvents, config, now);

  const base =
    config.weights.quiz * q +
    config.weights.phishing * p +
    config.weights.engagement * e;

  const score = clamp(base + b, 0, 100);

  return {
    userId: input.userId,
    snapshotDate: formatDate(now),
    score: round(score, 2),
    components: {
      quiz: round(q, 2),
      phishing: round(p, 2),
      engagement: round(e, 2),
      reportBonus: round(b, 2),
    },
    dataQuality: buildDataQuality(input, now),
    version: config.version,
  };
}
```

### 5.4 Décroissance exponentielle

```ts
export function decay(lambda: number, daysAgo: number): number {
  return Math.exp(-lambda * daysAgo);
}

// Demi-vie = ln(2) / lambda
// Pour demi-vie de 63 jours : lambda = ln(2)/63 ≈ 0.011
```

## 6. Configuration runtime

Table `scoring_config` :

```sql
create table scoring_config (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,        -- 'v1.2.0'
  config jsonb not null,
  activated_at timestamptz,
  deactivated_at timestamptz,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

-- Une seule config active à la fois (enforced via trigger)
create unique index scoring_config_active_unique
  on scoring_config((1)) where deactivated_at is null and activated_at is not null;
```

Changer la config = insérer une nouvelle ligne, désactiver l'ancienne. L'historique est intact, les snapshots passés référencent leur version.

## 7. Job nocturne

### 7.1 Pseudocode

```
1. Charger config active
2. Pour chaque user actif :
     a. Fetch events + attempts + completions (fenêtre 120 jours)
     b. Compute RiskScore
     c. Upsert risk_scores (user_id, today)
3. Pour chaque département :
     a. Agrégation des scores individuels du jour
     b. Calcul CMI par dimension
     c. Upsert cohort_scores
4. Agrégation organisation entière → cohort_scores (department_id NULL)
5. Refresh materialized views KPI
6. Log : nombre de snapshots produits, durée, erreurs
7. Alerte Sentry si durée > SLA ou erreurs > 1 %
```

### 7.2 Idempotence

Le job doit pouvoir être rejoué sans dégâts. Upsert sur `(user_id, snapshot_date)` → si déjà calculé, écrasement sûr (même version et données → même résultat).

### 7.3 Backfill

Une commande CLI permet de recalculer les snapshots historiques après changement de version :

```bash
pnpm scoring:backfill --from 2026-01-01 --to 2026-04-15 --version v1.2.0
```

Produit une **nouvelle série** de snapshots étiquetés `v1.2.0`, laissant les anciens intacts. Le dashboard peut afficher "Recalculé rétroactivement avec v1.2.0" pour transparence.

## 8. Tests — non négociables

### 8.1 Unit tests (Vitest)

- Chaque composante (Q, P, E, B) testée avec cas connus.
- Décroissance : 0j → 1.0, 90j (λ_q) → ~0.37, infini → 0.
- Clamps : inputs extrêmes produisent 0 et 100 exactement.
- Edge cases explicites (voir section 3).

### 8.2 Golden tests

Un jeu de données de référence (`tests/fixtures/scoring-golden.json`) avec 20 profils utilisateurs synthétiques et leurs scores attendus. Toute modification du moteur qui change un golden score doit être **explicite** (nouveau test + changelog).

### 8.3 Property-based (optionnel)

Avec `fast-check` :
- Score toujours dans [0, 100]
- Monotonicité : ajouter un bon comportement ne diminue jamais le score
- Monotonicité inverse : ajouter une pénalité ne l'augmente jamais
- Décroissance : même événement plus ancien pèse moins

### 8.4 Integration

- Job nocturne exécuté sur seed local → vérifier que le snapshot est créé et cohérent.
- Changement de version → ancienne data préservée, nouvelle data étiquetée.

## 9. Transparence utilisateur

Dans l'UI employé, une page **"Pourquoi ce score ?"** :

```
Votre score : 72 / 100

Décomposé comme suit :
  Connaissance (Quiz)     ..........  78   [Votre poids: 35%]
  Comportement (Phishing)  ..........  68   [Votre poids: 45%]
  Engagement              ..........  85   [Votre poids: 20%]
  Bonus Signalement       ..........  +2

Évolution sur 90 jours : +14 points (amélioration)
Dernière mise à jour : il y a 14 heures

[i] Le score diminue avec le temps si vos comportements ne sont pas maintenus.
    Un clic sur un email phishing simulé réduit le score de 8 à 20 points
    selon la difficulté.
```

Cette transparence est **stratégique** : elle transforme le score d'une menace ("on me note") en un outil ("je vois comment progresser").

## 10. Anti-patterns à éviter

| Mauvaise idée | Pourquoi c'est mauvais |
|---|---|
| Moyenne simple des composantes | Ne reflète pas la réalité du risque |
| Score absolu sans décroissance | Un user qui cartonne une fois reste bien noté à vie → faux sens de sécurité |
| Classement public des users | Violation vie privée + démotive les derniers |
| Lier le score au management de performance RH | Contraire à l'éthique + illégal sans consentement spécifique |
| Un seul chiffre sans contexte | Le dashboard doit toujours décomposer |
| Changer la formule sans versioning | Invalide l'historique, impossible à défendre en audit |
