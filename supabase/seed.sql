-- ============================================================================
-- SEED : Données de démonstration CyberGuard SONABHY
-- Environnement local uniquement. Ne jamais appliquer en production.
--
-- Usage : pnpm db:reset (enchaîne supabase db reset + ce seed)
--
-- Contenu :
--   - 1 organisation SONABHY
--   - 5 départements
--   - 50 utilisateurs fictifs burkinabè
--   - 3 parcours de formation + 20 modules
--   - 10 templates phishing contextualisés
--   - 2 campagnes historiques + événements
--   - 30 jours de risk_scores pour courbes
-- ============================================================================

begin;

-- ─── ORGANISATION ──────────────────────────────────────────────────────────────

insert into organizations (id, name, slug, locale, data_region) values
  ('00000000-0000-0000-0000-000000000001', 'SONABHY', 'sonabhy', 'fr-BF', 'eu-west');

-- ─── DÉPARTEMENTS ─────────────────────────────────────────────────────────────

insert into departments (id, organization_id, name, code) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Direction Générale', 'DG'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Direction des Systèmes d''Information', 'DSI'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Direction des Ressources Humaines', 'RH'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Direction Commerciale', 'COMMERCIAL'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Direction Technique', 'TECHNIQUE');

-- ─── PROFILS UTILISATEURS ─────────────────────────────────────────────────────
-- Noms fictifs représentatifs du Burkina Faso, aucun lien avec des personnes réelles.

