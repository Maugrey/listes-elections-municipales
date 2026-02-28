# Élections Municipales 2026 — Portail de Recherche des Candidatures

Application Next.js 14 pour rechercher les listes et candidats des élections municipales françaises 2026 (Tour 1).

Source des données : https://www.data.gouv.fr/datasets/elections-municipales-2026-listes-candidates-au-premier-tour

---

## Démarrage rapide

Pour le guide complet, voir [`specs/001-election-search-app/quickstart.md`](specs/001-election-search-app/quickstart.md).

### Prérequis

- Node.js 18+, Python 3.11+
- Compte [Neon](https://neon.tech) (PostgreSQL serverless gratuit)

### Installation

```bash
npm install
cp .env.local.example .env.local   # puis renseigner DATABASE_URL
```

### Import des données

```bash
pip install pandas psycopg2-binary python-dotenv
npx drizzle-kit push                # créer les tables en base
python scripts/import_data.py       # importer le CSV
```

### Développement

```bash
npm run dev        # http://localhost:3000
npm run test:run   # tests unitaires
npm run lint       # ESLint
```

### Déploiement

```bash
vercel deploy --prod   # + ajouter DATABASE_URL dans Vercel env vars
```

---

## Architecture

| Layer | Technologie |
|-------|-------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript 5.4+ |
| Base de données | PostgreSQL via Neon serverless |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS + shadcn/ui + next-themes |
| Tests | Vitest + React Testing Library |
| Import (local) | Python + pandas + psycopg2 |
| Déploiement | Vercel free tier |

## Fonctionnalités

- Recherche plein-texte insensible aux accents sur communes, listes et candidats
- Vue liste / cartes bascule
- Modales Détail Ville et Détail Liste avec navigation URL
- Dark / Light mode (next-themes, sans flash SSR)
- Design institutionnel — police Marianne, palette gouvernementale
