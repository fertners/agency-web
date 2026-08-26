# Passation de la conversation Codex

## 26 août 2026 — Pipeline thèmes et contenu Restaurant

- Ajout des contrats validés `BrandProfile`, `ContentProfile`, sources,
  provenance des assets et `ThemeSelection`.
- Ajout de trois thèmes Restaurant contrôlés : Editorial, Maison et Studio.
- La génération sélectionne maintenant le thème d'après les signaux métier et
  de marque, avec Editorial comme fallback explicite de la catégorie.
- Les couleurs et typographies sourcées remplacent les valeurs du thème. Les
  sections sans données vérifiées sont omises au lieu d'être inventées.
- Le contexte complet est conservé dans chaque nouvelle `WebsiteVersion` et
  résumé sur `/websites/:id`.
- Migration ajoutée : `0010_restaurant_theme_catalog.sql`.
- Les thèmes gratuits externes restent des références tant que les licences du
  code et des assets ne sont pas auditées. Aucun dépôt externe n'est exécuté.
- Architecture et suite : `docs/website-theme-pipeline.md`.

### Enrichissement Research et premier thème MIT normalisé

- Overpass produit maintenant un `BrandProfile` réel avec URL de l'objet OSM,
  timestamp, cuisines, horaires bruts, réseaux sociaux et références d'assets.
- Les assets externes sont `PENDING_REVIEW` et ne sont jamais rendus tant qu'ils
  ne sont pas explicitement `VERIFIED`.
- Ajout de `POST /websites/from-prospect/:prospectId` et du bouton
  **Generate Website** sur la fiche Prospect.
- Le workflow réel a été validé avec le prospect OpenStreetMap
  `Clay's Downtown Restaurant` : job terminé, Website V1, source de marque
  `OPENSTREETMAP`, aucune image non validée rendue.
- Chef's Kitchen a été audité au commit
  `2910c50abefa7a367015697f4cd5b96be95771fb` puis normalisé sous
  `restaurant-chefs-kitchen-v1`.
- Le code est MIT, mais les images n'ont pas de licence individuelle documentée
  dans le dépôt : elles ont été exclues, ainsi que les données fictives et le
  formulaire externe codé en dur.

## Demande et contexte

Le projet construit une agence web automatisée, maintenable par un développeur seul. Le cahier des charges original est copié dans `docs/PROJECT_SPECIFICATION.md`.

L'utilisateur a validé progressivement les phases 1 à 5. Il souhaite désormais poursuivre exclusivement dans `D:\galatic-webapp` et conserver le contexte de cette conversation.

## État livré

- Phase 1 : monorepo, dashboard, API NestJS, PostgreSQL/Drizzle, Redis/BullMQ, jobs.
- Phase 2 : moteur de sites restaurant, génération structurée, preview.
- Phase 3 : Playwright, captures desktop/mobile, design review, corrections et versions.
- Phase 4 : SEO déterministe, données structurées, accessibilité, performance et QA.
- Phase 5 : entreprises/prospects, dédoublonnage, analyse et score d'opportunité, queue/worker/API/dashboard.

La documentation détaillée se trouve dans `docs/phase-1.md` à `docs/phase-5.md`.

## Dernier changement important

Le fournisseur local de démonstration a été remplacé par `OverpassBusinessSearchProvider`, basé sur les données réelles OpenStreetMap :

- recherche par pays, ville et catégorie ;
- endpoint et User-Agent configurables ;
- validation et normalisation des réponses ;
- attribution ODbL dans `/prospects` ;
- fournisseur local conservé uniquement pour les tests via `BUSINESS_SEARCH_PROVIDER=local`.

Cinq mocks `local-deterministic` ont été supprimés de PostgreSQL. Une recherche réelle à Lyon a persisté cinq entrées `openstreetmap-overpass` : Monts Restaurant, La Taverne de l'Ermite, Les Moissons, La Table de Ninon et La petite maison.

## Validations effectuées

- migration Phase 5 appliquée ;
- workflow réel BullMQ terminé ;
- dédoublonnage vérifié ;
- tests du package prospects : 3/3 ;
- lint prospects/research/API/dashboard ;
- typecheck ciblé ;
- build dashboard réussi ;
- `/prospects` répond en HTTP 200 et affiche uniquement la source OpenStreetMap.

## Services locaux

- Dashboard : `http://localhost:3000/prospects`
- API : `http://127.0.0.1:3001`
- Preview : `http://127.0.0.1:3002`
- PostgreSQL et Redis via Docker Compose.

