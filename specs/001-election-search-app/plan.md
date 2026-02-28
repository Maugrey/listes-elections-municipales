# Implementation Plan: Portail de Recherche des Candidatures Municipales 2026

**Branch**: `001-election-search-app` | **Date**: 2026-02-28
**Spec**: [spec.md](./spec.md)

---

## Summary

Construire une application web en lecture seule permettant la recherche et la consultation
des listes de candidats aux élections municipales françaises 2026. Les données sont importées
depuis un fichier CSV source (~50 Mo, séparateur `;`) vers une base PostgreSQL Neon via un
script Python local. L'application Next.js 14 (App Router) interroge cette base via Drizzle
ORM et expose trois écrans (recherche, détail ville, détail liste) dans une navigation
modale single-page, déployée sur Vercel free tier.

---

## Technical Context

**Language/Version**: TypeScript 5.4+ (app) / Python 3.11+ (import)
**Framework**: Next.js 14 (App Router) — SSR + Route Handlers
**Primary Dependencies**:
- `drizzle-orm` + `@neondatabase/serverless` — accès DB serverless-compatible
- `drizzle-kit` — push schéma et migrations
- `tailwindcss` + `shadcn/ui` — composants UI accessibles
- `next-themes` — dark/light mode SSR sans flash
- `pandas` + `psycopg2-binary` — import Python local
- `vitest` + `@testing-library/react` — tests unitaires
**Storage**: PostgreSQL 16 via Neon (free tier — 512 Mo, 1 branche)
**Testing**: Vitest + React Testing Library + @testing-library/user-event
**Target Platform**: Vercel Edge Network (Node.js runtime pour Route Handlers)
**Performance Goals**: FCP < 3 s depuis Vercel, requête de recherche < 500 ms p95
**Constraints**: Vercel free tier (pas de fonction Edge longue durée, pas de cron),
  lecture seule en production, import local uniquement
**Scale/Scope**: ~500 000 lignes CSV, ~36 000 circonscriptions, ~1 utilisateur à la fois
  (usage citoyen occasionnel, pas de charge haute)

---

## Constitution Check

| Principe | Statut | Justification |
|----------|--------|---------------|
| I. Data Integrity | ✅ | Import drop-and-reload complet, app lecture seule |
| II. User Experience First | ✅ | Design gouv.fr, dark/light mode, navigation modale |
| III. Test Coverage | ✅ | Vitest + RTL, tests pour toute logique métier et composant |
| IV. Deployment Simplicity | ✅ | Vercel free tier, import local uniquement |
| V. Separation of Concerns | ✅ | Script Python ↔ App Next.js découplés, seule la DB_URL partagée |

---

## Project Structure

### Documentation (cette feature)

```text
specs/001-election-search-app/
├── spec.md              # Spécification fonctionnelle
├── plan.md              # Ce fichier
├── research.md          # Décisions techniques documentées
├── data-model.md        # Schéma DB détaillé
├── quickstart.md        # Guide setup local + import
├── contracts/
│   └── api.md           # Contrats des 3 routes API
├── checklists/
│   └── requirements.md  # Checklist qualité spec
└── tasks.md             # Liste de tâches d'implémentation
```

### Source Code (racine du repo)

```text
/
├── scripts/
│   └── import_data.py            # Script import CSV → PostgreSQL
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Layout racine (ThemeProvider, police Marianne)
│   │   ├── page.tsx              # Page principale (SearchBar + résultats)
│   │   ├── globals.css           # Variables CSS Tailwind + Marianne
│   │   └── api/
│   │       ├── search/
│   │       │   └── route.ts      # GET /api/search?q=&page=&limit=
│   │       ├── city/
│   │       │   └── [code]/
│   │       │       └── route.ts  # GET /api/city/[code_circonscription]
│   │       └── list/
│   │           └── [code]/
│   │               └── [panel]/
│   │                   └── route.ts # GET /api/list/[code]/[panel]
│   │
│   ├── components/
│   │   ├── SearchBar.tsx         # Champ de recherche + bouton bascule vue
│   │   ├── ResultCard.tsx        # Carte résultat individuelle (ville + liste + tête de liste)
│   │   ├── ResultListView.tsx    # Conteneur résultats (liste/carte + pagination)
│   │   ├── CityModal.tsx         # Modale détail ville
│   │   ├── ListModal.tsx         # Modale détail liste (tous les candidats)
│   │   ├── ModalStack.tsx        # Gestionnaire de pile de modales (URL searchParams)
│   │   ├── ThemeToggle.tsx       # Bouton bascule dark/light mode
│   │   ├── EmptyState.tsx        # État "aucun résultat"
│   │   └── ui/                   # Composants shadcn/ui générés
│   │
│   ├── db/
│   │   ├── schema.ts             # Schéma Drizzle (tables + indexes)
│   │   └── index.ts              # Connexion Neon serverless
│   │
│   ├── lib/
│   │   ├── search.ts             # Logique requête de recherche
│   │   ├── city.ts               # Logique requête détail ville
│   │   ├── list.ts               # Logique requête détail liste
│   │   └── utils.ts              # Helpers (libellé le plus long, fallback tête de liste…)
│   │
│   └── types/
│       └── index.ts              # Types TypeScript partagés
│
├── tests/
│   ├── components/
│   │   ├── SearchBar.test.tsx
│   │   ├── ResultCard.test.tsx
│   │   ├── CityModal.test.tsx
│   │   └── ListModal.test.tsx
│   └── lib/
│       ├── search.test.ts
│       ├── city.test.ts
│       ├── list.test.ts
│       └── utils.test.ts
│
├── drizzle.config.ts             # Config Drizzle Kit
├── tailwind.config.ts            # Config Tailwind
├── vitest.config.ts              # Config Vitest
├── next.config.ts                # Config Next.js
├── .env.local.example            # Template variables d'environnement
└── package.json
```

**Structure Decision**: Option "Web application" — un seul projet Next.js fullstack
(Route Handlers = backend, App Router = frontend). Pas de monorepo nécessaire à cette échelle.
Le script Python est dans `scripts/` au même niveau que `src/` pour la lisibilité, mais il
n'est pas inclus dans le build Vercel.

---

## Complexity Tracking

Aucune violation de constitution à justifier. Toutes les décisions s'inscrivent dans les
contraintes définies.
