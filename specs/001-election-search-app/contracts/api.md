# API Contracts: Portail de Recherche des Candidatures Municipales 2026

**Branch**: `001-election-search-app` | **Date**: 2026-02-28

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

export type TetiDeListe = {
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
  tete_de_liste: TetiDeListe;
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

// Résultat de recherche enrichi
export type SearchResultItem = {
  liste: ListeResume;
  circo: Circonscription;
  matched_candidate: {          // null si la correspondance est sur la ville/liste
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
  listes: ListeResume[];         // toutes les listes de la circonscription
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
2. Recherche `unaccent(ILIKE '%q%')` sur : `circonscription`, `departement`,
   `libelle_liste`, `libelle_abrege`, `nuance`, `nom` (candidats), `prenom` (candidats)
3. Résultats au niveau **liste** : un item par couple `(code_circonscription, numero_panneau)`
4. Si la correspondance est sur un candidat non-tête de liste → `matched_candidate` est
   renseigné avec le premier candidat correspondant trouvé
5. Jointure systématique sur `candidats` pour récupérer la tête de liste
6. Tri : par département ASC, puis circonscription ASC, puis numero_panneau ASC

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
2. Récupère la circonscription
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
