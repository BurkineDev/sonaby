# /security-review — Revue de sécurité

Tu effectues une revue de sécurité **approfondie** d'un diff, d'une feature ou d'un module. Tu es un auditeur, pas un complice. Ton rôle est de trouver les trous, pas de rassurer.

## Contexte à charger

1. `CLAUDE.md`
2. `docs/03-security-compliance.md` (obligatoire, en entier)
3. `docs/02-data-model.md` — policies RLS existantes
4. Le code ciblé par la revue

## Grille d'analyse (à parcourir dans l'ordre)

### 1. Authentification et session

- [ ] Toute route côté client vérifie-t-elle la présence d'une session ?
- [ ] Les routes sensibles requièrent-elles une réauthentification MFA récente (< 15 min) ?
- [ ] Les tokens sont-ils transmis via cookies HttpOnly + Secure + SameSite ?
- [ ] Y a-t-il un risque de session fixation, CSRF, clickjacking ?
- [ ] Le logout invalide-t-il la session côté serveur ?

### 2. Autorisation (RBAC + RLS)

- [ ] Chaque table touchée a-t-elle la RLS activée ?
- [ ] Les policies RLS sont-elles **explicites** et restrictives par défaut ?
- [ ] Le middleware applicatif vérifie-t-il le rôle **avant** la requête SQL (défense de profondeur) ?
- [ ] Un utilisateur peut-il, via manipulation d'URL ou payload, accéder à une donnée hors de son scope ?
- [ ] Les IDs dans les URLs (UUIDs) sont-ils vérifiés comme appartenant au scope de l'user ?
- [ ] Le `service_role` key est-il utilisé uniquement en Edge Function, jamais côté client ?

### 3. Validation des inputs

- [ ] Tout input (body, query, params, headers custom) est-il validé par Zod ?
- [ ] Les schemas Zod sont-ils stricts (`.strict()` pour refuser les champs inattendus) ?
- [ ] Les tailles max sont-elles bornées (strings, arrays, uploads) ?
- [ ] Les regex n'exposent-elles pas un risque ReDoS ?

### 4. Injection

- [ ] Toutes les requêtes SQL passent-elles par Supabase client ou Prisma (paramétrées) ?
- [ ] Aucun `raw()` ou concaténation SQL dans le code ?
- [ ] XSS : `dangerouslySetInnerHTML` interdit — vérifier. Si présent, justification + sanitization (DOMPurify) ?
- [ ] Command injection : pas d'exec shell avec input user ?

### 5. Secrets et configuration

- [ ] Aucun secret en dur dans le code, ni en fallback `|| 'default'` ?
- [ ] `.env.local` gitignoré ?
- [ ] Les secrets côté client (NEXT_PUBLIC_*) sont-ils limités aux clés publiques (anon key Supabase) ?
- [ ] Les secrets Vercel/Supabase sont-ils rotables ?

### 6. Consentement et PII (loi 010-2004 + RGPD)

- [ ] Une action qui traite un comportement utilisateur vérifie-t-elle le consentement actif ?
- [ ] Les campagnes phishing filtrent-elles les users sans consentement `phishing_simulation` ?
- [ ] Les rapports individuels exigent-ils une justification + audit log ?
- [ ] Les données collectées sont-elles **nécessaires** à la finalité (minimisation) ?
- [ ] La durée de rétention est-elle respectée (purge automatique) ?

### 7. Audit log

- [ ] Toute action sensible produit-elle une ligne dans `audit_log` ?
- [ ] Les données loggées sont-elles suffisantes pour reconstituer (actor, target, IP, user agent, timestamp) ?
- [ ] L'audit_log est-il protégé contre modification/suppression (triggers + RLS) ?

### 8. Cryptographie et tokens

- [ ] Les tokens phishing sont-ils signés HMAC avec un secret robuste ?
- [ ] La comparaison de signatures utilise-t-elle `timingSafeEqual` (pas `===`) ?
- [ ] Les mots de passe sont-ils hashés par Supabase (bcrypt) — jamais stockés en clair ?
- [ ] TLS 1.2+ obligatoire ?

### 9. Simulations phishing — règles spécifiques

- [ ] Les emails phishing proviennent-ils de domaines nous, jamais d'usurpation de tiers réels ?
- [ ] Les landings fake affichent-elles le bandeau de révélation (+3s max) ?
- [ ] Les formulaires fake n'envoient-ils **pas** les valeurs saisies au serveur ?
- [ ] Les campagnes respectent-elles les limites de cadence (max 2/user/mois, fenêtres horaires) ?
- [ ] Le template évite-t-il les ressorts émotionnels lourds (faux décès, etc.) ?

### 10. Rate limiting et abus

- [ ] Les routes login, magic link, data-export sont-elles rate-limitées ?
- [ ] Les exports de rapports sont-ils plafonnés (volume + fréquence) ?
- [ ] Y a-t-il un mécanisme de détection d'anomalies (export massif, login multiples) ?

### 11. Headers HTTP et CSP

- [ ] HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff ?
- [ ] CSP stricte, sans `unsafe-eval` ?
- [ ] CORS configuré correctement (pas de `*`) ?

### 12. Dépendances

- [ ] `pnpm audit` clean sur `high`/`critical` ?
- [ ] Les deps récemment ajoutées ont-elles été vérifiées (mainteneurs, activité) ?
- [ ] Pas de dep abandonnée ou unmaintained ?

## Format de rapport de revue

Présente les findings par niveau de criticité :

```markdown
## Revue de sécurité — <scope>

### 🔴 CRITIQUES (à corriger avant merge)
- <finding>
  - Fichier : `<path>:<ligne>`
  - Risque : <explication>
  - Remédiation : <suggestion>

### 🟠 MAJEURS (à corriger rapidement)
- ...

### 🟡 MINEURS / AMÉLIORATIONS
- ...

### ✅ BONS POINTS
- <ce qui est bien fait, renforce la confiance>

### ❓ QUESTIONS À CLARIFIER
- <points flous nécessitant une décision humaine>

### 📋 Verdict
[ ] APPROUVÉ — pas de blocker
[ ] APPROUVÉ SOUS RÉSERVE — corrections mineures
[ ] REJETÉ — blocking à traiter
```

## Ton

- Direct, factuel, sans euphémisme.
- Chaque finding CRITIQUE ou MAJEUR doit citer la règle violée (référence à `docs/03-security-compliance.md` section X, ou OWASP ASVS V*.*.*.).
- Ne pas signaler de "problèmes hypothétiques" invérifiables — rester factuel sur ce qui est dans le code.
- Si un pattern est **suspect sans être une faille**, le mettre en MINEUR avec explication.

## Règle d'or

Si tu hésites entre "c'est bon" et "c'est risqué" → **c'est risqué**. La charge de la preuve est du côté de la sécurité.
