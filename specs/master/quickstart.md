# Quickstart: Listes Élections Municipales 2026

**Branch**: `master` | **Date**: 2026-03-01

---

## Prérequis

- Node.js 20+
- Python 3.11+
- `pip` (ou `uv` pour une installation plus rapide)
- Un compte [Neon](https://neon.tech) (free tier)
- Un compte [Vercel](https://vercel.com) (free tier)
- Git

---

## 1. Cloner et installer les dépendances

```bash
git clone https://github.com/Maugrey/listes-elections-municipales.git
cd listes-elections-municipales

# Dépendances Node.js
npm install

# Dépendances Python (pour le script d'import local)
pip install pandas psycopg2-binary python-dotenv
# ou avec uv :
uv pip install pandas psycopg2-binary python-dotenv
```

---

## 2. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Éditer `.env.local` :

```env
# Chaîne de connexion Neon (récupérée dans le dashboard Neon → Connection string)
DATABASE_URL=postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ Ne jamais committer `.env.local`. Il est ignoré par `.gitignore`.

---

## 3. Activer les extensions PostgreSQL

Sur Neon, se connecter via la console SQL et exécuter :

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

> Ces extensions sont nécessaires pour la recherche insensible aux diacritiques et les
> index GIN. Sur Neon, elles sont disponibles sans permission admin.
> Le fichier `scripts/init_extensions.sql` contient ces commandes.

---

## 4. Créer le schéma en base de données

```bash
# Pousse le schéma Drizzle vers Neon (crée les tables et les index)
npx drizzle-kit push
```

Vérifier dans le dashboard Neon que les tables `circonscriptions`, `listes` et `candidats`
ont été créées.

---

## 5. Importer les données

```bash
# Télécharger le CSV source depuis data.gouv.fr si non présent :
# https://www.data.gouv.fr/datasets/elections-municipales-2026-listes-candidates-au-premier-tour

python scripts/import_data.py
```

Le script affiche une progression et un compte-rendu en fin d'exécution :

```
Connexion à la base de données... OK
Suppression des tables existantes... OK
Création du schéma... OK
Import CSV: 500 342 lignes lues
  → circonscriptions: 36 521 insérées
  → listes:           89 234 insérées
  → candidats:       500 342 insérées
Fallback têtes de liste appliqué: 12 listes corrigées
Import terminé en 42.3s
```

> Le script est **ré-exécutable sans risque** : il supprime et recrée toutes les tables
> à chaque exécution (drop-and-reload complet).

---

## 6. Lancer l'application en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## 7. Lancer les tests

```bash
npm run test          # tests unitaires (watch mode)
npm run test:run      # tests unitaires (une seule passe — CI)
```

---

## 8. Déployer sur Vercel

### Premier déploiement

```bash
# Installer la CLI Vercel si nécessaire
npm i -g vercel

vercel deploy
```

Lors de la configuration initiale, ajouter la variable d'environnement `DATABASE_URL` dans
le dashboard Vercel → Settings → Environment Variables.

### Déploiements suivants

```bash
vercel deploy --prod
```

Ou activer le déploiement automatique depuis GitHub dans le dashboard Vercel.

---

## Commandes de référence

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production |
| `npm run test:run` | Tests unitaires (CI) |
| `npm run lint` | Linting TypeScript (ESLint) |
| `npx drizzle-kit push` | Synchroniser le schéma Drizzle vers Neon |
| `npx drizzle-kit studio` | Explorateur DB visuel (local) |
| `python scripts/import_data.py` | Import complet CSV → PostgreSQL (local) |
| `vercel deploy --prod` | Déploiement en production sur Vercel |

---

## Fichiers importants

```
src/db/schema.ts           # Schéma Drizzle (source de vérité du modèle de données)
src/db/index.ts            # Connexion Neon serverless
src/lib/search.ts          # Logique de recherche multi-mots
scripts/import_data.py     # Script d'import CSV → PostgreSQL (local uniquement)
scripts/init_extensions.sql # Extensions PostgreSQL requises
.env.local                 # Variables d'environnement locales (non commité)
.env.local.example         # Template à copier
drizzle.config.ts          # Configuration drizzle-kit
```
