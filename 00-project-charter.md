# 00 — Charte projet CyberGuard SONABHY

## 1. Contexte client

**SONABHY** (Société Nationale Burkinabè des Hydrocarbures) est un opérateur stratégique de l'État burkinabè. Tout actif numérique de SONABHY relève d'**infrastructure essentielle** au sens des standards de cybersécurité sectoriels (IEC 62443 pour la partie OT, ISO/IEC 27001 pour la partie IT).

Le Lot 2 du marché porte sur la **sensibilisation cybersécurité** — c'est-à-dire le maillon humain. Or :

- Entre **82 % et 91 %** des incidents cyber débutent par une action humaine (phishing, mot de passe faible, pièce jointe malveillante) selon les rapports Verizon DBIR, ENISA, ANSSI.
- Dans le secteur énergie/hydrocarbures, la moyenne sectorielle de clic phishing non formé est de l'ordre de **30 %** ; après programme de sensibilisation mature, on cible **< 5 %**.
- Un programme efficace doit être **continu** (pas une formation annuelle), **mesurable** (KPI défendables en Comex) et **contextualisé** (les attaques réelles en Afrique de l'Ouest ne ressemblent pas à celles de Zurich).

## 2. Ce que nous vendons

> **Une réduction mesurable du risque humain en cybersécurité sur 12 mois, démontrée par des KPI auditables.**

Nous **ne vendons pas** :

- ❌ « Une plateforme »
- ❌ « Des formations »
- ❌ « Un LMS cyber »

Nous vendons une **transformation mesurée**, et la plateforme est l'instrument. Cette distinction conditionne toute la stratégie produit, la hiérarchie des fonctionnalités et la présentation des livrables.

## 3. Engagements chiffrés (à négocier dans le contrat)

Ce sont les engagements de résultat que le produit doit soutenir :

| KPI | T0 (baseline) | T+6 mois | T+12 mois |
|---|---|---|---|
| Taux de clic phishing | Mesuré en Phase 1 | −40 % vs T0 | −70 % vs T0 |
| Taux de signalement (Report Rate) | Mesuré en Phase 1 | ≥ 15 % | ≥ 35 % |
| Taux de complétion modules | — | ≥ 75 % | ≥ 90 % |
| Cyber Maturity Index (CMI) | Mesuré en Phase 1 | +15 points | +30 points |
| Couverture utilisateurs actifs | — | 70 % | 95 % |

Ces chiffres sont des **ordres de grandeur défendables** basés sur les benchmarks KnowBe4, Proofpoint, Gartner. À ajuster après la baseline T0.

## 4. Gouvernance projet

### 4.1 Parties prenantes

| Rôle | Responsabilité | Côté |
|---|---|---|
| Sponsor exécutif | DG / DGA SONABHY, validation budget et arbitrages | SONABHY |
| RSSI / DSI | Référent technique et sécurité, point de contact principal | SONABHY |
| Relais RH | Communication interne, enrôlement, consentement | SONABHY |
| Security Champions | 5–10 employés volontaires, testeurs privilégiés | SONABHY |
| Product / Tech Lead | Architecture, delivery, reporting | WendTech (Aristide) |
| Consultant cyber | Expertise offensive, scénarios d'attaque | WendTech (externe) |
| Designer UX | Parcours utilisateur, contenus visuels | WendTech (freelance) |

### 4.2 Comités

- **Comité de pilotage** — mensuel, 60 min, support : dashboard exécutif + rapport PDF.
- **Comité technique** — bi-hebdomadaire, 30 min, support : avancement backlog + incidents.
- **Revue trimestrielle** — 90 min, support : rapport de maturité + recommandations.

## 5. Livrables contractuels

| # | Livrable | Échéance | Format |
|---|---|---|---|
| L1 | Plan d'assurance sécurité (PAS) | Semaine 2 | PDF signé |
| L2 | Plateforme MVP en pré-production | Semaine 6 | URL + accès |
| L3 | Rapport baseline T0 | Fin Mois 2 | PDF + dashboard |
| L4 | Plateforme en production, 100 % utilisateurs enrôlés | Fin Mois 3 | URL + accès |
| L5 | Rapport trimestriel #1 | Fin Mois 6 | PDF + présentation |
| L6 | Rapport trimestriel #2 | Fin Mois 9 | PDF + présentation |
| L7 | Rapport final + transfert de compétences | Fin Mois 12 | PDF + formation équipe SONABHY |

Chaque livrable conditionne une tranche de facturation (voir `09-roadmap-delivery.md`).

## 6. Conformité et contraintes légales

- **Loi n° 010-2004/AN** du 20 avril 2004 (Burkina Faso) sur la protection des données à caractère personnel.
- **Autorité compétente** : Commission de l'Informatique et des Libertés (CIL-BF).
- **Consentement** explicite des employés pour : simulations phishing sur leur boîte mail pro, enregistrement des comportements, analyse individuelle.
- **Anonymisation par défaut** dans les rapports ; individualisation uniquement sur demande motivée du RSSI, tracée en audit log.
- **Souveraineté des données** : option d'hébergement dans une région UE (Supabase EU-West) **minimum**. Option Afrique à étudier si exigée (voir `03-security-compliance.md`).

## 7. Hors-scope explicite

Pour éviter le scope creep, les éléments suivants sont **hors du marché Lot 2** :

- Audit technique des SI de SONABHY (pentest, revue d'architecture) → autre lot.
- Remédiation technique (patch, durcissement serveurs) → autre lot.
- Formation sur les aspects juridiques cyber → hors périmètre.
- Intégration SIEM / SOC → peut faire l'objet d'un avenant Phase 3.

## 8. Ce qui nous différencie (à marteler commercialement)

1. **Contextualisation Afrique réelle** — scénarios Orange Money, Moov Money, faux intranet SONABHY, faux emails du Ministère, faux WhatsApp RH. Les acteurs internationaux livrent des traductions de templates US. Nous livrons du terrain.
2. **Mode faible connectivité natif** — PWA installable, cache offline des modules, synchronisation différée. Nos concurrents imposent du SaaS streaming.
3. **Just-In-Time Learning** — un employé qui clique sur un phishing simulé reçoit **instantanément** un micro-module adapté à son erreur, pas une formation générique le mois suivant.
4. **Security Champions Program** — nous transformons 5–10 employés en relais internes. Le programme survit après notre départ. Transfert de compétences contractuel.
5. **Reporting Comex-ready** — le dashboard exécutif est conçu pour être **projeté en Codir sans préparation**. Un RSSI ne doit pas avoir à faire PowerPoint le dimanche soir.

## 9. Philosophie produit (à rappeler dans chaque décision)

> *« Nous n'entraînons pas les employés à être des experts cyber. Nous entraînons l'organisation à être résiliente face au facteur humain. »*

Corollaires :

- L'objectif n'est pas qu'un employé « connaisse » — c'est qu'il **agisse correctement** sous pression.
- On mesure le **comportement réel**, pas l'auto-déclaration.
- On célèbre le **signalement** autant que la non-erreur (encourage une culture de transparence).
- On ne punit jamais un employé pour avoir cliqué. On documente, on forme, on mesure.