Les processus lancés depuis l'ancien workspace C: ne doivent pas être considérés comme les processus définitifs du projet D:. Les redémarrer depuis D: après synchronisation.

## Contraintes et prochaine action

- Ne pas utiliser de scraping fragile.
- Respecter les conditions et l'attribution OpenStreetMap ; Overpass public convient seulement aux faibles volumes, sans SLA.
- Ne pas automatiser l'envoi commercial sans validation humaine et décision explicite.
- Avant de poursuivre une nouvelle phase, vérifier le repository D:, les migrations, les tests et l'infrastructure.
- Le disque C: n'avait qu'environ 1,19 Go libre ; D: dispose d'environ 222,83 Go.

La copie D: est l’environnement actif. Les Phases 6 et 7 ajoutent le CRM, la conversion client/projet et un workflow de déploiement local traçable avec rollback. Aucun envoi commercial, paiement, domaine public ou fournisseur cloud réel n’est activé.

## Extension Dashboard → Settings — 26 août 2026

L'utilisateur a ensuite fourni les cahiers des charges détaillés des modules Dashboard, Prospects, Companies, Websites, Templates, Clients, Conversations, SEO, Agent Jobs, Analytics et Settings, puis a demandé leur implémentation.

État effectivement implémenté dans `D:\galatic-webapp` :

- layout global unique et menu partagé sur toutes les pages ;
- dashboard agrégé réel, filtre de période, funnel, KPI, agents, jobs et alertes ;
- séparation centrale Company / Prospect / Client et backfill des relations existantes ;
- listes Companies et Prospects paginées côté serveur, filtrées et triées ;
- détails Company, Prospect, Client, Website, Template, Conversation et Agent Job ;
- machine à états Prospect partagée par l'API et le dashboard ;
- statuts Website, Client, Conversation et Job étendus sans supprimer les anciennes données ;
- tables Templates, Client Requests, Payments (références uniquement), Conversation Messages, Job Logs et Settings ;
- SEO déterministe et QA visibles par Website ; une version ne peut plus être approuvée sans rapport réussi ;
- Analytics calculé à partir des données persistées et coûts IA ;
- Settings non sensibles persistés et validés ; les secrets restent dans l'environnement ;
- migration `0009_flashy_ultron.sql` inspectée, corrigée, backfillée et appliquée ;
- endpoints réels testés, sans mocks restaurés.

Les détails de conformité et les limites restantes sont consignés dans `docs/operations-modules.md`. Ne pas présenter ces limites comme déjà livrées.

## Proposition commerciale — tarification et présentation

- Deux offres fixes sont validées : site vitrine à 250 EUR et site dynamique à
  1 000 EUR. Le serveur calcule le prix ; le dashboard ne saisit plus un montant
  libre.
- Une nouvelle proposition exige une Design Review terminée et réutilise sa
  capture desktop Playwright.
- La page publique affiche la capture, conserve un lien secondaire vers la
  preview interactive et propose un bouton **Répondre à cette proposition** qui
  mène aux choix accepter/refuser.

## Orchestration, IA optionnelle et sécurité — 26 août 2026

- Ajout du worker `@ai-web-agency/orchestration-worker` et de
  `POST /prospects/:id/workflow` : génération → Design Review → SEO/QA →
  proposition `NEEDS_REVIEW`, sans envoi automatique.
- Validation réelle sur Clay's Downtown Restaurant : Website V2, Design 92,
  SEO/QA 100 et proposition V5 à 250 EUR.
- Ajout d'un `OpenAIProvider` optionnel via la Responses API et Structured
  Outputs. `AI_PROVIDER=local` reste la valeur locale par défaut. Les captures
  Playwright desktop/mobile sont fournies au modèle vision lorsqu'OpenAI est
  activé, puis les sorties sont revalidées par Zod.
- Ajout de la comparaison visuelle des deux dernières Website Versions et d'un
  restore non destructif réservé aux versions approuvées.
- Ajout de Retry/Cancel contrôlés pour les Agent Jobs.
- Ajout d'une protection de production par `ADMIN_API_TOKEN` et rôle
  `OPERATOR_API_TOKEN` restreint. Les secrets restent dans l'environnement.
- Migration `0014_ai_provider_runtime_defaults.sql` : fournisseur local par
  défaut et modèle OpenAI configurable. Son SQL idempotent a été appliqué
  directement sur la base locale après une erreur mémoire Windows de Drizzle
  CLI ; il pourra être rejoué normalement par Drizzle.
