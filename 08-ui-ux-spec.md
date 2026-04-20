# 08 — UX / UI Spec

> Le design doit réconcilier **trois publics** : l'employé terrain (mobile, peu de temps), le manager (desktop, curiosité tactique), le RSSI / Comex (desktop, vision stratégique). Trois surfaces, une cohérence.

## 1. Principes

1. **Mobile-first sur les parcours employés.** 80 % de l'usage employé sera téléphone. Tout commence par le viewport 375px.
2. **Desktop-first sur l'admin et le reporting.** Un RSSI consulte depuis son bureau ; un dashboard projetable en Comex est un livrable contractuel.
3. **Sobriété.** Pas de hero flashy, pas de dégradés agressifs. Ceci est un outil professionnel, pas une gamification enfantine.
4. **Lisibilité d'abord.** Typographie généreuse, contrastes AA minimum, lignes de 60-75 caractères.
5. **Performance perçue.** Skeleton loaders, transitions courtes, rien qui dépasse 200ms sans indicateur de progression.
6. **Français Afrique de l'Ouest** dans les textes — pas de « gamification » ni « empowerment », mais « sensibilisation » et « vigilance ».

## 2. Stack design

- **Tailwind CSS** pour l'utilitaire
- **shadcn/ui** pour les primitives (Radix sous le capot)
- **Lucide** pour les icônes
- **Recharts** pour les graphiques (intégration native React)
- **Figma** pour les maquettes (source partagée Aristide + designer)
- **Design tokens** centralisés dans `packages/shared/design-tokens`

## 3. Design tokens

### 3.1 Couleurs (sémantiques avant tout)

```ts
export const colors = {
  // Surface
  bg: { DEFAULT: '#FAFAF9', subtle: '#F5F5F4', muted: '#E7E5E4' },
  surface: { DEFAULT: '#FFFFFF', elevated: '#FFFFFF' },

  // Texte
  fg: { DEFAULT: '#1C1917', muted: '#57534E', subtle: '#78716C' },

  // Accent produit (bleu sobre, inspiré sécurité institutionnelle)
  primary: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    500: '#2563EB',
    600: '#1D4ED8',
    700: '#1E40AF',
    900: '#1E3A8A',
  },

  // Sémantique risque (utilisé partout : badge score, bandes CMI)
  risk: {
    critical: '#B91C1C',   // 0-30
    high:     '#D97706',   // 31-50
    medium:   '#CA8A04',   // 51-70
    low:      '#15803D',   // 71-85
    excellent:'#0F766E',   // 86-100
  },

  // Feedback
  success: '#15803D',
  warning: '#B45309',
  danger:  '#B91C1C',
  info:    '#1D4ED8',
};
```

Pas de violet, pas de néon. Le produit doit sentir l'institutionnel solide.

### 3.2 Typographie

- **Famille principale** : Inter (web-safe, bon support cyrillique/grec non nécessaire).
- **Famille display** (titres dashboard) : Inter en weight 600/700.
- **Monospace** (scores, dates, ids) : JetBrains Mono.
- **Échelle** :
  - `text-xs` 12px — métadonnées
  - `text-sm` 14px — texte secondaire
  - `text-base` 16px — lecture par défaut
  - `text-lg` 18px — emphase
  - `text-xl` 20px — sous-titres
  - `text-2xl` 24px — titres de section
  - `text-3xl` 30px — titres de page
  - `text-4xl` 36px — valeurs KPI clés

### 3.3 Spacing, radius, shadows

- Spacing sur échelle Tailwind (4/8/12/16/24/32…). Rien en dehors sans raison.
- Radius : `rounded-md` (6px) par défaut, `rounded-lg` (8px) pour les cartes.
- Shadows : uniquement `shadow-sm` et `shadow` — pas de drop shadow spectaculaire.

### 3.4 Densité

Deux densités disponibles :
- **Confort** (défaut employé) : interlignes aérés, cibles tactiles ≥ 44px.
- **Compact** (admin/reporting) : tableaux denses, activable par préférence user.

