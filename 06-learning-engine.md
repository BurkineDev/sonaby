# 06 — Learning Engine

> Objectif : **comportement, pas connaissance**. On ne forme pas des experts cyber, on installe des réflexes. Modules courts (3-5 min), déclenchés au bon moment, testés par l'action. La mémorisation passe par la répétition espacée et par le Just-In-Time.

## 1. Principes de design pédagogique

1. **Micro-learning** : 3-5 minutes max. Au-delà, le taux de complétion mobile s'effondre.
2. **JIT (Just-In-Time)** : la formation la plus efficace est celle qui arrive **juste après** l'erreur. Un module déclenché par un clic phishing a 5× plus d'impact qu'un module programmé le mois suivant.
3. **Répétition espacée** : un concept revu après 1j / 7j / 30j est ancré. Plateforme rappelle automatiquement.
4. **Gamification sobre** : badges, streaks, progression. **Pas** de classement public (contraire aux règles d'éthique).
5. **Mobile-first** : 80 % des complétions se feront sur téléphone. La conception démarre mobile.
6. **Accessibilité** : contrastes WCAG AA minimum, sous-titres sur les vidéos, alternatives texte aux interactions complexes.
7. **Ton adulte, pas infantilisant.** Pas de "Bravo champion !". Reconnaissance factuelle et respectueuse.

## 2. Taxonomie des modules

### 2.1 Par format (`kind`)

| Kind | Durée | Usage |
|---|---|---|
| `micro_lesson` | 3-5 min | Pilier : concept + exemple + check rapide |
| `quiz` | 2-3 min | Mesure connaissance déclarative |
| `video` | 2-4 min | Introduction émotionnelle, storytelling |
| `scenario` | 5-7 min | Interactif — l'utilisateur *fait* des choix dans une situation |
| `jit_remediation` | 3-4 min | Déclenché après erreur, ciblé sur le thème raté |

### 2.2 Par niveau

- **Niveau 1 — Hygiène de base** : mots de passe, MFA, reconnaître un phishing basique.
- **Niveau 2 — Pratiques avancées** : social engineering, gestion des documents, mobilité.
- **Niveau 3 — Contextes spécifiques** : cadres, RH, DSI, terrain, direction.
- **Niveau Champions** : threat intel, veille, remontée d'incidents.

### 2.3 Par thème (topic_tags)

```
phishing_email
phishing_sms
phishing_whatsapp
mobile_money
credentials_management
mfa_usage
physical_security
usb_and_removable
travel_security
byod
secure_comms
data_classification
incident_reporting
social_engineering
supply_chain
executive_fraud
```

## 3. Parcours adaptatifs

Un parcours (`learning_path`) = séquence de modules avec logique de personnalisation.

### 3.1 Parcours standard

| Parcours | Public | Durée | Modules |
|---|---|---|---|
| "Socle cyber" | Tous les nouveaux | 4 semaines | 8 modules Niv.1 |
| "Hygiène quotidienne" | Tous (annuel) | 2 semaines | 5 modules de rappel |
| "Cadres et direction" | Rôle manager+ | 6 semaines | 10 modules Niv.2 + Niv.3 |
| "RH et données sensibles" | Département RH | 4 semaines | 6 modules spécialisés |
| "Terrain et mobilité" | Sites déportés | 3 semaines | 5 modules, focus BYOD & offline |
| "Security Champions" | Volontaires | 8 semaines | 12 modules avancés |

### 3.2 Logique d'adaptation

```
À l'enrôlement :
  → assigner "Socle cyber"

Après baseline T0 :
  → si risk_score < 40 → ajouter modules Niv.1 de rattrapage
  → si risk_score > 70 → proposer "Security Champions" (volontaire)

Après échec quiz :
  → assigner module de la thématique ratée (répétition espacée +7j)

Après clic phishing simulé :
  → déclencher JIT sur le topic du phishing
  → programmer un refresh à 30j

Après signalement phishing :
  → pas d'assignation, bonus XP
  → éventuel parcours "Champions" proposé

Tous les 90 jours :
  → évaluation : si régression > 10 pts → "Hygiène quotidienne" auto
```

### 3.3 Règles d'assignation

- Un user ne doit jamais avoir plus de **3 modules en cours simultanés**.
- Si une assignation dépasse la limite, elle est mise en file d'attente et débloquée à la complétion.
- Les rappels (répétition espacée) sont envoyés par notification in-app + email digest hebdo (jamais en push intrusif).
- Le user peut repousser un module une fois (snooze 48h). Deuxième snooze = escalade au manager (statistique, pas nominale).

## 4. Structure d'un module (contenu)

Le contenu est stocké dans `modules.body jsonb` sous forme de **blocs** (inspiré Notion). Permet évolution sans migration, et rendu composable.

### 4.1 Schéma Zod des blocs

```ts
export const BlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), level: z.union([z.literal(1), z.literal(2), z.literal(3)]), text: z.string() }),
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string()) }),
  z.object({ type: z.literal('image'), src: z.string(), alt: z.string(), caption: z.string().optional() }),
  z.object({ type: z.literal('video'), src: z.string(), poster: z.string().optional(), captionsTrack: z.string().optional() }),
  z.object({ type: z.literal('callout'), variant: z.enum(['info','warning','success','danger']), text: z.string() }),
  z.object({
    type: z.literal('quiz_question'),
    id: z.string(),
    question: z.string(),
    kind: z.enum(['single', 'multi', 'truefalse']),
    choices: z.array(z.object({
      id: z.string(),
      label: z.string(),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })),
    feedback: z.object({
      correct: z.string(),
      incorrect: z.string(),
    }),
  }),
  z.object({
    type: z.literal('scenario_step'),
    id: z.string(),
    situation: z.string(),
    choices: z.array(z.object({
      id: z.string(),
      label: z.string(),
      outcome: z.string(),
      riskImpact: z.number(), // -10 à +10
      nextStepId: z.string().optional(),
    })),
  }),
]);

export const ModuleBodySchema = z.object({
  blocks: z.array(BlockSchema),
  estimatedMinutes: z.number(),
  learningObjectives: z.array(z.string()),
});
```

### 4.2 Exemple : micro-lesson "Reconnaître un phishing mobile money"

```json
{
  "learningObjectives": [
    "Identifier 3 signaux d'un SMS phishing Orange/Moov Money",
    "Adopter le réflexe de vérification par canal officiel"
  ],
  "blocks": [
    { "type": "heading", "level": 1, "text": "Le piège du SMS 'compte suspendu'" },
    { "type": "paragraph", "text": "Vous recevez un SMS : 'Votre compte Orange Money est suspendu. Cliquez sur ce lien pour le réactiver.' Que faites-vous ?" },
    { "type": "image", "src": "/assets/sms-phishing-om.png", "alt": "Exemple de SMS frauduleux mimant Orange Money" },
    { "type": "callout", "variant": "warning", "text": "Orange Money et Moov Money ne demandent JAMAIS vos identifiants par SMS ou email." },
    { "type": "heading", "level": 2, "text": "Les 3 signaux qui trahissent l'arnaque" },
    { "type": "list", "ordered": true, "items": [
      "L'URL ne se termine pas par orange.bf ou moov.bf",
      "Le message crée de l'urgence (suspension, délai)",
      "Le numéro d'envoi est un numéro long, pas un short code officiel"
    ]},
    {
      "type": "quiz_question",
      "id": "q1",
      "kind": "single",
      "question": "Que faire si vous recevez ce type de SMS ?",
      "choices": [
        { "id": "a", "label": "Cliquer pour vérifier", "isCorrect": false, "explanation": "Jamais. Le lien peut voler vos identifiants." },
        { "id": "b", "label": "Appeler le 1010 (Orange) ou le 5555 (Moov) pour vérifier", "isCorrect": true, "explanation": "Exactement. Canal officiel = seule source fiable." },
        { "id": "c", "label": "Supprimer immédiatement", "isCorrect": false, "explanation": "Pas suffisant : signaler permet de protéger vos collègues." }
      ],
      "feedback": {
        "correct": "Bonne réponse. Le réflexe 'canal officiel' vous protège à vie.",
        "incorrect": "Le bon réflexe : ne jamais cliquer, et appeler le service client officiel."
      }
    },
    { "type": "callout", "variant": "success", "text": "Réflexe à retenir : doute → canal officiel." }
  ],
  "estimatedMinutes": 4
}
```

## 5. Just-In-Time Learning : le mécanisme central

### 5.1 Déclencheurs

| Événement | JIT déclenché |
|---|---|
| `phishing_events.type = 'clicked'` | Module JIT sur le topic du template |
| `phishing_events.type = 'submitted_credentials'` | Module JIT + module "Que faire en cas de compromission" |
| Échec quiz (score < 50 %) | Module de rattrapage sur le thème |
| 3 modules en retard | Rappel empathique, pas de pénalité nouvelle |

### 5.2 Flux post-clic

```
Instant 0 : User clique sur le lien phishing simulé
            └── Redirigé vers /p/land/{slug}

Instant +3s : Bandeau "Ceci était une simulation"
             └── CTA "Voir ce qui s'est passé"

Instant +10s : Page de debrief personnel
              ├── Rappel de l'email reçu
              ├── Les 3-5 indices qu'il fallait voir
              ├── Module JIT court (3 min) directement intégré
              └── Quiz final (2 questions) = validation

Persistance : module_completions (trigger = 'jit_phishing')
              Programmer rappel +30j (répétition espacée)
```

### 5.3 Pourquoi ça marche

- Le cerveau **encode** l'erreur dans son contexte. Apprendre 3 minutes après la faute ≈ apprendre 30 minutes en formation froide.
- **Immédiateté** = pas d'évitement. En formation classique, 40 % des users ne complètent jamais. Ici, on est au rendez-vous.
- **Spécificité** : la formation colle exactement à la faute, pas à un programme général.

## 6. Répétition espacée

Principe : un concept maîtrisé s'oublie selon la courbe d'Ebbinghaus. La répétition espacée optimise la rétention.

### 6.1 Algorithme (simplifié SM-2)

```
À la complétion d'un module avec score:
  - score ≥ 80 %  → prochain rappel J+30
  - score 60-79 % → prochain rappel J+14
  - score 40-59 % → prochain rappel J+7
  - score < 40 %  → module assigné à nouveau J+3

À la complétion du rappel :
  - si score ≥ 80 % → prochain J+60, puis J+120, puis archivage
  - sinon → reset cycle
```

### 6.2 Implémentation

Table `spaced_repetitions` :

```sql
create table spaced_repetitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  module_id uuid not null references modules,
  next_due_at timestamptz not null,
  interval_days integer not null,
  repetition_count integer not null default 0,
  last_score numeric(5,2),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, module_id)
);

create index on spaced_repetitions(next_due_at) where not is_archived;
```

Un job `pg_cron` quotidien génère les rappels : sélectionne les `next_due_at <= now()`, crée une notification in-app, envoie un email digest (si plusieurs dues dans la journée, regrouper).

## 7. Gamification — bien dosée

### 7.1 Éléments utilisés

| Élément | Raison |
|---|---|
| **Badges thématiques** | Reconnaissance, persistance (ex: "Vigilance Mobile Money") |
| **Streak** (jours actifs consécutifs) | Adhésion à la régularité, pas à l'intensité |
| **Progression** (% parcours) | Rend visible l'effort |
| **Security Champion status** | Reconnaissance sociale positive, opt-in |

### 7.2 Éléments **refusés**

| Refusé | Pourquoi |
|---|---|
| Classement public des users | Humiliation, violation vie privée |
| Points XP convertibles en avantages | Distord les motivations, éthiquement douteux |
| "Leaderboard" de départements nominatif | Idem, favorise la compétition toxique |
| Alerte manager sur retard | Transforme l'outil en flicage, casse la confiance |

### 7.3 Badges — liste initiale

- **Sentinelle** : 5 signalements phishing légitimes.
- **Immunité** : 10 simulations non cliquées d'affilée.
- **Persévérance** : streak 30 jours.
- **Expert Mobile Money** : parcours Mobile Money complet à > 85 %.
- **Ambassadeur** : a complété le parcours Security Champion.
- **Veilleur** : premier à signaler un template mensuel.

## 8. Mode offline / faible connectivité

Exigence contractuelle forte. Implémentation PWA :

- **Service Worker** cache :
  - Les 3 prochains modules assignés à un user (pré-chargement au login).
  - Les modules terminés (consultation historique).
  - Les assets statiques (images, CSS, JS).
- **Complétion offline** possible :
  - Réponses stockées dans IndexedDB.
  - Synchronisation au retour en ligne (file d'attente + retry).
- **Indicateur UI** clair : "Mode hors ligne - vos réponses seront synchronisées".
- **Limites** : les simulations phishing nécessitent une connexion (tracking). Les landing fake fonctionnent offline mais le submit est mis en file.

## 9. Production de contenu

### 9.1 Workflow

```
Idée module → brief → rédaction FR-BF → revue pédagogique (Aristide)
    → revue sécurité (consultant cyber) → validation finale (RSSI)
    → publication (is_published = true)
```

### 9.2 Quantité cible

| Période | Nombre de modules |
|---|---|
| M1 | 15 modules de base (socle cyber) |
| M2-M3 | +10 modules spécialisés (rôles) |
| M4-M6 | +15 modules (scenarios, JIT variantes) |
| M7-M12 | +20 modules (saisonniers, avancés, champions) |

Objectif 12 mois : **60 modules actifs**, révision continue (8-10 modules "rafraîchis" par an).

### 9.3 Kit de production

- Template Figma pour visuels cohérents (design system section UX).
- Banque d'images libres (Unsplash, Pexels) + illustrations Afrique commandées à un illustrateur local (budget M2).
- Banque de voix off FR-BF (partenariat avec un studio local pour les vidéos Phase 2).
- Charte rédactionnelle (prochaine itération).

## 10. Analytics pédagogiques

### 10.1 Par module

- Taux de complétion (débuté vs terminé)
- Score moyen
- Question la plus ratée (identifier les zones floues)
- Temps médian passé (détecter les modules trop longs)
- Taux d'abandon par bloc (détecter les décrochages)

### 10.2 Par parcours

- Taux de complétion global
- Courbe d'abandon
- Corrélation avec l'évolution du risk_score (est-ce que compléter ce parcours améliore réellement le comportement ?)

### 10.3 Feedback utilisateur

À la fin de chaque module, micro-sondage optionnel (3 questions max) :
- Utile ? (1-5)
- Clair ? (1-5)
- Suggestion ? (texte libre, max 200 car)

Remonté dans un backlog produit mensuel.

## 11. Tests

- **Accessibilité** : audit axe-core en CI, lecture au lecteur d'écran sur 2 modules par PR.
- **Performances mobile** : Lighthouse > 85 sur 3G.
- **Rendu contenu** : snapshot tests sur les blocs (rendu HTML stable).
- **Logique pédagogique** : tests unitaires sur l'algorithme de répétition espacée, sur les déclenchements JIT.
- **E2E (Playwright)** : parcours utilisateur complet (démarrer module → répondre quiz → voir score → retrouver dans l'historique).
