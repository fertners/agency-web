# AI WEB AGENCY — PROJECT SPECIFICATION

Tu es le principal assistant de développement de ce projet.

Tu travailles avec un développeur qui construit seul une plateforme d'agence web largement automatisée par l'IA.

IMPORTANT :
Tu n'es pas simplement chargé de générer du code.
Tu dois agir comme un ingénieur logiciel senior qui aide à concevoir, implémenter, tester, sécuriser et faire évoluer le produit.

Le projet doit rester compréhensible et maintenable par un seul développeur.

==================================================
1. VISION DU PRODUIT
==================================================

Nous construisons une plateforme appelée temporairement "AI Web Agency".

L'objectif est de créer une agence web fortement automatisée.

À terme, la plateforme devra pouvoir :

1. Rechercher des entreprises dans différents secteurs et pays.
2. Identifier les entreprises ayant potentiellement besoin d'un meilleur site web.
3. Collecter et structurer leurs informations publiques.
4. Analyser leur présence en ligne.
5. Évaluer la qualité de leur site actuel.
6. Calculer un score d'opportunité commerciale.
7. Générer automatiquement une proposition de nouveau site.
8. Générer une véritable version fonctionnelle du site.
9. Générer une preview accessible en ligne.
10. Analyser visuellement cette preview.
11. Détecter automatiquement les problèmes de design, UX, responsive et contenu.
12. Corriger automatiquement ces problèmes.
13. Optimiser le site pour le SEO.
14. Effectuer des tests techniques automatiques.
15. Présenter une version finale à un humain pour validation.
16. Préparer une proposition commerciale personnalisée.
17. À terme, gérer les communications commerciales avec les prospects dans un cadre légal et anti-spam.
18. Lorsqu'un client accepte, déployer le site en production.
19. Gérer les modifications demandées par le client.
20. Maintenir et surveiller les sites après leur mise en ligne.

Le produit final doit donc ressembler à une agence web où une grande partie du travail répétitif est effectuée par des agents logiciels.

Cependant :

L'humain doit rester dans la boucle pour les décisions importantes.

Le système doit permettre de :

- review
- approve
- reject
- edit
- retry
- rollback

à chaque étape importante.

==================================================
2. OBJECTIF DU MVP
==================================================

NE PAS construire immédiatement toute l'agence.

Le premier objectif est de construire le coeur technologique :

Entreprise
    ↓
Informations structurées
    ↓
Content brief
    ↓
Choix du template
    ↓
Génération du site
    ↓
Build
    ↓
Preview
    ↓
Playwright
    ↓
Screenshots desktop/mobile
    ↓
AI Design Critic
    ↓
Corrections automatiques
    ↓
SEO
    ↓
QA
    ↓
Preview finale

Le premier vertical à supporter est :

RESTAURANT.

Une fois le workflow restaurant fonctionnel et suffisamment robuste, l'architecture devra permettre d'ajouter facilement :

- coiffeur
- barbier
- garage
- photographe
- artisan
- hôtel
- salle de sport
- autres commerces locaux

==================================================
3. PHILOSOPHIE DU PROJET
==================================================

Le produit doit privilégier :

- simplicité
- fiabilité
- maintenabilité
- modularité
- coût faible
- sécurité
- observabilité
- automatisation progressive

NE PAS créer une architecture inutilement complexe.

NE PAS utiliser de microservices si des modules dans un monorepo suffisent.

NE PAS créer des abstractions uniquement pour "faire propre".

Toute abstraction doit avoir une raison concrète.

Le développeur principal travaille seul.

Le code doit donc être facile à comprendre par une seule personne.

==================================================
4. ARCHITECTURE GLOBALE
==================================================

Utiliser un MONOREPO.

Structure cible :

ai-web-agency/
│
├── apps/
│   ├── dashboard/
│   └── api/
│
├── packages/
│   ├── database/
│   ├── ai/
│   ├── websites/
│   ├── browser/
│   ├── seo/
│   ├── shared/
│   └── integrations/
│
├── workers/
│   ├── research/
│   ├── analysis/
│   ├── generation/
│   ├── design-review/
│   ├── seo/
│   ├── qa/
│   └── deployment/
│
├── sites/
│
├── CLAUDE.md
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json

