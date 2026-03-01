# Quickstart: Portail de Recherche des Candidatures Municipales 2026

**Branch**: `001-election-search-app` | **Date**: 2026-02-28

---

## Prérequis

- Node.js 20+
- Python 3.11+
- `uv` (gestionnaire de paquets Python) — ou `pip`
- Un compte [Neon](https://neon.tech) (free tier)
- Un compte [Vercel](https://vercel.com) (free tier)
- Git

---

## 1. Cloner et installer les dépendances

```bash
git clone https://github.com/Maugrey/listes-elections-municipales.git
cd listes-elections-municipales
git checkout 001-election-search-app

# Dépendances Node.js
npm install

# Dépendances Python (pour le script d'import)
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

## 3. Créer le schéma en base de données

```bash
# Pousse le schéma Drizzle vers Neon (crée les tables et les index)
npx drizzle-kit push
```

Vérifier dans le dashboard Neon que les tables `circonscriptions`, `listes` et `candidats`
ont été créées.

---

## 4. Importer les données

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

> Le script est **ré-exécutable sans risque** : il supprime et recrée toutes les tables à
> chaque exécution.

---

## 5. Lancer l'application en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## 6. Lancer les tests

```bash
npm run test          # tests unitaires (watch mode)
npm run test:run      # tests unitaires (une seule passe, CI)
```

---

## 7. Déployer sur Vercel

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

## Structure des fichiers importants

```
scripts/import_data.py     # Script d'import CSV → PostgreSQL (local uniquement)
src/db/schema.ts           # Schéma Drizzle (source de vérité du modèle de données)
src/db/index.ts            # Connexion Neon serverless
.env.local                 # Variables d'environnement locales (non commité)
.env.local.example         # Template à copier
drizzle.config.ts          # Configuration drizzle-kit
```

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run test:run` | Tests unitaires (CI) |
| `npm run lint` | Linting TypeScript |
| `npx drizzle-kit push` | Synchroniser le schéma vers Neon |
| `npx drizzle-kit studio` | Explorateur DB visuel (local) |
| `python scripts/import_data.py` | Import complet CSV → PostgreSQL |
