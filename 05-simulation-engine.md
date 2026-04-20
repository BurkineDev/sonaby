# 05 — Simulation Engine

> Le différenciateur commercial n°1. Les concurrents livrent des templates traduits du US. Nous livrons du **terrain réel** : Orange Money, SONABHY RH, Ministère des Finances, faux collègue WhatsApp. Ce module doit respirer l'Afrique de l'Ouest.

## 1. Principes

1. **Réalisme local avant technicité.** Un template grammaticalement parfait mais culturellement hors-sol vaut moins qu'un template avec 2 fautes de français crédibles.
2. **Progression encadrée.** On ne lance pas une campagne *hard* en semaine 1. Courbe de difficulté documentée.
3. **Consentement vérifié à chaque envoi.** Le filtre de ciblage exclut automatiquement tout user sans `security_consents` actif.
4. **Aucune donnée sensible capturée.** Les landing fake affichent des champs, mais **rien n'est transmis au serveur** — seul le fait de soumettre est loggé.
5. **Debrief systématique.** Après chaque campagne, un artefact de communication est généré pour SONABHY (bulletin mensuel anonymisé).

## 2. Catalogue de scénarios contextualisés Burkina / UEMOA

Les templates sont regroupés par **vecteur** et **contexte local**. Chaque template a une variante Email, SMS et (Phase 2) WhatsApp.

### 2.1 Scénarios Mobile Money (très haute résonance terrain)

| ID | Scénario | Canal | Difficulté | Ressort |
|---|---|---|---|---|
| MM-01 | « Votre compte Orange Money a été suspendu pour raison de sécurité. Cliquez ici pour réactivation. » | Email + SMS | Easy | Peur |
| MM-02 | « Vous avez reçu 25 000 FCFA. Code de confirmation dans 2 min, valider ici. » | SMS | Medium | Cupidité |
| MM-03 | Faux SMS "reçu par erreur" : « J'ai envoyé 50 000 F par erreur à votre numéro, pouvez-vous rembourser ? » | SMS | Hard | Empathie + pression |
| MM-04 | Email "Moov Money" — changement de tarification, formulaire de mise à jour | Email | Medium | Administratif |

### 2.2 Scénarios SONABHY / hydrocarbures

| ID | Scénario | Canal | Difficulté | Ressort |
|---|---|---|---|---|
| SB-01 | Faux intranet SONABHY — « Mise à jour obligatoire du mot de passe avant 17h » | Email | Easy | Autorité interne |
| SB-02 | Faux email DRH — « Bulletin de salaire disponible, téléchargez ici » | Email | Medium | Curiosité + routine |
| SB-03 | Faux email DG — « Projet confidentiel, merci de valider ce document avant 9h » | Email | Hard | Autorité hiérarchique + urgence |
| SB-04 | Fausse notification de maintenance TotalEnergies / Shell sur les livraisons (fournisseur connu) | Email | Medium | Chaîne logistique |

### 2.3 Scénarios institutionnels / administratifs

| ID | Scénario | Canal | Difficulté | Ressort |
|---|---|---|---|---|
| IN-01 | « Convocation du Ministère des Finances, document joint » | Email | Medium | Autorité étatique |
| IN-02 | Faux email CNSS — mise à jour dossier, pièce jointe .xls | Email | Easy | Administratif |
| IN-03 | Faux email CIL-BF — « Notification de non-conformité, répondre sous 72h » | Email | Hard | Pression réglementaire |

### 2.4 Scénarios « humains » / social engineering

| ID | Scénario | Canal | Difficulté | Ressort |
|---|---|---|---|---|
| SE-01 | Faux collègue WhatsApp : « Salut, peux-tu me dépanner avec 15 000 F jusqu'à demain ? » | WhatsApp | Medium | Empathie collègue |
| SE-02 | « Invitation LinkedIn — offre d'emploi à Ouaga-Bobo, consultez le poste » | Email | Easy | Opportunité pro |
| SE-03 | Faux email prestataire IT — « Mise à jour urgente de votre poste » | Email | Hard | Crédibilité technique |
| SE-04 | Faux livreur : « Colis en attente, confirmer adresse sinon retour expéditeur » | SMS | Easy | Logistique |