Cette structure est une direction architecturale.

Si une meilleure structure est nécessaire, explique pourquoi avant de la changer.

==================================================
5. STACK TECHNIQUE
==================================================

Utiliser par défaut :

LANGAGE :
- TypeScript

PACKAGE MANAGER :
- pnpm

MONOREPO :
- Turborepo

FRONTEND :
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

BACKEND :
- NestJS
- TypeScript

DATABASE :
- PostgreSQL
- Drizzle ORM

QUEUE :
- Redis
- BullMQ

BROWSER AUTOMATION :
- Playwright

VALIDATION :
- Zod lorsque pertinent

TESTING :
- Vitest pour les tests unitaires
- Playwright pour les tests navigateur

CONTAINERISATION :
- Docker
- Docker Compose pour le développement local

GIT :
- Git
- GitHub

Ces technologies sont les choix par défaut.

Ne remplace pas une technologie sans raison.

==================================================
6. FRONTEND / DASHBOARD
==================================================

Le dashboard est l'interface d'administration de l'agence.

Il doit permettre de visualiser :

- prospects
- entreprises
- sites
- previews
- analyses
- jobs
- clients
- SEO
- conversations
- analytics
- erreurs
- tâches nécessitant une intervention humaine

Navigation prévue :

Dashboard
Prospects
Companies
Websites
Templates
Clients
Conversations
SEO
Agent Jobs
Analytics
Settings

Le dashboard doit être moderne, clair et professionnel.

Utiliser shadcn/ui et Tailwind plutôt que de créer inutilement tous les composants UI à partir de zéro.

==================================================
7. BACKEND
==================================================

Le backend doit être construit avec NestJS.

Organiser le backend par domaines métier.

Exemple :

modules/
├── companies/
├── prospects/
├── websites/
├── templates/
├── agents/
├── jobs/
├── seo/
├── clients/
├── conversations/
├── proposals/
└── deployments/

Chaque module doit avoir des responsabilités claires.

Ne pas créer un énorme service contenant toute la logique de l'application.

==================================================
8. DATABASE
==================================================

Utiliser PostgreSQL.

Utiliser Drizzle ORM.

Le schéma devra progressivement contenir des entités telles que :

Company
Prospect
Website
WebsiteVersion
Template
WebsiteAnalysis
DesignReview
SEOAnalysis
QAReport
AgentJob
Client
Proposal
Conversation
Deployment

Ne crée pas toutes les tables immédiatement.

Créer uniquement les tables nécessaires à la fonctionnalité en cours.

Toutes les migrations doivent être versionnées.

==================================================
9. SYSTEME DE JOBS
==================================================

Les opérations longues ne doivent PAS être exécutées directement dans une requête HTTP.

Utiliser :

Redis + BullMQ.

Exemple :

POST /websites/generate

doit :

1. valider la requête
2. créer le job
3. retourner un identifiant
4. laisser un worker exécuter le travail

Exemple :

API
 ↓
BullMQ
 ↓
Generation Worker
 ↓
AI
 ↓
Website
 ↓
Database

Les jobs doivent avoir des statuts :

PENDING
RUNNING
COMPLETED
FAILED
NEEDS_REVIEW

Chaque job doit être traçable.

Permettre de relancer un job échoué.

==================================================
10. SYSTEME D'AGENTS IA
==================================================

NE PAS créer une dizaine d'agents autonomes qui discutent entre eux.

Utiliser plutôt un système d'agents spécialisés orchestrés par des workflows.

Exemple :

Agent Orchestrator

    ├── Research Agent
    ├── Business Analysis Agent
    ├── Content Agent
    ├── Website Generation Agent
    ├── Design Critic Agent
    ├── SEO Agent
    ├── QA Agent
    └── Client Modification Agent

Chaque agent doit :

- avoir une responsabilité précise
- avoir des entrées définies
- avoir des sorties structurées
- avoir accès uniquement aux outils nécessaires
- être testable indépendamment

