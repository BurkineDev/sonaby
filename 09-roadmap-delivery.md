# 09 — Roadmap & Livraison

> Plan de delivery 12 mois structuré par phases avec jalons facturables (rappel : voir `00-project-charter.md` section 5). Chaque jalon conditionne une tranche contractuelle.

## 1. Vision d'ensemble

```
┌──────────────────────────────────────────────────────────────────────┐
│                         12 MOIS DE PROGRAMME                         │
├──────────────────────────────────────────────────────────────────────┤
│ M1   M2   M3   M4   M5   M6   M7   M8   M9  M10  M11  M12            │
│ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░          │
│ ░SETUP ░ PILOTE ░ DÉPLOIEMENT   ░ OPTIMISATION ░ FIN                 │
│                                                                      │
│ ▲ L1  ▲ L3  ▲ L4         ▲ L5         ▲ L6         ▲ L7              │
│ S2    M2   M3            M6           M9           M12               │
│ PAS   T0   Prod          Q1           Q2           Final             │
│                                                                      │
│ L2 ▲ MVP pré-prod S6                                                 │
└──────────────────────────────────────────────────────────────────────┘

Légende : ▓ = WendTech intensive   ░ = WendTech entretien + pilotage SONABHY
```

## 2. Phase 0 — Cadrage (Semaines 1-2)

### 2.1 Objectif

Figer les fondations légales, techniques et organisationnelles avant toute ligne de code.

### 2.2 Activités