### 2.5 Scénarios avancés (Phase 2+)

- **Spear phishing ciblé** (cadres) : emails personnalisés avec données OSINT publiques.
- **Attaque en chaîne** : email innocent #1 établit la confiance, email #2 exploite.
- **Vishing** : appel téléphonique simulé (hors scope v1, potentiel avenant).
- **Deepfake audio** (Phase 3, si technologie et budget alignés).

## 3. Anatomie d'un template

```ts
// Schéma Zod
export const PhishingTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),               // lisible admin : "Orange Money - Suspension compte"
  channel: z.enum(['email', 'sms', 'whatsapp']),
  subject: z.string().optional(),
  senderName: z.string(),         // "Orange Money BF"
  senderEmail: z.string().email(), // "no-reply@orange-money-bf.info" (domaine nous)
  bodyHtml: z.string(),
  bodyText: z.string(),
  landingPageSlug: z.string(),    // "fake-orange-login"
  difficulty: z.enum(['easy', 'medium', 'hard']),
  locale: z.string().default('fr-BF'),
  topicTags: z.array(z.string()), // ['mobile_money', 'credentials']
  contextTags: z.array(z.string()),// ['orange_money', 'urgency']
  clues: z.array(z.string()),     // indices de détection, affichés dans le debrief
  recommendedCohorts: z.array(z.string()).optional(),
});
```

### 3.1 Indices de détection (clues)

Chaque template embarque la **liste des indices** qui auraient dû alerter l'utilisateur. Utilisés dans :
- Le module JIT Learning post-clic (pédagogie ciblée)
- Le bulletin de debrief organisationnel
- Le rapport individuel (pour les Security Champions)

Exemple pour MM-01 :

```ts
clues: [
  "L'URL ne correspond pas au domaine officiel orange.bf",
  "La menace de 'suspension' crée une urgence artificielle",
  "Le logo est de basse qualité (pixelisé)",
  "Orange Money ne demande jamais un mot de passe par email",
  "L'expéditeur est 'no-reply@orange-bf-service.info' et non 'orange.bf'",
]
```

## 4. Domaines dédiés aux simulations

**Règle absolue** : les emails phishing simulés sont envoyés depuis **nos domaines dédiés**, jamais depuis un domaine usurpé.

Exemples de domaines à acquérir :

| Usage | Domaine candidat |
|---|---|
| Simulations générales | `securite-sonabhy.training` |
| Mobile Money | `orange-money-bf.info`, `moov-money-secure.net` |
| Intranet factice | `sonabhy-portail.info` (non officiel) |
| Administration | `cnss-services-bf.info` |

Chaque domaine est **préfixé de l'attention** aux admins (dans la console et la fiche de campagne : "Attention, ce domaine sert aux simulations, ne jamais l'utiliser en prod").

## 5. Liens trackés : sécurité

### 5.1 Format du lien

```
https://app.wendtech.io/p/click?t={TOKEN}

TOKEN = base64url(HMAC_SHA256(secret, `${send_id}:${user_id}:${expires_at}`))
```

### 5.2 Validation côté serveur

1. Décoder le token.
2. Recalculer le HMAC avec le secret courant (rotation annuelle).
3. Vérifier non-expiration (30 jours par défaut).
4. Vérifier que le `send_id` existe et que le `user_id` matche.
5. Inscrire l'événement `clicked` dans `phishing_events`.
6. Rediriger vers la landing page factice adéquate.