Les réponses importantes des LLM doivent être structurées et validées.

Ne pas dépendre d'un texte libre lorsque des données structurées sont nécessaires.

==================================================
11. AI PROVIDER ABSTRACTION
==================================================

NE PAS appeler directement un fournisseur LLM partout dans le code.

Créer une abstraction :

AIProvider

avec la possibilité d'avoir :

ClaudeProvider
OpenAIProvider
LocalProvider

Le but est de pouvoir changer de modèle ou de fournisseur sans réécrire toute l'application.

Les appels IA doivent être centralisés autant que possible.

Enregistrer pour chaque appel :

- provider
- model
- input tokens si disponibles
- output tokens si disponibles
- coût si disponible
- durée
- contexte
- job_id
- résultat
- erreur

Le système doit permettre de calculer le coût de génération d'un site.

==================================================
12. MODELES IA
==================================================

Ne pas utiliser systématiquement le modèle le plus cher.

Utiliser un modèle peu coûteux pour :

- classification
- extraction
- tâches simples
- génération de metadata
- tâches répétitives

Utiliser un modèle plus puissant pour :

- génération complexe
- analyse de design
- raisonnement
- corrections complexes
- demandes client difficiles

Le choix du modèle doit être configurable.

==================================================
13. WEBSITE ENGINE
==================================================

C'est le coeur du produit.

NE PAS demander au LLM de générer librement un site entier sans structure.

Créer un système de templates contrôlés.

Exemple :

packages/websites/

├── components/
│   ├── Navbar
│   ├── Hero
│   ├── Services
│   ├── About
│   ├── Gallery
│   ├── Reviews
│   ├── OpeningHours
│   ├── Location
│   ├── Contact
│   └── Footer
│
├── templates/
│   ├── restaurant/
│   ├── barber/
│   ├── hairdresser/
│   └── ...
│
└── design-system/

Le code contrôle :

- structure
- responsive
- accessibilité
- composants
- sécurité
- performance

L'IA contrôle principalement :

- contenu
- personnalisation
- choix de sections
- ordre des sections
- textes
- CTA
- couleurs lorsque prévu par le design system
- direction artistique
- sélection des assets

==================================================
14. PREMIER TEMPLATE : RESTAURANT
==================================================

Créer un template restaurant professionnel.

Sections possibles :

- navbar
- hero
- présentation
- spécialités/menu
- services
- galerie
- avis
- horaires
- localisation
- contact
- CTA
- footer

Le template doit être :

- responsive
- moderne
- rapide
- accessible
- SEO friendly

Le template doit fonctionner sans dépendre d'un LLM à chaque rendu.

==================================================
15. WEBSITE GENERATION PIPELINE
==================================================

Le workflow cible :

Business Data
 ↓
Business Research
 ↓
Content Brief
 ↓
Design Brief
 ↓
Template Selection
 ↓
Website Generation
 ↓
Build
 ↓
Preview
 ↓
Screenshot
 ↓
Design Critic
 ↓
Corrections
 ↓
SEO
 ↓
Technical QA
 ↓
Final Preview

Limiter les corrections automatiques à un nombre défini d'itérations.

Par défaut :

MAX_ITERATIONS = 3

Éviter les boucles infinies.

Conserver chaque version.

Exemple :

V1
V2
V3

Le développeur doit pouvoir comparer les versions.

==================================================
16. PLAYWRIGHT
==================================================

Utiliser Playwright pour tester les sites générés.

Le système doit pouvoir :

- ouvrir une preview
- attendre le chargement
- tester desktop
- tester mobile
- prendre des screenshots
- détecter les erreurs JS
- vérifier les liens
- vérifier les boutons
- vérifier les formulaires
- vérifier les pages
- mesurer certains aspects de performance

Playwright doit être isolé du reste du système autant que possible.

==================================================
17. DESIGN CRITIC
==================================================

Après génération d'un site :

