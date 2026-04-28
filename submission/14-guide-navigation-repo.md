# 14) Guide de navigation du repository (pour évaluateurs non techniques)

## Objectif
Permettre au comité d'ouvrir le lien du repository et de comprendre rapidement où se trouvent:
1. la valeur métier;
2. les preuves techniques;
3. la conformité sécurité;
4. les tests.

---

## Parcours conseillé en 10 minutes

### Étape 1 — Comprendre le produit
- Ouvrir `README.md` (racine) pour le contexte global et la logique de démo.
- Ouvrir `submission/12-dossier-technique-application.md` pour une lecture orientée décision.

### Étape 2 — Voir l'architecture et la pédagogie
- `01-architecture.md`
- `06-learning-engine.md`
- `08-ui-ux-spec.md`

### Étape 3 — Voir les écrans / routes métier
- Espace employé: `apps/web/app/employee/*`
- Espace admin/rssi: `apps/web/app/admin/*`
- Phishing flow: `apps/web/app/phishing/click/route.ts` + `apps/web/app/phishing-landing/[slug]/page.tsx`

### Étape 4 — Voir la sécurité données
- Migrations SQL:
  - `supabase/migrations/20260101000300_phishing_engine.sql`
  - `supabase/migrations/20260101000400_scoring_and_audit.sql`

### Étape 5 — Voir les preuves de qualité
- Tests unitaires web: `apps/web/__tests__/...`
- Tests e2e: `apps/web/e2e/...`
- Moteur scoring: `packages/shared/src/scoring/__tests__/risk-score.test.ts`

---

## Message à donner au comité

"Le produit n'est pas une maquette. C'est une base fonctionnelle avec architecture documentée, sécurité structurée en base de données (RLS), moteur de scoring testé et parcours métier démontrables."

---

## Pack documentaire à transmettre avec le lien

- dossier principal (manifestation d'intérêt)
- matrice de conformité lot 2
- dossier technique application
- annexe administrative (RCCM/IFU)
- script de démo 15 min
