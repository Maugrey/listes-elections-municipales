# Feature Specification: Portail de Recherche des Candidatures Municipales 2026

**Feature Branch**: `001-election-search-app`
**Created**: 2026-02-28
**Status**: Draft
**Input**: Application React/TypeScript de recherche et consultation des listes de candidats
aux élections municipales françaises 2026, déployée sur Vercel free tier, avec script Python
d'import CSV vers PostgreSQL (Neon).

---

## User Scenarios & Testing

### User Story 1 — Recherche de listes électorales (Priority: P1)

Un citoyen veut trouver les listes candidates dans sa ville, ou retrouver un candidat par son
nom, et voir les informations clés de chaque liste correspondante.

**Why this priority**: Fonctionnalité centrale — l'application n'a aucune valeur sans elle.

**Independent Test**: Ouvrir la page, taper un nom de ville (ex. "Rennes"), obtenir des
résultats commutables entre vue liste et vue cartes.

**Acceptance Scenarios**:

1. **Given** la page de recherche est ouverte, **When** l'utilisateur tape un nom de ville
   (partiel, accentué ou non), **Then** toutes les listes des villes correspondantes sont
   affichées, chacune avec : Code dépt, Département, Code circo, Circonscription, N° panneau,
   Libellé liste (le plus long de `Libellé abrégé` et `Libellé de la liste`), Nuance, et pour
   la tête de liste : Sexe, Nom, Prénom, Nationalité.
2. **Given** la page est ouverte, **When** l'utilisateur tape un nom ou prénom de candidat,
   **Then** toutes les listes contenant ce candidat sont affichées ; si le candidat trouvé
   n'est pas tête de liste, son Nom, Prénom et Ordre apparaissent en supplément dans la carte.
3. **Given** des résultats sont affichés, **When** l'utilisateur clique le bouton de bascule
   liste/carte, **Then** l'affichage change sans perdre les résultats ni la requête.
4. **Given** aucun résultat ne correspond à la requête, **Then** un message "aucun résultat"
   clair et non ambigu est affiché.
5. **Given** un résultat est affiché, **When** l'utilisateur clique le nom de la ville,
   **Then** la modale détail ville s'ouvre par-dessus la liste de résultats.
6. **Given** un résultat est affiché, **When** l'utilisateur clique le nom d'une liste,
   **Then** la modale détail liste s'ouvre par-dessus la liste de résultats.

---

### User Story 2 — Détail ville (Priority: P2)

Un citoyen a trouvé sa ville et veut voir le panorama complet de toutes les listes en
compétition avec leur tête de liste respective.

**Why this priority**: Vue intermédiaire clé — transforme un résultat de recherche en
panorama complet d'une circonscription.

**Independent Test**: Clic sur un nom de ville → modale ville avec toutes les listes et
têtes de liste, boutons de navigation fonctionnels.

**Acceptance Scenarios**:

1. **Given** une ville accessible dans les résultats ou dans toute modale, **When**
   l'utilisateur clique le nom de la ville, **Then** une modale s'ouvre affichant :
   Code dépt, Département, Code circo, Circonscription, puis pour chaque liste : N° panneau,
   Libellé abrégé, Libellé complet, Code nuance, Nuance, et la tête de liste (Ordre, Sexe,
   Nom, Prénom, Nationalité, Code personnalité, CC).
2. **Given** la modale ville est ouverte, **When** l'utilisateur clique le nom d'une liste,
   **Then** la modale liste s'ouvre par-dessus la modale ville (empilement).
3. **Given** la modale ville est ouverte, **When** l'utilisateur clique Fermer ou appuie sur
   Échap, **Then** la modale se ferme et les résultats de recherche sont à nouveau visibles.
4. **Given** la modale liste a été ouverte depuis la modale ville, **When** l'utilisateur
   clique Retour dans la modale liste, **Then** il revient à la modale ville (pas aux résultats).

---

### User Story 3 — Détail liste (Priority: P3)

Un citoyen veut voir la liste complète et ordonnée de tous les candidats d'une liste
électorale.

**Why this priority**: Complète le parcours de navigation en profondeur.

**Independent Test**: Clic sur un nom de liste → modale avec tous les candidats dans l'ordre
croissant.

**Acceptance Scenarios**:

1. **Given** une liste accessible (depuis recherche ou depuis modale ville), **When**
   l'utilisateur clique le nom de liste, **Then** une modale s'ouvre affichant : infos
   Circonscription + infos liste (N° panneau, Libellé abrégé, Libellé complet, Code nuance,
   Nuance) + TOUS les candidats triés par Ordre avec Sexe, Nom, Prénom, Nationalité, Code
   personnalité, CC.
2. **Given** la modale liste a été ouverte depuis les résultats de recherche, **When**
   l'utilisateur clique Retour, **Then** il revient aux résultats de recherche.
3. **Given** la modale liste a été ouverte depuis la modale ville, **When** l'utilisateur
   clique Retour, **Then** il revient à la modale ville.
4. **Given** la modale liste est ouverte, **When** l'utilisateur appuie sur Échap, **Then**
   la modale du dessus se ferme (comportement identique à Retour).

---

### Edge Cases