## 4. Composants clés

### 4.1 Score Card (Risk Score utilisateur)

```
┌───────────────────────────────────┐
│  Votre score de sécurité          │
│                                   │
│        72 / 100                   │
│        ━━━━━━━━━━━━━━━━━━━━       │
│        ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱         │
│                                   │
│  Progression +14 pts sur 90j ↑    │
│                                   │
│  Dernière mise à jour 14h         │
│  [i] Comment est calculé mon score│
└───────────────────────────────────┘
```

- Couleur du score selon la bande (risk tokens).
- Toujours afficher : valeur, bande, évolution, timestamp, lien transparence.
- Jamais afficher : comparaison nominale avec d'autres users.

### 4.2 KPI Card (dashboard exécutif)

```
┌───────────────────────────────────┐
│ TAUX DE CLIC PHISHING             │
│                                   │
│  12,3 %                    ↓      │
│                                   │
│  −4,1 pts vs trimestre précédent  │
│                                   │
│  [sparkline 90 jours]             │
└───────────────────────────────────┘
```

Caractéristiques :
- Valeur en grand (text-4xl)
- Tendance explicite (↑ rouge, ↓ vert — pour un clic rate, baisse = bon)
- Période de comparaison écrite
- Mini-graphique (sparkline) pour le contexte

### 4.3 CMI Gauge

Jauge semi-circulaire 0-100 avec bandes colorées. Affichée sur le dashboard RSSI.

### 4.4 Module Card (employé, mobile)

```
┌─────────────────────────────────┐
│ 🎯 À faire                      │
│ Reconnaître un phishing         │
│ Mobile Money                    │
│                                 │
│ 🎧 Module court · 4 min         │
│                                 │
│ [Commencer]                     │
└─────────────────────────────────┘
```

- Emoji contextuel en en-tête
- Titre court
- Métadonnées : type + durée
- CTA primaire seul

### 4.5 Email Report Button

Composant réutilisable "Signaler comme suspect" : bouton discret mais toujours visible dans les emails d'entraînement (lorsqu'un email phishing simulé est reçu). Transforme un réflexe passif en action mesurable.

## 5. Trois surfaces, trois ambiances

### 5.1 Espace Employé (mobile-first)

- **Navigation bottom-bar** à 4 onglets : Accueil, Parcours, Score, Profil.
- **Accueil** : score + 2-3 modules à faire + badges récents + bulletin récent.
- **Parcours** : liste des modules assignés, ordre suggéré, filtre par statut.
- **Score** : détail du score, courbe 90j, décomposition transparente.
- **Profil** : préférences, consentements (gestion granulaire), export de données.

### 5.2 Espace Manager (desktop)

- **Dashboard département** : CMI du département, tendances, top 3 modules complétés/ratés.
- **Vue cohorte** : listing des users de son département, avec statuts agrégés (actif, en cours, en retard) — **jamais** le score individuel.
- **Export** : rapport mensuel de son département (agrégé).

### 5.3 Espace Admin / RSSI (desktop, dense)

- **Overview** : CMI global, couverture, tendances, alertes.
- **Campaigns** : liste, création, détail avec métriques temps réel.
- **Content** : gestion modules et templates (CRUD).
- **Users** : annuaire, imports, changement de rôles.
- **Reports** : génération, historique, téléchargement.
- **Audit** : log consultable (super_admin uniquement).
- **Settings** : configuration org, scoring config, branding.

## 6. Dashboard exécutif "Comex-ready"

Spec particulière : le RSSI doit pouvoir **ouvrir ce dashboard et le projeter en Codir sans préparation**. Cela conditionne :

1. **Une seule page qui répond aux 3 questions du Codir** :
   - Où en sommes-nous ? (CMI, couverture)
   - Où progressons-nous ? (tendances 3/6/12 mois)
   - Quels sont les risques ? (zones à risque, actions recommandées)

