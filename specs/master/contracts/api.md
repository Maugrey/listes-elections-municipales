# API Contracts: Listes Élections Municipales 2026

**Branch**: `master` | **Date**: 2026-03-01

Toutes les routes sont des Next.js Route Handlers (`GET` uniquement, lecture seule).
Les erreurs sont retournées avec le code HTTP approprié et un body `{ error: string }`.

---

## Types partagés

```typescript
// src/types/index.ts

export type Candidat = {
  ordre: number;
  sexe: "M" | "F";
  nom: string;
  prenom: string;
  nationalite: string | null;
  code_personnalite: string | null;
  cc: string | null;
  tete_de_liste: boolean;
};

export type TeteDeListe = {
  sexe: "M" | "F";
  nom: string;
  prenom: string;
  nationalite: string | null;
};

export type ListeResume = {
  code_circonscription: string;
  numero_panneau: number;
  libelle_abrege: string | null;
  libelle_liste: string;
  code_nuance: string | null;
  nuance: string | null;
  tete_de_liste: TeteDeListe;
};

export type ListeDetail = ListeResume & {
  candidats: Candidat[];
};

export type Circonscription = {
  code_circonscription: string;
  circonscription: string;
  code_departement: string;
  departement: string;
};

export type SearchResultItem = {
  liste: ListeResume;
  circo: Circonscription;
  matched_candidate: {        // null si la correspondance est sur la ville/liste
    nom: string;
    prenom: string;
    ordre: number;
  } | null;
};

export type SearchResponse = {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
};

export type CityResponse = {
  circo: Circonscription;
  listes: ListeResume[];
};

export type ListResponse = {
  circo: Circonscription;
  liste: ListeDetail;
};
```

---

## Route 1 — Recherche

```
GET /api/search
```

### Query Parameters

| Param | Type | Obligatoire | Défaut | Description |
|-------|------|-------------|--------|-------------|
| `q` | `string` | Oui | — | Terme de recherche (min 3 caractères) |
| `page` | `number` | Non | `1` | Numéro de page (1-based) |
| `limit` | `number` | Non | `20` | Items par page (max 50) |

### Comportement

1. Si `q` fait moins de 3 caractères → `400 Bad Request`
2. Découpage de `q` en mots individuels (split sur espaces)
3. Pour chaque mot : `unaccent(champ) ILIKE unaccent('%mot%')` sur `circonscription`,
   `departement`, `libelle_liste`, `libelle_abrege`, `nuance`, `nom || ' ' || prenom`
4. Tous les mots doivent être trouvés (AND inter-mots), chacun dans n'importe quel champ
5. Résultats au niveau **liste** : un item par couple `(code_circonscription, numero_panneau)`
6. `matched_candidate` : premier candidat non-tête-de-liste dont le nom contient au moins
   un des mots recherchés (`null` si la correspondance est uniquement sur ville/liste)
7. Tri : `code_departement` ASC, `circonscription` ASC, `numero_panneau` ASC

### Response `200 OK`

```json
{
  "results": [
    {
      "liste": {
        "code_circonscription": "35238",
        "numero_panneau": 3,
        "libelle_abrege": "RENNES POUR TOUS",
        "libelle_liste": "RENNES POUR TOUS - LISTE CITOYENNE",
        "code_nuance": "DVG",
        "nuance": "Divers Gauche",
        "tete_de_liste": {
          "sexe": "F",
          "nom": "MARTIN",
          "prenom": "Claire",
          "nationalite": "Française"
        }
      },
      "circo": {
        "code_circonscription": "35238",
        "circonscription": "Rennes",
        "code_departement": "35",
        "departement": "Ille-et-Vilaine"
      },
      "matched_candidate": null
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "has_more": true
}
```

### Erreurs

| Code | Condition |
|------|-----------|
| `400` | `q` absent ou < 3 caractères |
| `500` | Erreur base de données |

---

## Route 2 — Détail ville

```
GET /api/city/[code]
```

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `code` | `string` | `code_circonscription` (ex. `"35238"`) |

### Comportement

1. Récupère la circonscription par son code → `404` si introuvable
2. Récupère toutes les listes de cette circonscription avec leur tête de liste
3. Tri : `numero_panneau` ASC

### Response `200 OK`

```json
{
  "circo": {
    "code_circonscription": "35238",
    "circonscription": "Rennes",
    "code_departement": "35",
    "departement": "Ille-et-Vilaine"
  },
  "listes": [
    {
      "code_circonscription": "35238",
      "numero_panneau": 1,
      "libelle_abrege": "RENNES EN COMMUN",
      "libelle_liste": "RENNES EN COMMUN POUR UNE VILLE SOLIDAIRE",
      "code_nuance": "GE",
      "nuance": "Divers Écologiste",
      "tete_de_liste": {
        "sexe": "M",
        "nom": "DUPONT",
        "prenom": "Jean",
        "nationalite": "Française"
      }
    }
  ]
}
```

### Erreurs

| Code | Condition |
|------|-----------|
| `404` | `code_circonscription` introuvable |
| `500` | Erreur base de données |

---

## Route 3 — Détail liste

```
GET /api/list/[code]/[panel]
```

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `code` | `string` | `code_circonscription` (ex. `"35238"`) |
| `panel` | `string` | `numero_panneau` (ex. `"3"`) — converti en entier côté serveur |

### Comportement

1. Vérifie l'existence de la liste `(code, panel)` → `404` si introuvable
2. Récupère la circonscription associée
3. Récupère tous les candidats de la liste, triés par `ordre` ASC

### Response `200 OK`

```json
{
  "circo": {
    "code_circonscription": "35238",
    "circonscription": "Rennes",
    "code_departement": "35",
    "departement": "Ille-et-Vilaine"
  },
  "liste": {
    "code_circonscription": "35238",
    "numero_panneau": 3,
    "libelle_abrege": "RENNES POUR TOUS",
    "libelle_liste": "RENNES POUR TOUS - LISTE CITOYENNE",
    "code_nuance": "DVG",
    "nuance": "Divers Gauche",
    "tete_de_liste": {
      "sexe": "F",
      "nom": "MARTIN",
      "prenom": "Claire",
      "nationalite": "Française"
    },
    "candidats": [
      {
        "ordre": 1,
        "sexe": "F",
        "nom": "MARTIN",
        "prenom": "Claire",
        "nationalite": "Française",
        "code_personnalite": null,
        "cc": null,
        "tete_de_liste": true
      },
      {
        "ordre": 2,
        "sexe": "M",
        "nom": "BERNARD",
        "prenom": "Antoine",
        "nationalite": "Française",
        "code_personnalite": null,
        "cc": null,
        "tete_de_liste": false
      }
    ]
  }
}
```

### Erreurs

| Code | Condition |
|------|-----------|
| `400` | `panel` non convertible en entier |
| `404` | Liste `(code, panel)` introuvable |
| `500` | Erreur base de données |

---

## URL modale (client)

L'état de la navigation modale est encodé dans les `searchParams` de l'URL :

| Param | Valeur | Effet |
|-------|--------|-------|
| `q` | terme de recherche | Requête active dans le champ de recherche |
| `city` | `code_circonscription` | Ouvre `CityModal` pour cette circonscription |
| `list` | `code_circonscription` | Ouvre `ListModal` (combiné avec `panel`) |
| `panel` | `numero_panneau` | Numéro de panneau de la liste à afficher |

**Exemples** :
- `/?q=rennes` — recherche active "rennes"
- `/?q=rennes&city=35238` — recherche + modale ville Rennes
- `/?q=rennes&city=35238&list=35238&panel=3` — recherche + modale ville + modale liste