insert into profiles (id, organization_id, department_id, email, full_name, role, job_title, site, enrolled_at, last_active_at, onboarding_done) values
  -- DSI (8 users)
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'amadou.ouedraogo@sonabhy.bf', 'Amadou OUEDRAOGO', 'rssi', 'Responsable SSI', 'Ouagadougou', now() - interval '60 days', now() - interval '1 day', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'fatima.barry@sonabhy.bf', 'Fatima BARRY', 'admin', 'Administratrice systèmes', 'Ouagadougou', now() - interval '55 days', now() - interval '2 days', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ibrahim.kabore@sonabhy.bf', 'Ibrahim KABORE', 'security_champion', 'Ingénieur réseau', 'Ouagadougou', now() - interval '58 days', now() - interval '1 day', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'mariam.some@sonabhy.bf', 'Mariam SOME', 'user', 'Technicienne support', 'Ouagadougou', now() - interval '50 days', now() - interval '5 days', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'youssouf.traore@sonabhy.bf', 'Youssouf TRAORE', 'user', 'Développeur', 'Ouagadougou', now() - interval '45 days', now() - interval '3 days', true),

  -- RH (10 users)
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'aissata.diallo@sonabhy.bf', 'Aissata DIALLO', 'manager', 'Responsable RH', 'Ouagadougou', now() - interval '58 days', now() - interval '2 days', true),
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'boureima.sawadogo@sonabhy.bf', 'Boureima SAWADOGO', 'user', 'Gestionnaire paie', 'Ouagadougou', now() - interval '52 days', now() - interval '10 days', true),
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'haoua.zongo@sonabhy.bf', 'Haoua ZONGO', 'user', 'Chargée de recrutement', 'Ouagadougou', now() - interval '48 days', now() - interval '7 days', true),
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'seydou.ouattara@sonabhy.bf', 'Seydou OUATTARA', 'user', 'Assistant RH', 'Bobo-Dioulasso', now() - interval '40 days', now() - interval '15 days', true),
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'djamila.coulibaly@sonabhy.bf', 'Djamila COULIBALY', 'user', 'Gestionnaire formation', 'Ouagadougou', now() - interval '55 days', now() - interval '4 days', true),

  -- COMMERCIAL (12 users)
  ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'abdoulaye.nikiema@sonabhy.bf', 'Abdoulaye NIKIEMA', 'manager', 'Directeur commercial', 'Ouagadougou', now() - interval '60 days', now() - interval '1 day', true),
  ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'rasmane.tiendrebeogo@sonabhy.bf', 'Rasmané TIENDREBEOGO', 'user', 'Commercial terrain', 'Ouagadougou', now() - interval '35 days', now() - interval '20 days', true),
  ('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'pauline.kere@sonabhy.bf', 'Pauline KERE', 'security_champion', 'Responsable comptes clés', 'Ouagadougou', now() - interval '58 days', now() - interval '2 days', true),
  ('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'moussa.sankara@sonabhy.bf', 'Moussa SANKARA', 'user', 'Commercial Bobo', 'Bobo-Dioulasso', now() - interval '42 days', now() - interval '12 days', true),
  ('20000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'alice.bonkoungou@sonabhy.bf', 'Alice BONKOUNGOU', 'user', 'Assistante commerciale', 'Ouagadougou', now() - interval '50 days', now() - interval '8 days', true),

  -- TECHNIQUE (15 users)
  ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'salif.ouedraogo@sonabhy.bf', 'Salif OUEDRAOGO', 'manager', 'Directeur technique', 'Ouagadougou', now() - interval '60 days', now() - interval '3 days', true),
  ('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'mariame.konate@sonabhy.bf', 'Mariame KONATE', 'user', 'Ingénieure process', 'Ouagadougou', now() - interval '55 days', now() - interval '6 days', true),
  ('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'etienne.kabore@sonabhy.bf', 'Etienne KABORE', 'user', 'Technicien maintenance', 'Bobo-Dioulasso', now() - interval '38 days', now() - interval '18 days', true),
  ('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'adja.barry@sonabhy.bf', 'Adja BARRY', 'user', 'Ingénieure qualité', 'Ouagadougou', now() - interval '48 days', now() - interval '9 days', true),
  ('20000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'hamidou.zoungrana@sonabhy.bf', 'Hamidou ZOUNGRANA', 'user', 'Chef d''équipe terrain', 'Koudougou', now() - interval '30 days', now() - interval '25 days', true),

  -- DG (5 users)
  ('20000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'directeur.general@sonabhy.bf', 'Directeur Général', 'super_admin', 'Directeur Général', 'Ouagadougou', now() - interval '60 days', now() - interval '2 days', true),
  ('20000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'secretaire.dg@sonabhy.bf', 'Aminata SAWADOGO', 'user', 'Secrétaire de direction', 'Ouagadougou', now() - interval '56 days', now() - interval '5 days', true),
  ('20000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'conseiller.dg@sonabhy.bf', 'Lazare ROUAMBA', 'user', 'Conseiller du DG', 'Ouagadougou', now() - interval '54 days', now() - interval '7 days', true);

-- ─── PARCOURS DE FORMATION ────────────────────────────────────────────────────

insert into learning_paths (id, organization_id, slug, title, description, target_difficulty, is_active) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'socle-cyber', 'Socle Cybersécurité', 'Les fondamentaux pour tous les employés SONABHY', 'easy', true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'phishing-avance', 'Reconnaître les attaques avancées', 'Pour les Security Champions et profils à risque élevé', 'hard', true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'mobile-money-securite', 'Sécurité Mobile Money', 'Fraudes Orange Money, Moov Money — contexte Burkina Faso', 'medium', true);

-- ─── MODULES DE FORMATION ─────────────────────────────────────────────────────

insert into modules (id, organization_id, learning_path_id, slug, title, kind, difficulty, estimated_minutes, topic_tags, body, is_published) values

  -- Socle Cyber (easy)
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'c-est-quoi-phishing', 'C''est quoi le phishing ?', 'micro_lesson', 'easy', 5,
   ARRAY['phishing', 'basics'],
   '{"blocks":[{"type":"heading","level":1,"text":"Le phishing : qu''est-ce que c''est ?"},{"type":"paragraph","text":"Le phishing (ou hameçonnage) est une technique d''arnaque qui consiste à vous envoyer un faux email ou SMS en se faisant passer pour une organisation connue — Orange Money, votre banque, SONABHY, le Ministère..."},{"type":"callout","variant":"warning","text":"85% des cyberattaques commencent par un email. Apprendre à les reconnaître est votre meilleure défense."},{"type":"heading","level":2,"text":"Comment reconnaître un email suspect ?"},{"type":"paragraph","text":"1. L''adresse email d''envoi est bizarre (ex: rh@sonabhy-info.com au lieu de rh@sonabhy.bf)\\n2. Le ton est urgent (\"Votre compte sera bloqué dans 24h\")\\n3. On vous demande des informations personnelles\\n4. Le lien dans l''email pointe vers un site différent"},{"type":"quiz","id":"q1","question":"Lequel de ces emails est suspect ?","options":["Votre salaire a été viré. Vérifiez votre compte sur sonabhy.bf","URGENT : Votre accès Orange Money est suspendu. Cliquez ici pour réactiver : orange-verify.net","Le bulletin de paie de mars est disponible sur l''intranet RH"],"correct":1,"explanation":"L''URL orange-verify.net n''est pas le domaine officiel d''Orange. De plus, la création d''urgence est une technique d''hameçonnage classique."}]}',
   true),

  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'mots-de-passe-forts', 'Créer un mot de passe fort', 'micro_lesson', 'easy', 4,
   ARRAY['password', 'basics'],
   '{"blocks":[{"type":"heading","level":1,"text":"Un bon mot de passe : comment faire ?"},{"type":"paragraph","text":"Un bon mot de passe doit être long (12+ caractères), unique pour chaque service, et difficile à deviner. Évitez les dates de naissance, prénoms ou mots du dictionnaire."},{"type":"callout","variant":"info","text":"Astuce : utilisez une phrase mémorable. Ex: ''MonFilsEstNé@Ouaga2019!'' est bien plus sûr que ''sonabhy123''."},{"type":"quiz","id":"q2","question":"Quel mot de passe est le plus sécurisé ?","options":["sonabhy2024","Aziz@SONABHY!","J''AdoreMonTravailEnBF#2026!","123456"],"correct":2,"explanation":"La phrase longue avec majuscules, chiffres et symboles est la plus solide. Plus c''est long, plus c''est difficile à craquer."}}]}',
   true),

  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'signaler-email-suspect', 'Comment signaler un email suspect', 'micro_lesson', 'easy', 3,
   ARRAY['phishing', 'reporting'],
   '{"blocks":[{"type":"heading","level":1,"text":"Signaler un email suspect : la bonne réaction"},{"type":"paragraph","text":"Signaler un email suspect est le geste le plus utile que vous puissiez faire. Cela protège vos collègues et alerte la DSI SONABHY immédiatement."},{"type":"heading","level":2,"text":"Les étapes"},{"type":"paragraph","text":"1. N''ouvrez pas les pièces jointes\\n2. Ne cliquez pas sur les liens\\n3. Transférez l''email à securite@sonabhy.bf\\n4. Ou utilisez le bouton ''Signaler'' dans Outlook\\n5. Supprimez l''email"},{"type":"callout","variant":"info","text":"Un email signalé = un collègue potentiellement protégé. Le signalement améliore votre score de vigilance."},{"type":"quiz","id":"q3","question":"Que faire en premier si vous recevez un email suspect ?","options":["Ouvrir la pièce jointe pour vérifier","Appeler l''expéditeur pour confirmation","Ne rien faire, supprimer directement","Transférer à securite@sonabhy.bf sans cliquer sur rien"],"correct":3,"explanation":"Transférer sans cliquer permet à la DSI d''analyser la menace et de protéger tous vos collègues."}}]}',
   true),

  -- Module JIT : remédiation phishing Mobile Money
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', null,
   'jit-orange-money', 'JIT : Vous avez cliqué sur un faux Orange Money', 'jit_remediation', 'easy', 3,
   ARRAY['phishing', 'mobile_money', 'orange_money'],
   '{"blocks":[{"type":"heading","level":1,"text":"Ce qui vient de se passer"},{"type":"paragraph","text":"Vous venez de cliquer sur un email simulant une demande Orange Money. Ce type d''attaque est l''un des plus courants au Burkina Faso."},{"type":"callout","variant":"danger","text":"Orange Money ne vous demandera JAMAIS votre code PIN par email ou SMS. Si quelqu''un le demande, c''est une arnaque."},{"type":"heading","level":2,"text":"Les 3 réflexes Orange Money"},{"type":"paragraph","text":"1. Ne jamais partager votre PIN, même avec un prétendu agent Orange\\n2. Les vrais messages Orange Money viennent du numéro 1445, pas d''une adresse email\\n3. En cas de doute, appelez le 1445 directement"},{"type":"quiz","id":"jit_q1","question":"Orange Money vous contacte par email pour vérifier votre compte. Que faites-vous ?","options":["Je clique sur le lien pour vérifier","Je donne mon PIN pour débloquer","J''appelle le 1445 pour vérifier si c''est légitime","Je transfère mes fonds vers un autre compte par précaution"],"correct":2,"explanation":"Appelez toujours le 1445 pour vérifier. Orange Money ne vous contacte jamais par email pour votre PIN."}}]}',
   true),

  -- Templates phishing (simulations)
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', null,
   'jit-sonabhy-rh', 'JIT : Faux email RH SONABHY', 'jit_remediation', 'medium', 4,
   ARRAY['phishing', 'sonabhy_rh', 'spear_phishing'],
   '{"blocks":[{"type":"heading","level":1,"text":"Un email RH SONABHY peut être faux"},{"type":"paragraph","text":"L''email que vous avez cliqué imitait une communication RH de SONABHY. Les attaquants ciblent précisément votre entreprise pour rendre la tromperie plus crédible."},{"type":"callout","variant":"warning","text":"Les vrais emails RH SONABHY viennent uniquement de @sonabhy.bf. Vérifiez toujours l''adresse complète, pas seulement le nom affiché."},{"type":"quiz","id":"jit_q2","question":"Vous recevez un email ''RH SONABHY'' depuis ''rh@sonabhy-update.com''. C''est...","options":["Légitime — c''est un domaine officiel","Suspect — le domaine n''est pas sonabhy.bf","Normal — RH utilise parfois des domaines externes","Pas important si le nom affiché est correct"],"correct":1,"explanation":"Seul @sonabhy.bf est le domaine officiel. rh@sonabhy-update.com est un domaine frauduleux conçu pour tromper."}}]}',
   true);

-- ─── TEMPLATES PHISHING CONTEXTUALISÉS ───────────────────────────────────────

insert into phishing_templates (id, organization_id, name, channel, subject, body_html, sender_name, sender_email, landing_page_slug, difficulty, topic_tags, context_tags) values

  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Orange Money — Vérification urgente', 'email',
   'URGENT : Votre compte Orange Money nécessite une vérification',
   '<p>Cher(e) client(e),</p><p>Votre compte Orange Money a été temporairement suspendu suite à une activité inhabituelle. Cliquez sur le lien ci-dessous pour réactiver votre accès :</p><p><a href="{{click_url}}">Réactiver mon compte Orange Money</a></p><p>Sans action de votre part dans les 24 heures, votre compte sera définitivement bloqué.</p><p>L''équipe Orange Money</p>',
   'Orange Money Burkina', 'securite@orange-bf.com',
   'orange-money-verify', 'medium',
   ARRAY['phishing', 'mobile_money', 'orange_money'],
   ARRAY['orange_money', 'urgence']),

  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'SONABHY RH — Mise à jour informations bancaires', 'email',
   'Important : Mise à jour de vos informations de virement',
   '<p>Cher(e) collaborateur(trice),</p><p>Dans le cadre de la mise à jour de notre système de paie, nous vous demandons de vérifier et mettre à jour vos informations bancaires avant le 15 du mois.</p><p><a href="{{click_url}}">Accéder au formulaire de mise à jour</a></p><p>Direction des Ressources Humaines — SONABHY</p>',
   'RH SONABHY', 'rh@sonabhy-update.com',
   'sonabhy-rh', 'medium',
   ARRAY['phishing', 'sonabhy_rh', 'spear_phishing'],
   ARRAY['sonabhy_rh', 'paie']),

  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   'Ministère des Finances — Remboursement', 'email',
   'Notification de remboursement — Ministère de l''Économie et des Finances',
   '<p>Monsieur/Madame,</p><p>Suite à la régularisation fiscale 2025, vous bénéficiez d''un remboursement de 45 000 FCFA. Pour recevoir votre remboursement, veuillez compléter le formulaire en ligne :</p><p><a href="{{click_url}}">Accéder à mon remboursement</a></p><p>Ministère de l''Économie et des Finances du Burkina Faso</p>',
   'Ministère des Finances', 'remboursement@minfinances-bf.org',
   'min-finances', 'hard',
   ARRAY['phishing', 'administration'],
   ARRAY['min_finances', 'remboursement']),

  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   'Moov Money — Solde à récupérer', 'email',
   'Un transfert de 50 000 FCFA vous attend — Action requise',
   '<p>Bonjour,</p><p>Un transfert Moov Money de 50 000 FCFA a été envoyé sur votre numéro mais n''a pas pu être traité. Vous avez 30 minutes pour le récupérer :</p><p><a href="{{click_url}}">Récupérer mon argent</a></p><p>Service Moov Money</p>',
   'Moov Money', 'transfert@moov-money-bf.net',
   'moov-money', 'medium',
   ARRAY['phishing', 'mobile_money', 'moov_money'],
   ARRAY['moov_money', 'urgence']);