2. **Lisibilité à distance** : titres 24px+, valeurs 36px+, pas d'élément indispensable en dessous de 14px.

3. **Mode présentation** : un toggle "Plein écran" qui masque navigation et affiche les KPIs dans une grille 2x3 optimisée projection.

4. **Export PDF paginé** : A4 paysage, charte SONABHY en en-tête, daté. Génération en < 10 sec.

5. **Pas de drill-down individuel** visible par défaut. Disponible uniquement pour RSSI avec justification.

### Layout suggéré (wireframe textuel)

```
╔══════════════════════════════════════════════════════════════╗
║  CyberGuard SONABHY                        18 avril 2026     ║
║  Tableau de bord direction                                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   ┌────────────────┐  ┌──────────────┐  ┌──────────────┐     ║
║   │  CMI actuel    │  │  Couverture  │  │  Clics phish │     ║
║   │     68         │  │   94 %       │  │   12,3 %     │     ║
║   │  Mature        │  │  +2 pts      │  │  −4,1 pts    │     ║
║   └────────────────┘  └──────────────┘  └──────────────┘     ║
║                                                              ║
║   ┌──────────────────────────────────────────────┐           ║
║   │  Évolution du CMI sur 12 mois                │           ║
║   │  [graphique ligne 1200px×400px]              │           ║
║   └──────────────────────────────────────────────┘           ║
║                                                              ║
║   ┌────────────────────────┐  ┌────────────────────────┐     ║
║   │ Top 3 progression      │  │ Top 3 zones à renforcer│     ║
║   │ 1. DSI       +22 pts   │  │ 1. LOGISTIQUE  48 CMI  │     ║
║   │ 2. COMMERCIAL +18 pts  │  │ 2. DIRECTION   52 CMI  │     ║
║   │ 3. RH         +12 pts  │  │ 3. TECHNIQUE   55 CMI  │     ║
║   └────────────────────────┘  └────────────────────────┘     ║
║                                                              ║
║   ┌──────────────────────────────────────────────┐           ║
║   │  Recommandations du moteur (non contractuel) │           ║
║   │  • Focus LOGISTIQUE : campagne SMS Q2        │           ║
║   │  • Module "Fraude au président" pour cadres  │           ║
║   │  • Nomination 2 Security Champions DIRECTION │           ║
║   └──────────────────────────────────────────────┘           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## 7. Parcours utilisateur canoniques (user journeys)

### 7.1 Première connexion employé (onboarding)

```
1. Email d'invitation → lien magique
2. Login → vérification email
3. Écran "Bienvenue" → présentation 30 sec du programme
4. Écran consentements : 3 switchs indépendants
   - Simulations phishing (recommandé)
   - Analyse comportementale (recommandé)
   - Rapports individuels accessibles au RSSI (facultatif)
   Lien "En savoir plus" → texte légal complet
5. Mot de passe défini → MFA proposé (non bloquant user)
6. Quiz baseline T0 (8 min, 15 questions)
7. Dashboard accueil avec premier module suggéré
```

### 7.2 Après un clic phishing simulé

```
1. Click → landing fake visuellement crédible
2. +3s : bandeau "Ceci était une simulation"
3. Bouton "Voir ce qui s'est passé" (pas "OK")
4. Debrief personnel :
   - Rappel de l'email reçu (capture)
   - "Voici les 4 indices à repérer"
   - Micro-module 3 min intégré
   - Quiz 2 questions
