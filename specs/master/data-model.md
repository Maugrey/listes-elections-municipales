# Data Model: Listes Élections Municipales 2026

**Branch**: `master` | **Date**: 2026-03-01

---

## Source CSV

**Fichier**: `data/municipales-2026-candidatures-france-entiere-tour-1-*.csv`  
**Séparateur**: `;` | **Encodage**: UTF-8 (avec BOM possible) | **Taille**: ~50 Mo

**Colonnes source** (dans l'ordre):

| # | Colonne CSV | Nullable | Notes |
|---|-------------|----------|-------|
| 1 | `Code département` | Non | `"01"`, `"2A"`, `"971"` … |
| 2 | `Département` | Non | Libellé complet |
| 3 | `Code circonscription` | Non | `"01001"` — identifiant ville unique |
| 4 | `Circonscription` | Non | Nom de la ville / commune |
| 5 | `Numéro de panneau` | Non | Entier (ex. `"1"`) |
| 6 | `Libellé abrégé de liste` | Oui | Peut être vide |
| 7 | `Libellé de la liste` | Non | Toujours présent |
| 8 | `Code nuance de liste` | Oui | Ex. `"DVG"` |
| 9 | `Nuance de liste` | Oui | Ex. `"Divers Gauche"` |
| 10 | `Tête de liste` | Oui | `"OUI"` ou vide |
| 11 | `Ordre` | Non | Rang du candidat dans la liste |
| 12 | `Sexe` | Non | `"M"` ou `"F"` |
| 13 | `Nom sur le bulletin de vote` | Non | Nom en majuscules |
| 14 | `Prénom sur le bulletin de vote` | Non | Prénom |
| 15 | `Nationalité` | Oui | Ex. `"Française"` |
| 16 | `Code personnalité` | Oui | Code court |
| 17 | `CC` | Oui | Champ court, signification non documentée |

---

## Schéma PostgreSQL (Drizzle)

### Table `circonscriptions`

```sql
CREATE TABLE circonscriptions (
  code_circonscription VARCHAR(10)  PRIMARY KEY,
  circonscription      TEXT         NOT NULL,
  code_departement     VARCHAR(5)   NOT NULL,
  departement          TEXT         NOT NULL
);

CREATE INDEX idx_circo_search
  ON circonscriptions USING gin (
    to_tsvector('simple', unaccent(circonscription || ' ' || departement))
  );
```

| Colonne | Type | Source CSV |
|---------|------|-----------|
| `code_circonscription` | `VARCHAR(10)` PK | `Code circonscription` |
| `circonscription` | `TEXT` | `Circonscription` |
| `code_departement` | `VARCHAR(5)` | `Code département` |
| `departement` | `TEXT` | `Département` |

---

### Table `listes`

```sql
CREATE TABLE listes (
  code_circonscription VARCHAR(10)  NOT NULL REFERENCES circonscriptions,
  numero_panneau       INTEGER      NOT NULL,
  libelle_abrege       TEXT,
  libelle_liste        TEXT         NOT NULL,
  code_nuance          VARCHAR(20),
  nuance               TEXT,

  PRIMARY KEY (code_circonscription, numero_panneau)
);

CREATE INDEX idx_listes_search
  ON listes USING gin (
    to_tsvector('simple', unaccent(
      libelle_liste || ' ' || COALESCE(libelle_abrege, '') || ' ' || COALESCE(nuance, '')
    ))
  );
```

| Colonne | Type | Source CSV |
|---------|------|-----------|
| `code_circonscription` | `VARCHAR(10)` FK | `Code circonscription` |
| `numero_panneau` | `INTEGER` | `Numéro de panneau` |
| `libelle_abrege` | `TEXT` nullable | `Libellé abrégé de liste` |
| `libelle_liste` | `TEXT` | `Libellé de la liste` |
| `code_nuance` | `VARCHAR(20)` nullable | `Code nuance de liste` |
| `nuance` | `TEXT` nullable | `Nuance de liste` |

---

### Table `candidats`

```sql
CREATE TABLE candidats (
  code_circonscription VARCHAR(10)  NOT NULL,
  numero_panneau       INTEGER      NOT NULL,
  ordre                INTEGER      NOT NULL,
  sexe                 VARCHAR(1)   NOT NULL,  -- 'M' ou 'F'
  nom                  TEXT         NOT NULL,
  prenom               TEXT         NOT NULL,
  nationalite          TEXT,
  code_personnalite    VARCHAR(20),
  cc                   VARCHAR(20),
  tete_de_liste        BOOLEAN      NOT NULL DEFAULT FALSE,

  PRIMARY KEY (code_circonscription, numero_panneau, ordre),
  FOREIGN KEY (code_circonscription, numero_panneau)
    REFERENCES listes(code_circonscription, numero_panneau)
);

CREATE INDEX idx_candidats_search
  ON candidats USING gin (
    to_tsvector('simple', unaccent(nom || ' ' || prenom))
  );

CREATE INDEX idx_candidats_tete
  ON candidats (code_circonscription, numero_panneau)
  WHERE tete_de_liste = TRUE;
```

| Colonne | Type | Source CSV |
|---------|------|-----------|
| `code_circonscription` | `VARCHAR(10)` FK | `Code circonscription` |
| `numero_panneau` | `INTEGER` FK | `Numéro de panneau` |
| `ordre` | `INTEGER` | `Ordre` |
| `sexe` | `VARCHAR(1)` | `Sexe` |
| `nom` | `TEXT` | `Nom sur le bulletin de vote` |
| `prenom` | `TEXT` | `Prénom sur le bulletin de vote` |
| `nationalite` | `TEXT` nullable | `Nationalité` |
| `code_personnalite` | `VARCHAR(20)` nullable | `Code personnalité` |
| `cc` | `VARCHAR(20)` nullable | `CC` |
| `tete_de_liste` | `BOOLEAN` | `Tête de liste = "OUI"` → TRUE |

---

## Extensions PostgreSQL requises

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Ces extensions doivent être activées avant la création des index et avant toute requête
utilisant `unaccent()`. Sur Neon, elles sont disponibles sans permission admin.

---

## Règles de transformation (import)

1. `Tête de liste = "OUI"` → `tete_de_liste = TRUE` ; vide ou autre → `FALSE`
2. Si aucun candidat d'une liste n'a `tete_de_liste = TRUE` après import, le script met
   `tete_de_liste = TRUE` pour `ordre = 1` (fallback)
3. `Numéro de panneau` converti de `VARCHAR` → `INTEGER` (suppression guillemets CSV)
4. `Ordre` converti de `VARCHAR` → `INTEGER`
5. Chaînes vides `""` → `NULL` pour les colonnes nullable
6. `Libellé abrégé` vide → `NULL` (la logique `getLongestLabel` est dans l'application)
7. Les doublons de lignes métier impossibles (même PK) doivent lever une erreur explicite

---

## Ordre d'import

```
1. DROP TABLES IF EXISTS candidats, listes, circonscriptions CASCADE
2. CREATE EXTENSIONS (unaccent, pg_trgm)
3. CREATE TABLE circonscriptions
4. CREATE TABLE listes
5. CREATE TABLE candidats
6. CREATE INDEXES
7. INSERT INTO circonscriptions (DISTINCT sur code_circonscription)
8. INSERT INTO listes (DISTINCT sur (code_circonscription, numero_panneau))
9. INSERT INTO candidats (toutes les lignes)
10. Fallback tête de liste (UPDATE ordre = 1 où aucun tete_de_liste)
11. Validation: comptage par table
```

---

## Règles métier application

| Règle | Implémentation |
|-------|---------------|
| Libellé le plus long | `getLongestLabel(abrege, complet)` dans `src/lib/utils.ts` |
| Tête de liste | `tete_de_liste = TRUE` ; fallback sur `ordre = 1` si aucun |
| Champs vides | `formatEmptyField(val)` → `"—"` si `null` ou chaîne vide |
| Recherche multi-mots | AND inter-mots, OR intra-champ par mot (`src/lib/search.ts`) |
