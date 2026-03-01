# Research: Listes Élections Municipales 2026 — Baseline Stack

**Branch**: `master` | **Date**: 2026-03-01

Ce document consolide les décisions techniques établies lors de la feature `001-election-search-app`.
Aucune clarification requise — toutes les décisions sont résolues.

---

## 1. Base de données — Neon (PostgreSQL serverless)

**Decision**: Neon via `@neondatabase/serverless`  
**Rationale**: Provider natif Vercel Postgres. Le free tier offre 512 Mo de stockage
suffisant pour ~500 000 lignes de données statiques. La librairie `@neondatabase/serverless`
utilise des connexions HTTP/WebSockets optimisées pour les fonctions serverless (pas de pool
TCP persistant qui expirerait).  
**Alternatives considered**: PlanetScale (MySQL, pas d'`unaccent`), Supabase (connexions
simultanées plus limitées), Turso/SQLite (`unaccent` non natif).

---

## 2. Recherche plein-texte — ILIKE + unaccent + pg_trgm + multi-mots AND

**Decision**: `ILIKE` + `unaccent()` + index `GIN` sur `pg_trgm`. Chaque mot de la requête
génère une condition indépendante (OR sur les champs), toutes les conditions étant combinées
en AND (tous les mots doivent être trouvés, chacun pouvant être dans un champ différent).  
**Rationale**: ~500 000 lignes statiques, pas de service externe requis, entièrement dans
le free tier Neon. `unaccent` normalise les diacritiques françaises (é→e, è→e…). La
stratégie multi-mots AND permet des recherches croisées champs (ex. "Martin Rennes" trouve
les candidats Martin dans les listes de Rennes).  
**Alternatives considered**: Algolia/Meilisearch (payants au-delà du free tier limité),
PostgreSQL `tsvector` (moins adapté à la recherche partielle sur noms propres),
Elasticsearch (trop lourd pour ce besoin).

---

## 3. ORM — Drizzle ORM

**Decision**: Drizzle ORM + `drizzle-kit push`  
**Rationale**: Serverless-first, léger (pas de client binaire), excellent support TypeScript,
support natif Neon. Requêtes SQL explicites sans abstraction opaque. `drizzle-kit push` pousse
le schéma directement sans fichiers de migration pour un projet sans historique critique.  
**Alternatives considered**: Prisma (client binaire lourd, cold start pénalisant, Prisma
Data Proxy payant pour l'optimisation serverless).

---

## 4. Import — Python 3.11 + pandas + psycopg2

**Decision**: Script Python local avec `pandas` + `psycopg2-binary`  
**Rationale**: CSV ~50 Mo. `pandas.read_csv()` gère nativement les encodages (UTF-8/Latin-1),
séparateurs `;`, valeurs manquantes, nettoyage déclaratif des colonnes. `psycopg2`
`execute_values()` offre des insertions batch performantes (10 000 lignes/batch). Script
non déployé, entièrement découplé de l'app web.  
**Alternatives considered**: Script Node.js/TypeScript (moins expressif pour l'ETL),
`COPY FROM` PostgreSQL direct (moins flexible pour le nettoyage des données).

---

## 5. UI — Tailwind CSS + shadcn/ui

**Decision**: Tailwind CSS + shadcn/ui (basé sur Radix UI)  
**Rationale**: Composants générés dans le projet (pas de dépendance npm de composants),
accessibilité ARIA native via Radix UI, dark mode géré nativement via next-themes.
Les composants Dialog, Card, Badge, Input correspondent exactement aux besoins.
Très personnalisable pour l'esthétique institutionnelle française.  
**Alternatives considered**: MUI/Ant Design (trop lourds, moins personnalisables pour
l'esthétique gouv.fr), Chakra UI (bundle plus large, moins adapté SSR Next.js 14).

---

## 6. Navigation modale — URL searchParams

**Decision**: `useSearchParams` + `useRouter().push()` pour la pile de modales  
**Rationale**: URLs partageables, bouton Précédent du navigateur fonctionnel. Le composant
`ModalStack` écoute les `searchParams` (`?city=`, `?list=`, `?panel=`) pour déterminer
quelles modales ouvrir. Pas de state global (Zustand/Redux) — l'URL est la source de vérité.  
**Alternatives considered**: React state local + Context (liens non partageables, bouton
Précédent non fonctionnel), React Router (non applicable dans Next.js App Router).

---

## 7. Typographie — Police Marianne

**Decision**: `next/font/local` avec la police Marianne (source : `etalab/marianne-font`)  
**Rationale**: Typographie officielle de l'État français, libre d'utilisation. Intégration
via `next/font/local` : font subsetting, swap CSS automatique, pas de CDN externe
(RGPD-compatible).  
**Alternatives considered**: Google Fonts/Inter (esthétique moins institutionnelle, CDN
externe RGPD-problématique), polices système (rendu incohérent selon l'OS).

---

## 8. Tests — Vitest + React Testing Library

**Decision**: Vitest + RTL + `@testing-library/user-event`  
**Rationale**: Natif ESM, démarre 10× plus vite que Jest grâce au cache Vite,
s'intègre sans configuration avec Next.js 14. RTL encourage les tests centrés sur le
comportement utilisateur. `user-event` simule les interactions réelles (frappe, clic,
navigation clavier).  
**Alternatives considered**: Jest (configuration complexe avec Next.js 14 App Router,
pas de support ESM natif), Playwright/Cypress (gardés pour les tests E2E si besoin futur).
