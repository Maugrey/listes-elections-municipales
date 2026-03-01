# Implementation Plan: Listes Élections Municipales 2026 — Baseline Stack

**Branch**: `master` | **Date**: 2026-03-01 | **Spec**: N/A — baseline de la stack  
**Input**: État courant de l'application, aucune nouvelle fonctionnalité spécifique.

## Summary

Application web Next.js 14 (App Router) de consultation des candidatures aux élections
municipales françaises 2026. Recherche plein-texte multi-mots sur ~500 000 candidats via
PostgreSQL (Neon serverless) avec Drizzle ORM, interface shadcn/ui, navigation modale
par URL searchParams. Le script d'import Python est local uniquement et entièrement
découplé de l'application web.

## Technical Context

**Language/Version**: TypeScript 5.4+ (application web) ; Python 3.11+ (script d'import local)  
**Primary Dependencies**: Next.js 14 (App Router), Drizzle ORM, @neondatabase/serverless,
  Tailwind CSS, shadcn/ui, next-themes, Vitest, React Testing Library  
**Storage**: PostgreSQL 16 via Neon serverless (free tier) — 3 tables : `circonscriptions`,
  `listes`, `candidats`  
**Testing**: Vitest + React Testing Library + @testing-library/user-event  
**Target Platform**: Vercel free tier (fonctions serverless, Edge-compatible)  
**Project Type**: Web application fullstack (SSR + API Route Handlers Next.js)  
**Performance Goals**: FCP < 3s sur connexion standard ; réponse API search < 500ms p95  
**Constraints**: Vercel free tier (aucun add-on payant) ; lecture seule (aucune donnée
  utilisateur persistée) ; import local uniquement (non déployé)  
**Scale/Scope**: ~500 000 candidats, ~36 000 circonscriptions, consultation en lecture seule

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Principe | Status | Justification |
|------|----------|--------|---------------|
| G1 | I. Data Integrity — import drop-and-reload, lecture seule | ✅ PASS | Script Python fait un drop complet ; aucune écriture depuis l'app web |
| G2 | II. UX First — esthétique gouv.fr, dark/light mode, SPA modale | ✅ PASS | Police Marianne, palette officielle, next-themes, ModalStack URL-based |
| G3 | III. Test Coverage — tests unitaires obligatoires | ✅ PASS | Vitest couvre toutes les fonctions `lib/` et composants React |
| G4 | IV. Deployment Simplicity — Vercel free tier sans add-on | ✅ PASS | Neon free tier + Vercel free tier, aucun service externe payant |
| G5 | V. Separation of Concerns — import/web découplés | ✅ PASS | Script Python local uniquement, seul `DATABASE_URL` est partagé |

**Violations**: aucune — Constitution entièrement respectée.

## Project Structure

### Documentation (baseline)

```text
specs/master/
├── plan.md         # Ce fichier
├── research.md     # Phase 0 — décisions techniques consolidées
├── data-model.md   # Phase 1 — schéma PostgreSQL (Drizzle)
├── quickstart.md   # Phase 1 — guide de démarrage
└── contracts/
    └── api.md      # Phase 1 — contrats des 3 endpoints REST
```

### Source Code (repository root)

```text
scripts/
└── import_data.py            # Import CSV → PostgreSQL (local only, non déployé)

src/
├── app/
│   ├── layout.tsx            # Root layout (ThemeProvider, Marianne font, lang=fr)
│   ├── page.tsx              # Page principale (SearchBar + ResultListView + ModalStack)
│   ├── globals.css           # Tailwind + variables CSS Marianne
│   └── api/
│       ├── search/route.ts              # GET /api/search?q=&page=&limit=
│       ├── city/[code]/route.ts         # GET /api/city/[code_circonscription]
│       └── list/[code]/[panel]/route.ts # GET /api/list/[code]/[panel]
├── components/
│   ├── SearchBar.tsx          # Champ de recherche + toggle liste/cartes
│   ├── ResultCard.tsx         # Carte de résultat unitaire
│   ├── ResultListView.tsx     # Conteneur résultats (toggle, skeleton, empty state)
│   ├── CityModal.tsx          # Modale détail ville
│   ├── ListModal.tsx          # Modale détail liste (tous les candidats)
│   ├── ModalStack.tsx         # Gestionnaire pile modale via URL searchParams
│   ├── ThemeToggle.tsx        # Bascule dark/light mode
│   ├── EmptyState.tsx         # État "aucun résultat"
│   └── ui/                   # Composants shadcn/ui générés
├── db/
│   ├── schema.ts              # Schéma Drizzle (source de vérité)
│   └── index.ts               # Connexion Neon serverless
├── lib/
│   ├── search.ts              # Requête recherche multi-mots (AND inter-mots)
│   ├── city.ts                # Requête détail ville
│   ├── list.ts                # Requête détail liste
│   └── utils.ts               # getLongestLabel, formatEmptyField, buildModalUrl
└── types/
    └── index.ts               # Types TypeScript partagés

tests/
├── setup.ts
├── components/
│   ├── CityModal.test.tsx
│   ├── ListModal.test.tsx
│   ├── ResultCard.test.tsx
│   └── SearchBar.test.tsx
└── lib/
    ├── city.test.ts
    ├── import.test.ts
    ├── list.test.ts
    ├── search.test.ts
    └── utils.test.ts
```

**Structure Decision**: Monorepo Next.js 14 fullstack unique. `src/` contient l'application
web (composants, API, DB, lib, types). `scripts/` contient le pipeline d'import local.
`tests/` miroir de `src/` pour les tests unitaires.