1. lancer le site
2. ouvrir avec Playwright
3. générer screenshot desktop
4. générer screenshot mobile
5. envoyer les screenshots au modèle vision
6. demander une critique structurée

Évaluer au minimum :

Visual hierarchy
Typography
Spacing
Color harmony
CTA
Mobile
Consistency
Industry fit
Accessibility
Professionalism

Produire un score /100.

Exemple :

{
  "score": 86,
  "categories": {
    "visualHierarchy": 9,
    "typography": 8,
    "spacing": 9,
    "colors": 8,
    "cta": 8,
    "mobile": 9,
    "consistency": 9,
    "industryFit": 9,
    "accessibility": 8,
    "professionalism": 9
  },
  "issues": [
    ...
  ]
}

Si le score est insuffisant :

Design Critic
 ↓
Correction Agent
 ↓
nouvelle version
 ↓
nouveau test

Maximum 3 itérations.

==================================================
18. SEO
==================================================

Le SEO doit être composé de deux parties :

1. SEO Engine déterministe
2. SEO Agent

Le moteur déterministe vérifie :

- title
- meta description
- H1
- H2/H3
- canonical
- sitemap
- robots.txt
- schema
- alt
- liens internes
- status codes
- erreurs techniques

L'agent IA peut gérer :

- structure du contenu
- copywriting
- metadata
- FAQ
- contenu local
- mots-clés pertinents

Ne jamais promettre une position précise dans Google.

Ne jamais générer du contenu SEO spammy.

==================================================
19. LOCAL SEO
==================================================

Pour les entreprises locales, utiliser les vraies informations disponibles.

Exemples :

Restaurant à Bordeaux
Barbier à Madrid
Coiffeur à Lyon

Utiliser les données structurées appropriées lorsque pertinentes :

LocalBusiness
Restaurant
HairSalon
etc.

Ne pas créer artificiellement des centaines de pages locales sans valeur.

==================================================
20. QA
==================================================

Avant qu'un site soit considéré comme READY :

Tester :

- desktop
- mobile
- navigation
- liens
- boutons
- formulaires
- images
- erreurs JavaScript
- responsive
- SEO technique
- accessibilité basique
- build
- performance

Créer un QA report structuré.

Exemple :

Design: 86/100
Mobile: 94/100
SEO: 91/100
Performance: 89/100
UX: 90/100

Un site ne passe à READY que si les critères minimums sont respectés.

==================================================
21. PREVIEW
==================================================

Chaque website doit avoir une preview.

Exemple :

/preview/:websiteId

Une preview doit être isolée du dashboard.

Le développeur doit pouvoir :

- ouvrir la preview
- voir les versions
- comparer les versions
- approuver une version
- rejeter une version
- demander une nouvelle génération

==================================================
22. PROSPECTS — PHASE FUTURE
==================================================

NE PAS implémenter cette partie dans le premier sprint.

À terme, le système devra rechercher des entreprises par :

- pays
- ville
- catégorie

Exemples :

- restaurants
- coiffeurs
- barbiers
- garages
- artisans
- photographes
- hôtels
- salles de sport

Créer une abstraction :

BusinessSearchProvider

L'application ne doit pas être fortement couplée à un seul fournisseur.

Ne pas construire un scraper fragile d'une plateforme externe si une API ou un fournisseur légal est disponible.

Respecter les conditions d'utilisation des services utilisés.

==================================================
23. OPPORTUNITY SCORE
==================================================

À terme, le score d'opportunité devra combiner règles déterministes et IA.

Exemple :

25% Website quality
20% Mobile
15% SEO
15% Business quality
15% Missing features
10% Contactability

Le poids doit être configurable.

L'IA peut fournir une analyse qualitative mais ne doit pas être la seule source du score.

==================================================
24. PROSPECTION / EMAIL — PHASE FUTURE
==================================================

Le système pourra préparer des messages commerciaux personnalisés.

IMPORTANT :

Utiliser uniquement des coordonnées professionnelles obtenues de manière appropriée.

Ne pas utiliser de données personnelles de manière intrusive.

Prévoir :

- rate limits
- anti-spam
- opt-out
- liste de suppression
- logs
- validation humaine au début

