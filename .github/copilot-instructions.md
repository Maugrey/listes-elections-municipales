# Listes Élections Municipales 2026 — Development Guidelines

Auto-generated from feature plan `001-election-search-app`. Last updated: 2026-02-28

---

## Active Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14+ |
| Language | TypeScript | 5.4+ |
| Database | PostgreSQL via Neon serverless | 16 |
| ORM | Drizzle ORM | latest |
| Styling | Tailwind CSS + shadcn/ui + next-themes | latest |
| Testing | Vitest + React Testing Library | latest |
| Import (local) | Python + pandas + psycopg2 | 3.11+ |
| Deployment | Vercel free tier | — |

---

## Project Structure

```text
/
├── scripts/
│   └── import_data.py            # Import CSV → PostgreSQL (local only, not deployed)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (ThemeProvider, Marianne font, lang=fr)
│   │   ├── page.tsx              # Main page (SearchBar + ResultListView + ModalStack)
│   │   ├── globals.css           # Tailwind + Marianne CSS variables
│   │   └── api/
│   │       ├── search/route.ts           # GET /api/search?q=&page=&limit=
│   │       ├── city/[code]/route.ts      # GET /api/city/[code_circonscription]
│   │       └── list/[code]/[panel]/route.ts  # GET /api/list/[code]/[panel]
│   ├── components/
│   │   ├── SearchBar.tsx         # Search input + list/card toggle button
│   │   ├── ResultCard.tsx        # Single search result card
│   │   ├── ResultListView.tsx    # Results container (list/card toggle, skeleton, empty state)
│   │   ├── CityModal.tsx         # City detail modal
│   │   ├── ListModal.tsx         # List detail modal (all candidates)
│   │   ├── ModalStack.tsx        # URL-based modal stack manager
│   │   ├── ThemeToggle.tsx       # Dark/light mode toggle
│   │   ├── EmptyState.tsx        # "No results" state
│   │   └── ui/                   # shadcn/ui generated components
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (source of truth)
│   │   └── index.ts              # Neon serverless connection
│   ├── lib/
│   │   ├── search.ts             # Search query logic
│   │   ├── city.ts               # City detail query logic
│   │   ├── list.ts               # List detail query logic
│   │   └── utils.ts              # getLongestLabel, formatEmptyField, buildModalUrl
│   └── types/index.ts            # Shared TypeScript types
├── tests/
│   ├── components/               # React component tests
│   └── lib/                      # Business logic unit tests
├── specs/001-election-search-app/ # Spec-Kit artifacts (spec, plan, tasks, contracts…)
├── drizzle.config.ts
├── vitest.config.ts
├── tailwind.config.ts
└── .env.local.example
```

---

## Commands

```bash
# Development
npm run dev                    # Start dev server on http://localhost:3000

# Build & Deploy
npm run build                  # Production build
vercel deploy --prod           # Deploy to Vercel

# Database
npx drizzle-kit push           # Push schema to Neon
npx drizzle-kit studio         # Visual DB explorer (local)

# Import (local only)
python scripts/import_data.py  # Full CSV → PostgreSQL import (drop + reload)

# Tests
npm run test                   # Watch mode
npm run test:run               # Single pass (CI)

# Code quality
npm run lint                   # ESLint
```

---

## Code Style

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow types
- Prefer `type` over `interface` for data shapes
- All API responses must be typed against `src/types/index.ts`

### React / Next.js
- Server Components by default; add `"use client"` only when needed (event handlers, hooks)
- Route Handlers in `src/app/api/` — no `pages/api/`
- `useSearchParams()` for reading URL state (modal stack)
- `useRouter().push()` for writing URL state

### Database (Drizzle)
- All queries in `src/lib/` — never inline SQL in components or route handlers
- Use `sql\`unaccent(...)\`` for accent-insensitive search
- Never `SELECT *` — always specify columns

### Testing
- Test file location: `tests/` mirrors `src/` structure
- Component tests: use `@testing-library/user-event` for interactions, not `fireEvent`
- Mock DB in lib tests via `vi.mock('../db')`
- Test behavior, not implementation details

---

## Key Business Rules

- **Libellé le plus long** : `getLongestLabel(abrege, complet)` — retourne le plus long ; si identiques retourne l'un des deux
- **Tête de liste** : candidat avec `tete_de_liste = true` ; fallback sur `ordre = 1` si aucun
- **Champs vides** : `formatEmptyField(val)` — retourne `"—"` si `null` ou chaîne vide
- **URL modale** : `?q=<terme>&city=<code>&list=<code>&panel=<n>` — tous optionnels, combinables
- **Recherche minimum** : 3 caractères requis avant appel API (validé client ET serveur)

---

## Recent Changes

### Feature 001 — `001-election-search-app` (2026-02-28)
Added: Next.js 14 fullstack app with PostgreSQL/Neon, Drizzle ORM, shadcn/ui, Vitest,
Python import script. Three views: search, city detail, list detail. Modal stack navigation
via URL searchParams. Marianne font, dark/light mode.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