5. "Merci d'avoir participé à cet entraînement" (pas "Vous avez échoué")
6. Retour dashboard, score visiblement impacté mais explicable
7. Rappel programmé J+30 pour renforcer
```

Ton **adulte et factuel** — ni moralisateur ni condescendant.

### 7.3 Création d'une campagne (admin)

```
1. /admin/campaigns → "Nouvelle campagne"
2. Étape 1 — Choisir un template (catalogue filtrable par topic/difficulté/canal)
3. Étape 2 — Cibler une cohorte (filtres + preview du nombre d'users éligibles)
4. Étape 3 — Planifier (date/heure, exclusions jours fériés)
5. Étape 4 — Revue : tous les paramètres, checks consentement, validation éthique
6. Bouton "Envoyer à validation RSSI" (workflow 2 yeux pour campagnes > 500 users)
7. Après approbation RSSI, campagne passe en scheduled
```

### 7.4 Génération d'un rapport individuel (RSSI)

Cas sensible, workflow strict :

```
1. /admin/users/:id → "Rapport individuel"
2. Modal "Pourquoi avez-vous besoin de ce rapport ?"
   - Champ justification OBLIGATOIRE (min 50 caractères)
   - Choix du motif (enquête, demande user, audit, autre)
3. MFA challenge (TOTP)
4. Audit log entry créée immédiatement
5. Rapport généré, téléchargement signé valide 1h
6. Notification au super_admin (défense en profondeur)
```

## 8. Accessibilité

- **WCAG 2.1 niveau AA** cible obligatoire.
- Tous les inputs ont un label visible ou un `aria-label`.
- Contrast ratio ≥ 4.5:1 sur le texte normal, ≥ 3:1 sur gros texte.
- Tab order logique sur toutes les vues.
- Trap focus dans les modales, `Esc` ferme.
- Annotations ARIA sur les graphiques (description textuelle alternative).
- Sous-titres obligatoires sur toutes les vidéos modules.
- Dark mode en Phase 2 (pas critique v1).

## 9. Performance budget

| Mesure | Cible | Critère bloquant CI |
|---|---|---|
| First Contentful Paint | < 1.5s (4G) | Warning si > 2s |
| Largest Contentful Paint | < 2.5s (4G) | Blocking si > 4s |
| CLS | < 0.1 | Blocking si > 0.25 |
| Bundle JS initial (page employé) | < 150 KB gzipped | Blocking si > 200 KB |
| Lighthouse score | > 85 mobile | Warning si < 80 |

CI Playwright + Lighthouse sur les 3 pages critiques : login, dashboard employé, module.

## 10. Mode offline (PWA)

- **Service Worker** avec stratégie stale-while-revalidate pour assets, cache-first pour modules pré-chargés.
- **Indicateur hors ligne** : bandeau haut de page, jamais masqué.
- **Queue de synchronisation** : indicateur du nombre d'actions en attente.
- **Conflits** : last-write-wins avec warning si détection de conflit.
- **Manifest PWA** : installable depuis le navigateur, icône, splash screen, thème couleur.

## 11. Internationalisation

- **Seule langue v1** : Français FR-BF.
- **Préparé pour i18n** : toutes les strings dans des fichiers `messages/fr-BF.json`, usage de `next-intl` ou équivalent.
- Pas de fallback vers l'anglais pour éviter les mélanges.
- Formats locaux : dates FR, séparateur de milliers espace insécable, FCFA symbole "F CFA".

## 12. Illustrations et assets

- **Illustrations humaines** : diversité locale représentée (bureaux africains, terrains hydrocarbures, bureaux administratifs). Pas de banque d'images US générique.
- **Icônes cybersécurité** : Lucide + 5-10 icônes customs (mobile money, phishing SMS, etc.).
- **Photos captures** (templates, landings) : recréations maison propres, jamais de marques tiers volées.
- **Charte visuelle** : livrable formalisé semaine 2, validation SONABHY.

## 13. Don'ts explicites

- ❌ Pas de cloche de notification rouge qui flashe. Subtil.
- ❌ Pas de modales intrusives au chargement (newsletter, demande de consentement cookies qui sortent du cadre légal déjà géré à l'onboarding).
- ❌ Pas de feedback haptique intrusif sur mobile.
- ❌ Pas d'émojis dans les rapports PDF destinés à la direction.
- ❌ Pas de "Vous avez gagné 10 XP !" en Comic Sans (exagération, mais l'esprit y est).
- ❌ Pas de classement public des users/départements au même niveau (favorise le name-and-shame).