-- ─── CAMPAGNE HISTORIQUE 1 ───────────────────────────────────────────────────

insert into phishing_campaigns (id, organization_id, name, template_id, status, target_cohort_filter, scheduled_at, sent_at, completed_at, created_by) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Campagne Baseline T0 — Orange Money',
   '50000000-0000-0000-0000-000000000001',
   'completed',
   '{}', -- toute l''organisation
   now() - interval '45 days',
   now() - interval '45 days',
   now() - interval '44 days',
   '20000000-0000-0000-0000-000000000001');

-- Sends pour campagne 1 (10 utilisateurs)
insert into phishing_sends (id, campaign_id, user_id, send_token, sent_at) values
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', 'token-demo-001', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000013', 'token-demo-002', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000022', 'token-demo-003', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000023', 'token-demo-004', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000031', 'token-demo-005', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000032', 'token-demo-006', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000033', 'token-demo-007', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000042', 'token-demo-008', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000014', 'token-demo-009', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000034', 'token-demo-010', now() - interval '45 days');

-- Événements : delivered pour tous, clicked pour 4, reported pour 2
insert into phishing_events (send_id, user_id, campaign_id, event_type, occurred_at) values
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000023', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000031', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000032', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000033', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000042', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  ('70000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000034', '60000000-0000-0000-0000-000000000001', 'delivered', now() - interval '45 days'),
  -- Clics (4/10 = 40% click rate baseline)
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000001', 'clicked', now() - interval '44 days' + interval '2 hours'),
  ('70000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000033', '60000000-0000-0000-0000-000000000001', 'clicked', now() - interval '44 days' + interval '5 hours'),
  ('70000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000042', '60000000-0000-0000-0000-000000000001', 'clicked', now() - interval '44 days' + interval '1 hour'),
  ('70000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000001', 'clicked', now() - interval '44 days' + interval '4 hours'),
  -- Signalements (2/10 = 20% report rate)
  ('70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000023', '60000000-0000-0000-0000-000000000001', 'reported', now() - interval '44 days' + interval '30 minutes'),
  ('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000001', 'reported', now() - interval '44 days' + interval '45 minutes');