```ts
// packages/shared/services/simulation/token.ts
export function generatePhishingToken(
  sendId: string,
  userId: string,
  expiresAt: Date,
  secret: string,
): string {
  const payload = `${sendId}:${userId}:${expiresAt.toISOString()}`;
  const sig = hmacSha256(secret, payload);
  return base64url(`${payload}.${sig}`);
}

export function verifyPhishingToken(
  token: string,
  secret: string,
): { sendId: string; userId: string } | null {
  try {
    const decoded = base64urlDecode(token);
    const [payload, sig] = decoded.split('.');
    if (!payload || !sig) return null;
    const expected = hmacSha256(secret, payload);
    if (!timingSafeEqual(sig, expected)) return null;
    const [sendId, userId, expISO] = payload.split(':');
    if (new Date(expISO) < new Date()) return null;
    return { sendId, userId };
  } catch {
    return null;
  }
}
```

Les erreurs renvoient un 404 neutre — pas de 401, pas de message — pour ne pas révéler la structure.

## 6. Landing pages factices

Toutes hébergées sous `/p/land/{slug}`. Règles :

1. **Mimétisme visuel** aussi proche que possible du vrai (Orange Money, intranet SONABHY…). Utilisation de recréations maison, **jamais** de ressources volées aux vraies marques.
2. **Bandeau révélation** affiché 3 secondes après arrivée sur la page :
   ```
   ⚠️ Ceci était une simulation de sécurité CyberGuard.
   Aucune donnée n'a été volée. Voyons ensemble les indices que vous auriez pu repérer.
   ```
3. **Formulaires sans soumission réelle** : `onSubmit={handleFakeSubmit}` qui :
   - empêche le submit natif
   - enregistre l'événement `submitted_credentials` (sans transmettre les valeurs)
   - redirige vers la page JIT Learning
4. **Page JIT Learning** : module court adapté au topic, avec :
   - rappel de la simulation
   - liste des indices (clues) qui auraient dû alerter
   - quiz rapide (3 questions)
   - message positif : "Merci d'avoir participé — vous venez d'éviter ce qui pourrait être une vraie attaque"

## 7. Moteur d'envoi

### 7.1 Orchestration

```
Admin → Create campaign UI → insert draft phishing_campaigns
                                 │
Admin → Schedule campaign → update status='scheduled', scheduled_at=...
                                 │
pg_cron toutes les 5 min ────────┼─→ Edge Function "send-campaign"
                                 │        │
                                 │        ▼
                                 │   Pour chaque user ciblé:
                                 │     1. Vérifier consent actif
                                 │     2. Générer send_token
                                 │     3. Personnaliser template
                                 │     4. Appeler Resend API
                                 │     5. insert phishing_sends
                                 │     6. insert phishing_events (delivered)
                                 │        ou (bounced)
                                 │
                                 ▼
                              Rate limit: 100 envois / minute / campagne
                              Reprise: si erreur partielle, retry 3× avec backoff
```

### 7.2 Personnalisation des templates

Les templates supportent des placeholders :

| Placeholder | Exemple rendu |
|---|---|
| `{{user.firstName}}` | "Aminata" |
| `{{user.lastName}}` | "Ouédraogo" |
| `{{user.department}}` | "Direction Commerciale" |
| `{{user.manager}}` | "Souleymane Traoré" |
| `{{campaign.trackingUrl}}` | Lien piégé unique |
| `{{campaign.senderName}}` | "DRH SONABHY" |

**Jamais** de placeholder qui exposerait des données sensibles (pas de `{{user.phone}}`, pas de `{{user.address}}`).

### 7.3 Limites de cadence

| Contrainte | Valeur |
|---|---|
| Max envois par campagne | 2000 |
| Max campagnes simultanées | 3 |
| Max campagnes par user par mois | 2 |
| Fenêtre d'envoi | 08:00-18:00 UTC par défaut (configurable, validation RSSI hors fenêtre) |
| Exclusion week-end | Oui (configurable) |
| Exclusion jours fériés BF | Oui (calendrier national maintenu) |

## 8. Détection d'anomalies de campagne

Un bot ou un lien partagé par erreur peut corrompre les stats. Détections :

