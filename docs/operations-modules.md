# Modules Dashboard → Settings

## Architecture retenue

`Company` est la source centrale de l'identité d'une entreprise. `Prospect` porte la relation commerciale, `Client` la relation après conversion, `Project` la livraison et `Website` l'état/versionnement du site. Les contrôleurs HTTP, services métier, repositories Drizzle et queues BullMQ restent séparés.

Les données affichées par le dashboard proviennent de l'API et de PostgreSQL. Aucune page ne fabrique de KPI ou d'entité de démonstration.

## Fonctionnel

- Dashboard : KPI, funnel, état des agents, jobs récents, alertes et périodes.
- Companies : pagination, recherche, filtres, tri, détail et relations.
- Prospects : pagination, filtres, tri, identité, score expliqué, historique, notes, propositions et transitions contrôlées.
- Websites : versions immuables, preview, design review, SEO, QA et approbation bloquée si QA échoue.
- Templates : registre versionné ; Restaurant V1 actif, Barber et Hairdresser explicitement en brouillon.
- Clients : Company liée, projets, Websites, demandes, paiements référencés et conversations.
- Conversations : statuts, intent, priorité, contexte limité, messages et brouillons avec validation humaine.
- SEO : moteur déterministe existant, rapports par version et vue centrale.
- Agent Jobs : statut durable, agent, queue, entité, coûts, tokens, logs et correlation ID.
- Analytics : funnel, coûts IA et qualité Website.
- Settings : sections, persistance, validation et exclusion des secrets.

## Limites explicites à traiter

- L'action `Analyze` d'un Prospect n'a pas encore son job BullMQ dédié ; l'analyse initiale est exécutée par le workflow Research.
- `Generate Website` et `Generate Proposal` depuis la fiche Prospect ne sont pas encore des workflows orchestrés de bout en bout.
- La comparaison visuelle V1/V2 et la restauration d'une ancienne version Website restent à ajouter. Le rollback de déploiement Phase 7 existe déjà.
- Barber et Hairdresser ne sont pas déclarés actifs : leur moteur de rendu réel n'est pas encore implémenté.
- Le workflow de création/traitement d'une demande Client est modélisé en base mais n'a pas encore ses endpoints de mutation ni son worker.
- L'analyse IA des conversations n'est pas branchée. Aucun envoi automatique ou fournisseur email n'est activé.
- Retry/cancel des Agent Jobs ne sont pas exposés tant que l'annulation BullMQ atomique et les limites de retry ne sont pas garanties.
- L'authentification, les rôles et les permissions administrateur ne font pas encore partie du projet ; Settings ne doit pas être exposé publiquement avant cette couche.
- Paiement réel, domaine personnalisé et déploiement cloud restent volontairement hors service faute de fournisseurs et décisions explicites.

Ces limites sont des travaux futurs réels, pas des données fictives ni des boutons décoratifs.

# Proposition commerciale publique

Une proposition créée depuis un prospect exige une analyse persistée et une
version de website prévisualisable. Le contenu est déterministe : présentation,
score, problèmes réellement présents dans l'analyse, périmètre, prix, délai et
capture Playwright de la prévisualisation. Le bouton de réponse ouvre la page
publique ; aucune URL brute n'est intégrée au message. Les tarifs sont imposés
côté serveur : site vitrine `250 EUR`, site dynamique `1 000 EUR`. Aucun envoi
automatique n'est effectué.

Après validation humaine, le lien public est actif pendant 30 jours. Une
acceptation conserve le prospect et le passe à `INTERESTED`. Un refus supprime
la Company et le Prospect tant qu'ils ne sont pas déjà clients, puis conserve
seulement une empreinte SHA-256 dans `contact_suppressions` pour empêcher une
nouvelle prospection. Sans réponse, un nettoyage idempotent exécuté au démarrage
de l'API puis toutes les heures supprime les données commerciales expirées.

Références de conformité :

- https://www.cnil.fr/la-prospection-commerciale-par-courrier-electronique
- https://www.cnil.fr/fr/comment-utiliser-une-liste-repoussoir-pour-respecter-lopposition-la-prospection-commerciale
