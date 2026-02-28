<!--
Sync Impact Report
Version change: N/A → 1.0.0 (initial ratification)
Added sections: Core Principles (I–V), Technology Constraints, Development Workflow, Governance
Templates updated: ✅ spec-template.md (compatible), ✅ plan-template.md (compatible), ✅ tasks-template.md (compatible)
Deferred TODOs: none
-->

# Listes Élections Municipales 2026 Constitution

## Core Principles

### I. Data Integrity

Les données affichées DOIVENT refléter exactement le CSV source au moment du dernier import.
Le script d'import DOIT effectuer un drop-and-reload complet (aucune synchronisation
partielle). Les transformations de données DOIVENT être documentées dans le script.
L'application est strictement en lecture seule — aucune donnée utilisateur n'est persistée.

### II. User Experience First

L'interface DOIT suivre un design flat moderne inspiré des sites institutionnels français
(esthétique gouv.fr) : typographie claire, hiérarchie forte, palette officielle Marianne.
Le dark mode et le light mode DOIVENT tous deux être pleinement fonctionnels et commutables.
La navigation DOIT rester sur une seule page ; les vues détail s'ouvrent en modales
superposées aux résultats de recherche. Tous les éléments interactifs DOIVENT être
accessibles au clavier.

### III. Test Coverage (NON-NEGOTIABLE)

Toute fonction de logique métier DOIT avoir des tests unitaires. Les composants React DOIVENT
avoir au minimum des tests de rendu et d'interaction. Les tests DOIVENT passer avant qu'une
fonctionnalité soit considérée terminée. Aucun code ne part en production sans son fichier de
test correspondant.

### IV. Deployment Simplicity

L'application DOIT être déployable et fonctionnelle sur le free tier Vercel sans modification
ni add-on payant. Le pipeline d'import est LOCAL UNIQUEMENT et NE DOIT PAS être déployé ou
déclenché à distance. Toute configuration d'environnement DOIT utiliser `.env.local` en local
et les variables Vercel en production.

### V. Separation of Concerns

Le système d'import (script Python, exécution locale) et l'application web (Next.js, Vercel)
sont entièrement découplés. Le script d'import produit un état stable de base de données ;
l'application web le consomme en lecture seule. Ces deux systèmes ne partagent que la chaîne
de connexion à la base de données — aucun couplage à l'exécution.

## Technology Constraints

- **Framework** : Next.js 14+ (App Router), TypeScript 5+
- **Database** : PostgreSQL via Neon (Vercel Postgres free tier)
- **ORM** : Drizzle ORM
- **Import** : Python 3.11+ avec pandas + psycopg2 (local only, non déployé)
- **Styling** : Tailwind CSS + shadcn/ui + next-themes
- **Tests** : Vitest + React Testing Library
- **Déploiement** : Vercel free tier

## Development Workflow

1. L'import se lance localement via `python scripts/import_data.py`
2. L'application lit les données via Drizzle ORM dans des Next.js Route Handlers
3. Toute nouvelle fonctionnalité DOIT inclure des tests avant d'être considérée complète
4. Les branches de feature suivent la convention `[NNN]-[short-name]`

## Governance

Cette constitution régit toutes les décisions de développement. Elle prime sur toute autre
pratique. Les amendements doivent être documentés avec justification et la version incrémentée
selon le versionnage sémantique (MAJOR: rupture/suppression de principe, MINOR: ajout de
principe, PATCH: clarification/reformulation). Utiliser `.github/copilot-instructions.md`
comme référence de développement au quotidien.

**Version**: 1.0.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