- **Dwell time anormalement bas** (< 2 sec entre delivered et clicked) → marquer suspect.
- **User-Agent non navigateur** (curl, wget, Googlebot) → exclusion des stats.
- **IP d'un ASN scanner connu** (ProtonMail Link Confirmation, Outlook SafeLinks) → exclusion.
- **Multiple clics à la seconde près** → exclusion (pré-visualisation).

Les événements restent loggés (traçabilité) mais exclus des métriques d'entraînement.

## 9. Métriques de campagne (vue admin)

Dashboard par campagne, en temps réel (via Supabase Realtime) :

- Envoyés / Livrés / Bounces
- Ouverts / Cliqués / Credentials saisis / Signalés
- **Report Rate** (signalements / livrés) — KPI positif
- Dwell Time médian
- Répartition par département
- Top indices négligés (clues non détectés en priorité)

Export PDF + CSV. Aucun nom individuel dans la vue agrégée (anonymisation par défaut).

## 10. Règles d'éthique opérationnelle

1. **Pas de piège à thématique émotionnelle lourde.** Interdit : faux décès, faux accident, fausse urgence familiale. Le stress est disproportionné au bénéfice pédagogique.
2. **Pas de piège usurpant nommément des collègues réels.** Le « faux collègue WhatsApp » utilise un pseudo générique (« Moussa SONABHY »), jamais le nom d'un salarié réel.
3. **Pas de piège sur des canaux personnels** (numéro WhatsApp perso, email perso) — uniquement canaux pros enrôlés avec consentement.
4. **Debrief transparent.** Un bulletin est envoyé à **tous** les employés après chaque campagne, avec statistiques agrégées et pédagogie.
5. **Droit à l'erreur.** Aucun nom n'est remonté à la hiérarchie. La remontée ne se fait qu'au niveau cohorte.

## 11. Templates bulletin de debrief

Après chaque campagne, génération automatique d'un bulletin Markdown + PDF :

```
📢 Bulletin Sécurité — Campagne "Orange Money Suspension"
Envoyé aux 247 employés enrôlés le 18 novembre.

Résultats :
  - 247 emails livrés
  - 86 ouvertures (34,8 %)
  - 31 clics (12,5 %) — en baisse vs 21 % en juin
  - 42 signalements (17 % — EN HAUSSE vs 8 % en juin)

Ce qu'il fallait repérer :
  1. URL ne correspondant pas à orange.bf
  2. Ton menaçant et urgence artificielle
  3. Orange ne demande JAMAIS vos identifiants par email

Bravo aux 42 d'entre vous qui ont signalé. Votre vigilance nous protège tous.

📚 Rappel : retrouvez le module "Reconnaître un email de phishing mobile money"
sur CyberGuard — 4 minutes pour ne plus se faire piéger.

— L'équipe Sécurité SONABHY
```

Ce bulletin est **revu par le RSSI avant envoi** (workflow d'approbation dans l'app).

## 12. Roadmap templates (12 mois)

| Période | Ajouts |
|---|---|
| M1 | 12 templates de base (MM, SB, SE — difficulté Easy-Medium) |
| M2-M3 | +8 templates (IN + difficulté Hard, variantes SMS) |
| M4-M6 | +10 templates saisonniers (fin d'année, ramadan, tabaski, rentrée) |
| M7-M9 | +6 templates avancés (spear phishing cadres, attaque en chaîne) |
| M10-M12 | +4 templates WhatsApp + révision globale |

Objectif 12 mois : **40 templates actifs**, renouvellement trimestriel (templates anciens "mis au frigo" 6 mois puis réutilisables).

## 13. Tests & validation

- Chaque template passe par un **comité de relecture** : Aristide + RSSI SONABHY + consultant externe.
- Validation éthique (section 10) signée avant activation.
- Test pilote sur Security Champions avant déploiement large.
- Traduction et vérification linguistique FR-BF (pas de français « trop métropolitain », vocabulaire crédible).
