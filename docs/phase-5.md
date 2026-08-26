# Phase 5 — Prospect Research & Opportunity Scoring

## Livré

- domaine `companies` / `prospects` séparé des `businesses` de génération ;
- `BusinessSearchProvider` interchangeable, avec OpenStreetMap/Overpass par défaut et fournisseur local réservé aux tests ;
- recherche par pays, ville et catégorie (`RESTAURANT` pour le MVP) ;
- empreinte normalisée et upsert idempotent pour éviter les doublons ;
- score d'opportunité explicable, données sources et preuves persistées ;
- queue BullMQ `prospect-research`, worker dédié et suivi dans `agent_jobs` ;
- API `POST /prospects/search` et `GET /prospects` ;
- écran opérationnel `/prospects`.

## Score

Le score représente le potentiel commercial, pas la qualité absolue de l'entreprise.

| Composant                  | Poids |
| -------------------------- | ----: |
| Faiblesse/absence du site  |  25 % |
| Faiblesse mobile           |  20 % |
| Lacunes SEO                |  15 % |
| Qualité de l'activité      |  15 % |
| Fonctionnalités manquantes |  15 % |
| Contactabilité             |  10 % |

Les règles numériques restent la source de vérité. Le résumé qualitatif explique les signaux sans pouvoir modifier le score. Les pondérations doivent totaliser 100.

## Sécurité et conformité

Le MVP ne scrape pas les moteurs de recherche, n'explore pas arbitrairement les URL découvertes et n'envoie aucun e-mail. Les recherches réelles utilisent l'API Overpass, avec endpoint et `User-Agent` configurables. Les résultats OpenStreetMap sont attribués dans l'interface. Les instances publiques sont adaptées aux petits volumes, sans SLA ; un usage commercial intensif devra utiliser une instance dédiée ou un fournisseur contractuel.

## Développement local

```bash
pnpm infra:up
pnpm db:migrate
pnpm --filter @ai-web-agency/api dev
pnpm --filter @ai-web-agency/research-worker dev
pnpm --filter @ai-web-agency/dashboard dev
```

Ouvrir `http://localhost:3000/prospects`, lancer une recherche, puis actualiser lorsque le job est terminé.