| # | Activité | Responsable | Livrable |
|---|---|---|---|
| 0.1 | Kickoff SONABHY (sponsor, RSSI, RH) | Aristide | Compte-rendu validé |
| 0.2 | Plan d'Assurance Sécurité (PAS) | Aristide + consultant cyber | PDF signé |
| 0.3 | DPIA (analyse d'impact RGPD) | Aristide | Document versionné |
| 0.4 | Setup dépôt, CI/CD, environnements Supabase (dev/staging/prod) | Aristide | Repo opérationnel |
| 0.5 | Acquisition domaines simulation (6 domaines) | Aristide | DNS configuré, SPF/DKIM |
| 0.6 | Nomination Security Champions (5-10 personnes) | SONABHY RH | Liste nominative |
| 0.7 | Validation charte visuelle (couleurs SONABHY, logos) | Designer + SONABHY | Tokens Figma |
| 0.8 | Templates légaux (consentement, CGU, politique confidentialité) | Juriste (externe) | Textes validés |

### 2.3 Jalon L1 (fin semaine 2)

- ✅ PAS signé
- ✅ DPIA remise
- ✅ Environnements techniques prêts
- ✅ Équipe SONABHY mobilisée et informée

**Tranche facturation** : 10 %

## 3. Phase 1 — MVP fonctionnel (Semaines 3-6)

### 3.1 Objectif

Livrer une plateforme techniquement complète sur le périmètre **Auth + Dashboard + Learning + Premières simulations**, en pré-production.

### 3.2 Sprints

#### Sprint 1 (S3) — Auth & Users

- Supabase Auth configurée (email+password, magic link)
- MFA TOTP pour rôles privilégiés
- Onboarding avec consentements granulaires
- Import CSV des 5000 utilisateurs SONABHY (dry-run)
- Gestion rôles RBAC + RLS sur tables critiques

#### Sprint 2 (S4) — Learning Engine base

- Table `modules`, `learning_paths`, `module_completions`
- Renderer des blocs de contenu (heading, paragraph, image, callout, quiz)
- 15 modules "Socle cyber" produits (v1 sans vidéos)
- Logique de complétion + enregistrement quiz_attempts
- Mode offline PWA de base (cache assets + module en cours)

#### Sprint 3 (S5) — Simulation Engine base

- Tables `phishing_templates`, `phishing_campaigns`, `phishing_sends`, `phishing_events`
- Production de 12 templates contextualisés (Mobile Money x4, SONABHY x4, SE x4)
- Domaines dédiés opérationnels
- Landing pages factices (4 slugs)
- HMAC tokens, tracking clicks sécurisé
- Workflow création campagne + approbation RSSI

#### Sprint 4 (S6) — Scoring v1 + Dashboard

- Edge Function `compute-scores` nocturne (v1.0.0)
- Page "Mon score" employé avec transparence
- Dashboard admin : overview, liste users, métriques basiques
- Audit log opérationnel
- Tests E2E sur les 4 parcours critiques

### 3.3 Jalon L2 (fin semaine 6)

- ✅ Plateforme pré-prod accessible
- ✅ 100 % périmètre Auth/Dashboard/Learning/Simulation v1
- ✅ Recette interne WendTech OK (critères `10-testing-qa.md`)
- ✅ Revue sécurité consultant externe OK

**Tranche facturation** : 25 %

## 4. Phase 2 — Pilote et Baseline T0 (Mois 2-3)

### 4.1 Objectif

Passer en production sur un groupe pilote, mesurer la baseline T0, puis déployer à 100 % des utilisateurs.

### 4.2 Déroulé

**Mois 2 — Pilote**
- S7 : Déploiement pilote sur 5-10 % des effectifs (Security Champions + volontaires)
- S7-S8 : Baseline T0 (quiz + 1ère simulation)
- S8 : Collecte feedback, ajustements UX/contenu
- S9 : Extension à 30-40 % des effectifs
- S10 : Rapport baseline T0 remis (L3)

**Mois 3 — Déploiement complet**
- S11 : Extension à 70 % des effectifs
- S12 : Extension à 100 %, enrôlement de masse
- S12 : Campagne de communication interne (bulletin, affichage)
- S12 : Revue trimestrielle #1

### 4.3 Jalon L3 (fin Mois 2)

- ✅ Rapport baseline T0 remis (PDF + dashboard)
- ✅ Benchmark initial établi : click rate, report rate, CMI
- ✅ Plan de campagnes Q2 validé par RSSI

**Tranche facturation** : 15 %

### 4.4 Jalon L4 (fin Mois 3)

- ✅ 100 % des utilisateurs enrôlés
- ✅ Au moins 80 % ont complété le quiz baseline
- ✅ Au moins 2 campagnes phishing lancées
- ✅ Dashboard RSSI en usage quotidien

**Tranche facturation** : 15 %

## 5. Phase 3 — Déploiement global et optimisation (Mois 4-6)

### 5.1 Objectif

Régime de croisière. Production continue de contenu, campagnes rythmées, mesure d'impact.

### 5.2 Cadence

| Cadence | Activité |
|---|---|
| Bi-mensuel | Campagne phishing (nouveau template, nouvelle cohorte) |
| Mensuel | Bulletin sécurité publié |
| Mensuel | 2-3 nouveaux modules en production |
| Mensuel | Comité de pilotage SONABHY |
| Trimestriel | Rapport trimestriel exécutif |

### 5.3 Features additionnelles M4-M6

- **Répétition espacée** (algo SM-2) activée en prod
- **Gamification soft** : badges + streaks
- **Security Champions Program** : parcours avancé + canal de remontée
- **Templates phishing Hard** (spear phishing, attaque en chaîne)
- **Export rapports** PDF exécutifs
- **Dashboard Comex-ready** (mode plein écran, export paginé)

### 5.4 Jalon L5 (fin Mois 6)

- ✅ Rapport trimestriel #1 présenté en Comex
- ✅ Taux de clic phishing réduit de **−40 % vs T0**
- ✅ Report rate ≥ **15 %**
- ✅ CMI : +15 points minimum

**Tranche facturation** : 15 %

## 6. Phase 4 — Maturation (Mois 7-9)

### 6.1 Objectif

Ancrer les comportements, élargir les cas d'usage, préparer le transfert de compétences.

### 6.2 Features additionnelles M7-M9

- **Parcours métiers** : RH, Direction, Logistique, Technique (spécifiques)
- **Scenarios interactifs** (blocs `scenario_step`) — choix multiples conséquentiels
- **Analytics pédagogique** : détection des modules mal calibrés, révision continue
- **Templates saisonniers** (fin d'année, ramadan, tabaski, rentrée)
- **Formation RSSI SONABHY** à l'administration de la plateforme

### 6.3 Jalon L6 (fin Mois 9)

- ✅ Rapport trimestriel #2 présenté
- ✅ Taux de clic phishing : **−55 % vs T0**
- ✅ Report rate ≥ **25 %**
- ✅ CMI : +22 points
- ✅ Équipe SONABHY formée (niveau intermédiaire)

**Tranche facturation** : 10 %

## 7. Phase 5 — Transfert et clôture (Mois 10-12)

### 7.1 Objectif

Transférer la plateforme et les compétences à SONABHY. Démontrer l'impact final. Préparer la Phase 3 contractuelle (avenant possible).

### 7.2 Activités

- **Documentation opérationnelle complète** (runbooks, procédures d'astreinte, plan de reprise)
- **Formation admin SONABHY** : 2 sessions de 4h + exercices pratiques
- **Transfert codebase** : audit de qualité, documentation inline, handover des secrets
- **Bilan analytics 12 mois** : courbes complètes, analyses cohortes, retours utilisateurs
- **Proposition Phase 3** : roadmap avenant (IA adaptative, multi-tenant, vishing, etc.)

### 7.3 Jalon L7 (fin Mois 12)

- ✅ Rapport final présenté
- ✅ Taux de clic phishing : **−70 % vs T0**
- ✅ Report rate ≥ **35 %**
- ✅ CMI : +30 points
- ✅ Couverture ≥ **95 %**
- ✅ Équipe SONABHY autonome sur l'administration courante
- ✅ Codebase documenté et transféré

**Tranche facturation** : 10 %

## 8. Backlog glissant

Le backlog est tenu dans GitHub Issues (board Projects). Labels :

| Label | Usage |
|---|---|
| `phase:setup` `phase:mvp` `phase:pilot` `phase:deploy` | Rattachement jalon |
| `domain:auth` `domain:learning` `domain:simulation` `domain:scoring` `domain:reporting` | Domaine métier |
| `priority:p0/p1/p2` | Priorisation |
| `type:feature` `type:bug` `type:security` `type:docs` | Nature |
| `blocker` | Bloque un jalon |

**Règle** : chaque issue doit avoir un phase label + un domain label + une priority. Une issue sans estimate en début de sprint ne rentre pas dans le sprint.

## 9. Gestion du scope creep

Demandes non prévues au contrat :
1. Écrites (pas d'oral) → issue dédiée `type:scope-request`
2. Triage hebdo avec Aristide : dans le scope, hors scope avec avenant, ou refus.
3. Jamais d'implémentation sans acceptation écrite.

Lors de la revue mensuelle SONABHY, une section "Scope tracker" est présentée : demandes reçues / acceptées / refusées / en avenant.

## 10. Plan de continuité

- **Bus factor = 1** reconnu (Aristide est l'unique dev lead). Mitigations :
  - Documentation à jour (ce dépôt)
  - Repository sur GitHub accessible au RSSI SONABHY (compte observateur en lecture)
  - Cahier d'exploitation versionné avec procédures d'urgence
  - En cas d'indisponibilité > 48h : contact back-up (consultant cyber externe) qui peut lire et intervenir
- **Sauvegardes Supabase** automatiques quotidiennes + test de restauration trimestriel

## 11. Risques majeurs et mitigation

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Consentement massif refusé (< 70 %) | Moyenne | Critique | Communication RH forte avant enrôlement + pédagogie sur l'intérêt programme |
| Panne Supabase prolongée | Faible | Majeur | Mode lecture seule via cache Next.js + SLA Supabase + backups régionaux |
| Fuite accidentelle de PII | Faible | Critique | Minimisation des données + audit trimestriel + plan de réponse incident |
| Rejet d'une campagne par CIL-BF | Faible | Majeur | DPIA en amont + fiches de campagne archivées |
| Retard de contenu (modules) | Moyenne | Moyen | Buffer de 2 semaines par phase + rédacteurs de backup |
| Résistance interne utilisateurs | Moyenne | Moyen | Gamification sobre + bulletins positifs + Champions comme relais |
| Faible connectivité empêche complétion | Élevée | Moyen | PWA offline-first dès le MVP |

## 12. Facturation — récapitulatif

| Jalon | Échéance | Tranche |
|---|---|---|
| L1 — PAS signé | Semaine 2 | 10 % |
| L2 — MVP pré-prod | Semaine 6 | 25 % |
| L3 — Baseline T0 | Mois 2 | 15 % |
| L4 — Production 100 % | Mois 3 | 15 % |
| L5 — Rapport Q1 | Mois 6 | 15 % |
| L6 — Rapport Q2 | Mois 9 | 10 % |
| L7 — Rapport final + transfert | Mois 12 | 10 % |
| **Total** | | **100 %** |