- Si `Libellé abrégé` et `Libellé de la liste` sont identiques → afficher une seule fois.
- Si aucun candidat n'a `Tête de liste = "OUI"` → utiliser `Ordre = 1` comme fallback.
- Résultats > 20 items → pagination avec bouton "Charger plus" (pas de pagination numérotée).
- Champs vides (nuance, nationalité, Code personnalité, CC) → afficher `—` (tiret cadratin).
- Recherche avec diacritiques : `unaccent` normalise à la fois la requête et les données indexées (chercher "ile" trouve "Île-de-France").
- Requête vide → pas d'appel API, état initial affiché.
- Très longue liste de candidats (>100) → rendu virtualisé ou scroll natif, pas de pagination.

---

## Requirements

### Functional Requirements

- **FR-001** : Le système DOIT proposer un champ de recherche unique interrogeant
  simultanément : `Code département`, `Département`, `Code circonscription`,
  `Circonscription`, `Libellé abrégé de liste`, `Libellé de la liste`, `Nuance de liste`,
  `Nom sur le bulletin de vote`, `Prénom sur le bulletin de vote`.
- **FR-002** : La recherche DOIT normaliser les diacritiques françaises via l'extension
  PostgreSQL `unaccent` (chercher "ile" trouve "Île").
- **FR-003** : Les résultats DOIVENT être au niveau **liste électorale** — un élément par
  couple (circonscription, numéro de panneau).
- **FR-004** : Chaque carte/ligne de résultat DOIT afficher : Code dépt, Département, Code
  circo, Circonscription, N° panneau, Libellé liste (le plus long des deux libellés), Nuance,
  et pour la tête de liste : Sexe, Nom, Prénom, Nationalité.
- **FR-005** : Quand la requête correspond à un candidat non-tête de liste, son Nom, Prénom
  et Ordre DOIVENT apparaître en supplément dans la carte résultat correspondante.
- **FR-006** : Les résultats DOIVENT être commutables entre vue liste verticale et vue cartes
  en grille, via un bouton de bascule persistant.
- **FR-007** : Clic sur le nom d'une ville dans tout contexte → modale détail ville ;
  clic sur le nom d'une liste dans tout contexte → modale détail liste.
- **FR-008** : La modale ville DOIT afficher : infos dépt/circo + pour chaque liste :
  N° panneau, Libellé abrégé, Libellé complet, Code nuance, Nuance, tête de liste (Ordre,
  Sexe, Nom, Prénom, Nationalité, Code personnalité, CC).
- **FR-009** : La modale liste DOIT afficher : infos circo + infos liste + TOUS les candidats
  triés par Ordre croissant avec Sexe, Nom, Prénom, Nationalité, Code personnalité, CC.
- **FR-010** : La navigation modale DOIT gérer une pile : recherche → ville → liste, avec des
  boutons Retour revenant exactement au niveau précédent.
- **FR-011** : L'état des modales ouvertes DOIT être reflété dans l'URL via `searchParams`
  (liens partageables, bouton Précédent du navigateur fonctionnel).
- **FR-012** : L'application DOIT supporter light mode et dark mode avec un bouton de bascule
  persistant (préférence sauvegardée dans localStorage, respect de `prefers-color-scheme`).
- **FR-013** : Le design DOIT suivre l'esthétique flat institutionnelle française (gouv.fr) :
  police Marianne, palette bleu/blanc/rouge sobre, espacement généreux.
- **FR-014** : Le script d'import Python DOIT effectuer un drop-and-reload complet de toutes
  les tables, être ré-exécutable sans risque et afficher un compte-rendu en fin d'exécution.

### Key Entities

- **Circonscription** : District électoral identifié par `Code circonscription`. Possède un
  libellé (`Circonscription`), appartient à un département (`Code département`, `Département`).
- **Liste** : Liste de candidats identifiée par le couple (`Code circonscription`,
  `Numéro de panneau`). Possède deux libellés, une nuance, un code nuance. Contient
  exactement une tête de liste (candidat avec `Tête de liste = "OUI"` ou `Ordre = 1`).
- **Candidat** : Individu identifié par (`Code circonscription`, `Numéro de panneau`,
  `Ordre`). Appartient à une liste. Possède : Sexe, Nom, Prénom, Nationalité, Code
  personnalité, CC, flag `tete_de_liste`.

---

## Success Criteria

### Measurable Outcomes

- **SC-001** : Un utilisateur trouve toutes les listes d'une ville connue en moins de 5
  secondes depuis la page d'accueil.
- **SC-002** : Une recherche partielle (3 caractères minimum) retourne des résultats pertinents,
  y compris pour les variantes sans diacritiques.
- **SC-003** : Le drill-down complet recherche → détail liste est accessible en 3 clics maximum.
- **SC-004** : First Contentful Paint < 3 secondes depuis Vercel sur connexion standard.
- **SC-005** : 100 % des tests unitaires passent avec 0 échec.
- **SC-006** : Light mode et dark mode rendent correctement tous les éléments UI sans texte
  illisible ni artefact visuel.
- **SC-007** : Le script d'import s'exécute jusqu'à la fin sans erreur sur le fichier CSV
  source et affiche le nombre de lignes importées par table.