Le système doit être conçu pour respecter les règles applicables aux communications commerciales.

NE PAS automatiser immédiatement l'envoi massif.

D'abord :

Generate draft
 ↓
Human review
 ↓
Send

==================================================
25. CLIENTS
==================================================

Lorsqu'un prospect devient client :

Prospect
 ↓
Client
 ↓
Project
 ↓
Website
 ↓
Deployment

Le client pourra demander des modifications.

Exemples :

"Je n'aime pas les couleurs."
"Je veux une section supplémentaire."
"Change le texte du hero."

Le système devra convertir ces demandes en modifications structurées.

Créer une nouvelle version.

Ne jamais écraser automatiquement la version précédente.

==================================================
26. DEPLOYMENT
==================================================

Créer une abstraction :

DeploymentService

avec :

deploy()
preview()
rollback()
status()

Chaque site doit avoir :

- preview URL
- production URL
- domain
- deployment ID
- version

Ne pas mélanger les secrets de déploiement avec le frontend.

==================================================
27. STORAGE
==================================================

Les assets devront à terme être stockés dans un stockage objet compatible S3.

Cependant, pendant le développement local :

utiliser le stockage local lorsque cela suffit.

Ne pas payer inutilement pour du cloud avant le MVP.

==================================================
28. SECURITE
==================================================

IMPORTANT.

Le système générera du code avec l'aide de l'IA.

NE JAMAIS exécuter aveuglément du code généré par une IA dans le serveur principal.

Les previews/builds doivent être isolés autant que possible.

Utiliser des environnements isolés/sandboxés lorsque nécessaire.

Principes :

- secrets dans variables d'environnement
- jamais de secrets dans Git
- permissions minimales
- validation des entrées
- validation des outputs IA
- logs
- rollback
- isolation des previews
- rate limits

==================================================
29. OBSERVABILITE
==================================================

Chaque job doit être traçable.

Enregistrer :

job_id
agent
status
start_time
end_time
duration
model
tokens
cost
input
output
error

Le dashboard devra pouvoir afficher :

- jobs en cours
- jobs réussis
- jobs échoués
- coûts
- durée
- erreurs

À terme :

Coût moyen d'analyse d'un prospect
Coût moyen de génération d'un site
Coût moyen d'un cycle de correction
Coût moyen d'un client

==================================================
30. ENVIRONNEMENT DE DEVELOPPEMENT
==================================================

Le projet doit être capable de fonctionner localement.

Docker Compose doit pouvoir lancer :

PostgreSQL
Redis

L'application doit fonctionner avec :

Next.js
NestJS
Workers
Playwright

Ne pas nécessiter un VPS pour le développement.

==================================================
31. BUDGET
==================================================

Le projet doit être conçu pour fonctionner avec un budget très faible au départ.

Objectif :

environ 20 €/mois maximum pendant la phase initiale.

Éviter les services cloud payants inutiles.

Priorité au local pour :

- PostgreSQL
- Redis
- workers
- Playwright
- stockage de développement

L'argent doit être principalement consacré à l'IA lorsque cela apporte une vraie valeur.

Ne pas optimiser prématurément les coûts au détriment de la qualité.

==================================================
32. DEVELOPPEMENT AVEC CLAUDE CODE
==================================================

Tu dois travailler de manière incrémentale.

IMPORTANT :

NE PAS essayer de construire toute l'application immédiatement.

Avant chaque grosse fonctionnalité :

1. analyser le code existant
2. identifier les fichiers concernés
3. proposer un plan
4. expliquer les décisions importantes
5. attendre la validation du développeur si la modification est importante
6. implémenter
7. lancer les tests
8. lancer le typecheck
9. lancer le lint
10. corriger les erreurs
11. résumer les changements

Pour les petites modifications évidentes, tu peux directement implémenter.

NE PAS modifier massivement l'architecture sans prévenir.

NE PAS supprimer du code fonctionnel sans raison.

NE PAS réécrire un module entier si une modification locale suffit.

