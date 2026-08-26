# Passation de la conversation Codex

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
