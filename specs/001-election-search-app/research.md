# Research: Portail de Recherche des Candidatures Municipales 2026

**Branch**: `001-election-search-app` | **Date**: 2026-02-28

---

## 1. Base de données — Choix du provider PostgreSQL

**Decision**: Neon (PostgreSQL serverless managé)
**Rationale**: Neon est le provider natif de Vercel Postgres. Le free tier offre 512 Mo de
stockage et 0,5 GB de données transférées/mois, suffisant pour ~500 000 lignes de données
statiques consultées en lecture seule. La librairie `@neondatabase/serverless` est optimisée
pour les environnements serverless (connexions HTTP sur WebSockets, pas de pool TCP persistant
qui expirerait dans une fonction Vercel). Drizzle ORM supporte nativement Neon.
**Alternatives considered**:
- PlanetScale (MySQL) — rejeté : syntaxe SQL différente, pas de `unaccent` PostgreSQL
- Supabase — rejeté : free tier plus restrictif en connexions simultanées
- SQLite (Turso) — rejeté : `unaccent` non disponible nativement, moins adapté à Vercel

---

## 2. Recherche full-text — Stratégie de requête

**Decision**: PostgreSQL `ILIKE` combiné à `unaccent()` + index `GIN` sur `pg_trgm`
**Rationale**: Les données sont ~500 000 lignes statiques. `pg_trgm` avec `GIN` permet des
recherches `ILIKE` performantes sur les colonnes texte sans service externe. `unaccent()`
normalise les diacritiques françaises (é→e, è→e, î→i…) côté DB. Cette approche est
100% PostgreSQL, sans dépendance externe, et tient dans le free tier Neon.
La requête cherche sur : circonscription, département, libellés de liste, nuance, nom, prénom.
**Alternatives considered**:
- Algolia / Meilisearch — rejetés : payants au-delà du free tier limité, couplage externe
- PostgreSQL `tsvector` full-text — rejeté : moins adapté à la recherche partielle par préfixe
  sur des noms propres
- Elasticsearch — rejeté : infrastructurellement trop lourd pour ce besoin

---

## 3. ORM — Drizzle vs Prisma

**Decision**: Drizzle ORM
**Rationale**: Drizzle est "serverless-first" et génère des requêtes SQL explicites sans
abstraction opaque. Très léger (pas de client binary), excellent support TypeScript, natif
Neon. `drizzle-kit push` pousse le schéma sans fichiers de migration à gérer pour un projet
sans historique de migrations critiques.
**Alternatives considered**:
- Prisma — rejeté : client binaire lourd incompatible avec Vercel Edge runtime, Cold start
  plus lent, Prisma Data Proxy payant pour serverless optimal

---

## 4. Import — Python vs TypeScript

**Decision**: Python 3.11 avec `pandas` + `psycopg2-binary`
**Rationale**: Le CSV source fait ~50 Mo. `pandas.read_csv()` gère nativement les encodages
(UTF-8/Latin-1 auto-détectés), les séparateurs `;`, les valeurs manquantes, et permet un
nettoyage déclaratif des colonnes. `psycopg2` offre `execute_values()` pour des insertions
batch performantes (10 000 lignes/batch). Cette combinaison est standard pour l'ETL de
données ouvertes françaises.
**Alternatives considered**:
- Script Node.js/TypeScript — rejeté : moins expressif pour l'ETL, pas de bibliothèque
  équivalente à pandas pour les CSV volumineux
- `COPY FROM` PostgreSQL direct — rejeté : moins flexible pour le nettoyage des données et
  la gestion des types

---

## 5. UI — shadcn/ui vs bibliothèques alternatives

**Decision**: Tailwind CSS + shadcn/ui
**Rationale**: shadcn/ui génère des composants dans le projet (pas de dépendance npm de
composants) basés sur Radix UI (accessibilité ARIA native) et stylés avec Tailwind. Le dark
mode est géré nativement. Les composants Dialog, Card, Badge, Input de shadcn correspondent
exactement aux besoins (modales, cartes résultats, badges nuance, barre de recherche).
**Alternatives considered**:
- MUI / Ant Design — rejetés : trop lourds, moins personnalisables pour l'esthétique gouv.fr
- Chakra UI — rejeté : bundle plus large, moins adapté au SSR Next.js 14

---

## 6. Navigation modale — URL searchParams

**Decision**: Gestion de la pile de modales via Next.js `useSearchParams` /
`useRouter().push()`
**Rationale**: Les paramètres d'URL `?city=01001&list=01001-2` rendent les vues partageables
et permettent au bouton Précédent du navigateur de fonctionner naturellement. Le composant
`ModalStack` écoute les `searchParams` pour déterminer quelles modales ouvrir et dans quel
ordre. Pas besoin de state global (Zustand/Redux) — l'URL est la source de vérité.
**Alternatives considered**:
- State React local + Context — rejeté : liens non partageables, bouton Précédent non fonctionnel
- React Router modales — rejeté : non applicable dans Next.js App Router

---

## 7. Police — Marianne

**Decision**: Police Marianne via `next/font/local`
**Rationale**: La police Marianne est la typographie officielle de l'État français, libre
d'utilisation, disponible sur le dépôt officiel `etalab/marianne-font`. Son intégration via
`next/font/local` garantit le chargement optimisé (font subsetting, swap CSS automatique) sans
dépendance à un CDN externe (RGPD-compatible).
**Alternatives considered**:
- Google Fonts (Inter) — rejeté : moins adapté à l'esthétique institutionnelle, CDN externe
- Système fonts — rejeté : rendu incohérent selon le système d'exploitation

---

## 8. Tests — Vitest vs Jest

**Decision**: Vitest + React Testing Library
**Rationale**: Vitest est natif ESM, s'intègre sans configuration avec le projet Vite/Next.js,
démarre 10× plus vite que Jest grâce au cache Vite. RTL encourage les tests centrés sur le
comportement utilisateur plutôt que les détails d'implémentation. `@testing-library/user-event`
simule les interactions réelles (frappe, clic, navigation clavier).
**Alternatives considered**:
- Jest — rejeté : configuration plus complexe avec Next.js 14 App Router, pas de support ESM
  natif
- Playwright/Cypress — non retenu pour les tests unitaires (gardé pour les tests E2E futurs
  si besoin)