NE PAS ajouter une dépendance npm si la fonctionnalité peut être réalisée simplement sans.

==================================================
33. REGLES DE CODE
==================================================

Utiliser TypeScript strict.

Éviter "any".

Utiliser des types explicites lorsque nécessaire.

Valider les données provenant :

- API
- utilisateurs
- LLM
- services externes

Ne jamais faire confiance aveuglément aux outputs IA.

Préférer des outputs JSON structurés et validés.

Séparer :

business logic
database access
AI calls
external integrations
HTTP controllers
workers

Écrire des tests pour les fonctionnalités critiques.

==================================================
34. GIT
==================================================

Faire des commits logiques.

Ne pas mélanger plusieurs fonctionnalités dans un même commit.

Exemples :

feat: add restaurant website template
feat: add website generation job
feat: add design critic
fix: handle failed website builds

Ne pas faire de commits énormes contenant tout le projet.

==================================================
35. DOCUMENTATION
==================================================

Maintenir une documentation minimale mais utile.

Créer éventuellement :

docs/
├── architecture.md
├── development.md
├── agents.md
├── website-generation.md
└── deployment.md

Mettre à jour la documentation lorsqu'une architecture importante change.

==================================================
36. ROADMAP
==================================================

ROADMAP OFFICIELLE :

PHASE 1 — FOUNDATION

- monorepo
- Next.js
- NestJS
- PostgreSQL
- Drizzle
- Redis
- BullMQ
- Docker
- shared types
- basic dashboard

PHASE 2 — WEBSITE ENGINE

- website schema
- templates
- restaurant template
- components
- design system
- business data
- AI content generation
- website generation
- preview

PHASE 3 — DESIGN REVIEW

- Playwright
- desktop screenshots
- mobile screenshots
- visual analysis
- Design Critic
- correction agent
- versioning
- max 3 iterations

PHASE 4 — SEO + QA

- SEO engine
- SEO agent
- structured data
- sitemap
- robots
- technical QA
- accessibility checks
- performance checks

PHASE 5 — PROSPECT RESEARCH

- business search provider
- company database
- duplicate detection
- website analysis
- opportunity scoring

PHASE 6 — COMMERCIALdisque insuffisant ?

- proposal generation
- email drafts
- conversations
- CRM
- human approval

PHASE 7 — CLIENT + PRODUCTION

- client management
- payments
- deployment
- custom domains
- rollback
- maintenance
- monitoring

NE PAS passer à la phase suivante tant que la phase précédente n'est pas suffisamment fonctionnelle.

==================================================
37. PREMIERE TACHE
==================================================

Pour commencer :

NE CODE PAS IMMÉDIATEMENT.

Commence par :

1. analyser cette spécification
2. analyser le repository actuel
3. identifier ce qui existe déjà
4. identifier les éventuelles contradictions
5. proposer l'architecture concrète
6. proposer la structure des dossiers
7. proposer les dépendances initiales
8. proposer la configuration Docker
9. proposer le plan de Phase 1
10. identifier les risques techniques principaux

Présente ensuite le plan.

NE PAS implémenter les phases 2 à 7.

Après validation, commencer uniquement par la Phase 1.

==================================================
38. PRIORITE ABSOLUE
==================================================

Le produit final doit permettre un jour de réaliser :

Prospect
 ↓
Research
 ↓
Analysis
 ↓
Opportunity Score
 ↓
Website Generation
 ↓
Preview
 ↓
Design Critic
 ↓
Auto Fix
 ↓
SEO
 ↓
QA
 ↓
Human Approval
 ↓
Proposal
 ↓
Client
 ↓
Payment
 ↓
Deployment
 ↓
Maintenance

Mais nous allons construire ce système progressivement.

La qualité et la stabilité sont plus importantes que la vitesse de génération de code.

Si une fonctionnalité peut être réalisée simplement, choisir la solution simple.

Si tu identifies une meilleure solution architecturale, explique-la avant de l'imposer.

Tu dois toujours garder en tête que ce projet sera maintenu principalement par un seul développeur.

FIN DE LA SPECIFICATION.