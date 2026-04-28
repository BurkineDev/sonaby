# 12) Dossier technique de l'application (pour évaluateurs SONABHY)

## 1. Résumé exécutif produit

L'application développée est une plateforme SaaS de sensibilisation cybersécurité centrée sur le facteur humain. Elle est conçue pour transformer des événements de risque (ex: clic phishing) en apprentissage immédiat, puis en indicateurs de pilotage décisionnels.

Le produit est déjà structuré autour de parcours métiers complets:
- **Employé**: apprentissage et amélioration individuelle;
- **Manager**: pilotage agrégé par cohorte;
- **Admin/RSSI**: gouvernance, campagnes, conformité, reporting.

---

## 2. Ce qui est réellement implémenté dans le repository

### A. Parcours applicatifs

- **Authentification / connexion**: routes login et callback.
- **Onboarding**: parcours de démarrage et consentements.
- **Espace employé**: dashboard, modules, score, profil.
- **Espace admin/RSSI**: campagnes phishing, contenu, rapports PDF, audit, utilisateurs.
- **Flux phishing**: tracking clic + landing pédagogique + remédiation.

### B. Composants fonctionnels clés

1. **Moteur de simulation phishing**
   - templates, campagnes, envois, événements tracés;
   - token sécurisé pour tracking.

2. **Moteur JIT Learning**
   - insertion automatique d'une remédiation quand l'utilisateur clique sur une simulation.

3. **Moteur de scoring**
   - score de risque humain avec composantes quiz/phishing/engagement;
   - snapshots de score et agrégats cohortes.

4. **Gouvernance de sécurité**
   - politiques RLS côté base;
   - rôles séparés (user/manager/admin/rssi/super_admin);
   - journal d'audit append-only.

---

## 3. Architecture technique (présentable comité)

- **Frontend/Backend web**: Next.js App Router.
- **Base et auth**: Supabase Postgres + Auth + RLS.
- **Notifications/campagnes email**: Resend.
- **Monitoring**: Sentry (prévu dans l'architecture).
- **Pédagogie**: modules micro-learning + scénarios + quiz.

Cette architecture reste lisible et maintenable dans un modèle d'équipe réduite, avec transfert de compétences possible.

---

## 4. Preuves de qualité logicielle déjà disponibles

### Tests unitaires (web)
- **108 tests passés / 108** (exécution locale via Vitest).

### Couvertures observables dans les tests
- helpers dashboard;
- utilitaires de score/risque;
- sécurité token phishing (HMAC);
- composants UI clés (score card, gauge, module card, KPI card);
- règles d'accès RBAC (tests e2e présents dans le repo).

---

## 5. Données & sécurité (angles attendus en évaluation)

1. **RLS actif** sur tables sensibles.
2. **Séparation des accès** (manager agrégé, RSSI accès élargi, super_admin audit).
3. **Événements phishing append-only** pour intégrité du scoring.
4. **Audit log append-only** avec blocage DB des update/delete.
5. **Traçabilité** des campagnes et des consultations sensibles.

---

## 6. Plan de démonstration recommandé (quand ils ouvrent le lien)

1. Connexion compte employé de démonstration;
2. Dashboard employé: score + modules assignés;
3. Simulation phishing: clic → page pédagogique;
4. Boucle JIT: micro-remédiation;
5. Vue admin: campagne et KPI;
6. Export rapport PDF direction;
7. Conclusion en 3 métriques clés (clic, signalement, maturité).

---

## 7. Lien entre exigences Lot 2 et éléments réels du produit

- **Baseline T0** → onboarding + quiz + première simulation + score initial.
- **Apprentissage continu** → parcours modules + remédiation JIT.
- **Auto-évaluation** → quiz/scénarios et progression.
- **KPI mesurables** → score snapshots + agrégats cohorte + reporting.
- **Culture durable** → mécanisme continu, pas formation ponctuelle.

---

## 8. Pièces à joindre avec ce dossier technique

- captures d'écran de l'espace employé;
- captures d'écran admin (campagnes, rapports, audit);
- export PDF d'un rapport exemple;
- matrice de conformité Lot 2;
- résultats de tests (journal de commande) en annexe.