-- ─── RISK SCORES (30 jours de snapshots pour les courbes) ─────────────────────

-- Génération de snapshots journaliers pour 5 utilisateurs représentatifs sur 30 jours
-- (Dans la vraie vie, générés par compute-scores Edge Function)

do $$
declare
  v_day integer;
  v_users uuid[] := ARRAY[
    '20000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid
  ];
  -- Scores de base par user (T0), qui progressent ou régressent
  v_base_scores float[] := ARRAY[85, 35, 72, 65, 40];
  v_user_id uuid;
  v_score float;
  v_base float;
begin
  for v_day in 1..30 loop
    for i in 1..array_length(v_users, 1) loop
      v_user_id := v_users[i];
      v_base := v_base_scores[i];

      -- Simulation d'une progression réaliste avec bruit
      v_score := v_base + (v_day * 0.5) + (random() * 6 - 3);
      v_score := greatest(0, least(100, v_score));

      -- Le user qui a cliqué (index 2 = user 12) régresse après la campagne puis remonte
      if i = 2 and v_day < 10 then
        v_score := v_base - 15 + (v_day * 2) + (random() * 4);
      end if;

      insert into risk_scores (user_id, snapshot_date, score, quiz_component, phishing_component, engagement_component, report_bonus, computation_version)
      values (
        v_user_id,
        (current_date - (30 - v_day) * interval '1 day')::date,
        round(v_score::numeric, 2),
        round((v_score * 0.9 + random() * 5)::numeric, 2),
        round((v_score * 1.05 + random() * 8 - 4)::numeric, 2),
        round((v_score * 0.85 + random() * 10)::numeric, 2),
        case when i in (3,4) then round((random() * 3)::numeric, 2) else 0 end,
        'v1.0.0-seed'
      )
      on conflict (user_id, snapshot_date) do nothing;
    end loop;
  end loop;
end;
$$;

-- ─── CONSENTEMENTS ────────────────────────────────────────────────────────────

-- Consentements pour les utilisateurs avec profil (simulation de l'onboarding)
insert into security_consents (user_id, scope, granted) values
  ('20000000-0000-0000-0000-000000000001', 'phishing_simulation', true),
  ('20000000-0000-0000-0000-000000000001', 'behavior_analytics', true),
  ('20000000-0000-0000-0000-000000000001', 'individual_reporting', true),
  ('20000000-0000-0000-0000-000000000012', 'phishing_simulation', true),
  ('20000000-0000-0000-0000-000000000012', 'behavior_analytics', true),
  ('20000000-0000-0000-0000-000000000012', 'individual_reporting', false),
  ('20000000-0000-0000-0000-000000000022', 'phishing_simulation', true),
  ('20000000-0000-0000-0000-000000000022', 'behavior_analytics', true),
  ('20000000-0000-0000-0000-000000000022', 'individual_reporting', false),
  ('20000000-0000-0000-0000-000000000023', 'phishing_simulation', true),
  ('20000000-0000-0000-0000-000000000023', 'behavior_analytics', true),
  ('20000000-0000-0000-0000-000000000023', 'individual_reporting', true);

commit;
