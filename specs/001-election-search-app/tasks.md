# Tasks: Portail de Recherche des Candidatures Municipales 2026

**Input**: `specs/001-election-search-app/` (plan.md, spec.md, data-model.md, contracts/api.md)
**Branch**: `001-election-search-app`

---

## Phase 1: Setup — Initialisation du projet

**Purpose**: Créer la structure du projet et configurer tous les outils

- [ ] T001 Initialiser le projet Next.js 14 + TypeScript à la racine (`npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"`)
- [ ] T002 [P] Installer les dépendances DB : `drizzle-orm @neondatabase/serverless drizzle-kit`
- [ ] T003 [P] Initialiser shadcn/ui (`npx shadcn@latest init`) et ajouter les composants : `button`, `input`, `badge`, `dialog`, `card`, `skeleton`
- [ ] T004 [P] Installer `next-themes`
- [ ] T005 [P] Installer et configurer Vitest + React Testing Library : `vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
- [ ] T006 Créer `vitest.config.ts` avec environment jsdom et setup file
- [ ] T007 Créer `drizzle.config.ts` pointant vers `src/db/schema.ts` et Neon
- [ ] T008 Créer `.env.local.example` avec `DATABASE_URL=`
- [ ] T009 Ajouter `scripts/` à `.gitignore` Python cache + `__pycache__`, `.env.local` (déjà présent)
- [ ] T010 Créer `src/types/index.ts` avec tous les types TypeScript partagés (voir contracts/api.md)

---

## Phase 2: Foundation — Schéma DB + Script d'import

**Purpose**: Infra de données partagée par toutes les user stories

**⚠️ CRITIQUE : Aucune user story ne peut démarrer avant la fin de cette phase**

- [ ] T011 Écrire le schéma Drizzle dans `src/db/schema.ts` : tables `circonscriptions`, `listes`, `candidats` avec clés primaires, clés étrangères, et colonnes nullable conformes à `data-model.md`
- [ ] T012 Écrire la connexion Neon dans `src/db/index.ts` avec `@neondatabase/serverless` + `drizzle`
- [ ] T013 Pousser le schéma en base : `npx drizzle-kit push` (valider dans le dashboard Neon)
- [ ] T014 Écrire `scripts/import_data.py` : lecture CSV (séparateur `;`, encodage UTF-8/Latin-1 auto-détecté), DROP+CREATE toutes les tables, activation extensions `unaccent`+`pg_trgm`, insertion batch par table dans l'ordre défini dans `data-model.md`, fallback tête de liste, compte-rendu final
- [ ] T015 [P] Écrire les tests du script d'import dans `tests/lib/import.test.ts` : vérification que le module de connexion DB est bien exporté, typage des entités
- [ ] T016 Exécuter `python scripts/import_data.py` localement et valider les comptages (≥ 100 000 candidats attendus)

**Checkpoint** : Base de données peuplée — les 3 routes API peuvent être développées

---

## Phase 3: User Story 1 — Recherche (Priority: P1) 🎯 MVP

**Goal**: Recherche plein texte retournant des listes électorales avec tête de liste et candidat correspondant éventuel

**Independent Test**: Taper "Rennes" → résultats paginés affichant Code dépt, Département, Circo, Numéro panneau, Libellé liste, Nuance, tête de liste ; basculer entre vue liste et vue cartes

### Tests US1

- [ ] T017 [P] [US1] Écrire `tests/lib/utils.test.ts` : test de la fonction `getLongestLabel(abrege, complet)` (retourne le plus long, gère les cas null/égaux)
- [ ] T018 [P] [US1] Écrire `tests/lib/search.test.ts` : tests unitaires de la fonction de construction de requête SQL de recherche (mock db, cas : recherche ville, recherche candidat, diacritiques, requête vide)
- [ ] T019 [P] [US1] Écrire `tests/components/SearchBar.test.tsx` : rendu, saisie de texte, événement onChange, bouton bascule liste/carte
- [ ] T020 [P] [US1] Écrire `tests/components/ResultCard.test.tsx` : rendu des infos liste, rendu tête de liste, rendu candidat correspondant, clic nom ville, clic nom liste

### Implémentation US1

- [ ] T021 [US1] Implémenter `src/lib/utils.ts` : `getLongestLabel()`, `formatEmptyField()` (retourne `"—"` si null/vide), `buildModalUrl()` (construit l'URL avec searchParams)
- [ ] T022 [US1] Implémenter `src/lib/search.ts` : requête Drizzle avec `sql\`unaccent(...) ILIKE unaccent('%${q}%')\`` sur tous les champs, jointure tête de liste, détection `matched_candidate`, pagination
- [ ] T023 [US1] Implémenter `src/app/api/search/route.ts` : validation `q` (≥ 3 chars), appel `search()`, retour `SearchResponse` (voir contracts/api.md)
- [ ] T024 [P] [US1] Créer `src/components/SearchBar.tsx` : champ texte, bouton bascule liste/cartes (icônes), debounce 300ms sur la saisie
- [ ] T025 [P] [US1] Créer `src/components/ResultCard.tsx` : affichage complet d'un `SearchResultItem`, nom ville cliquable, nom liste cliquable, badge nuance, section candidat correspondant conditionnelle
- [ ] T026 [US1] Créer `src/components/ResultListView.tsx` : conteneur gérant le toggle liste/carte, mapping des résultats sur `ResultCard`, état de chargement (squelettes), état vide (`EmptyState`), bouton "Charger plus"
- [ ] T027 [P] [US1] Créer `src/components/EmptyState.tsx` : message "Aucun résultat pour [terme]"
- [ ] T028 [US1] Assembler `src/app/page.tsx` : `SearchBar` + `ResultListView`, gestion de l'état query (URL searchParam `?q=`)

**Checkpoint** : Recherche entièrement fonctionnelle et testable indépendamment

---

## Phase 4: User Story 2 — Détail Ville (Priority: P2)

**Goal**: Modale affichant toutes les listes + tête de liste d'une circonscription, navigable depuis la recherche

**Independent Test**: Clic sur un nom de ville → modale avec toutes ses listes, boutons fermer et retour fonctionnels

### Tests US2

- [ ] T029 [P] [US2] Écrire `tests/lib/city.test.ts` : mock db, vérifier que la requête retourne toutes les listes de la circonscription avec leur tête de liste
- [ ] T030 [P] [US2] Écrire `tests/components/CityModal.test.tsx` : rendu infos dépt/circo, liste des listes, clic sur nom de liste, bouton fermer

### Implémentation US2

- [ ] T031 [US2] Implémenter `src/lib/city.ts` : requête Drizzle pour récupérer circo + toutes les listes avec tête de liste, triées par `numero_panneau`
- [ ] T032 [US2] Implémenter `src/app/api/city/[code]/route.ts` : valider `code`, appel `getCityDetail()`, retour `CityResponse`, 404 si inexistant
- [ ] T033 [US2] Créer `src/components/CityModal.tsx` : dialog shadcn, infos dépt/circo en en-tête, liste de `ListeResume` avec tête de liste, noms de liste cliquables → ouvre modale liste
- [ ] T034 [US2] Créer `src/components/ModalStack.tsx` : lit `searchParams` (`?city=` et `?list=` avec `panel=`), rend `CityModal` et/ou `ListModal` selon l'état de l'URL, gère la pile avec `router.back()` / `router.push()`
- [ ] T035 [US2] Brancher dans `src/app/page.tsx` : inclure `ModalStack`, les clics sur ville dans `ResultCard` modifient l'URL via `buildModalUrl()`

**Checkpoint** : Navigation recherche → détail ville avec pile de modales fonctionnelle

---

## Phase 5: User Story 3 — Détail Liste (Priority: P3)

**Goal**: Modale affichant tous les candidats d'une liste dans l'ordre, accessible depuis recherche ou modale ville

**Independent Test**: Clic sur nom de liste (depuis résultats ou depuis modale ville) → modale avec liste complète ordonnée

### Tests US3

- [ ] T036 [P] [US3] Écrire `tests/lib/list.test.ts` : mock db, vérifier que la requête retourne tous les candidats triés par `ordre`, 404 si liste inexistante
- [ ] T037 [P] [US3] Écrire `tests/components/ListModal.test.tsx` : rendu infos circo, infos liste, tableau candidats dans l'ordre, bouton retour

### Implémentation US3

- [ ] T038 [US3] Implémenter `src/lib/list.ts` : requête Drizzle pour récupérer circo + liste + tous les candidats triés par `ordre` ASC
- [ ] T039 [US3] Implémenter `src/app/api/list/[code]/[panel]/route.ts` : valider `code` et `panel` (entier), appel `getListDetail()`, retour `ListResponse`, 400/404 appropriés
- [ ] T040 [US3] Créer `src/components/ListModal.tsx` : dialog shadcn, infos circo + infos liste en en-tête, tableau ordonné de tous les candidats (Ordre, Sexe, Nom, Prénom, Nationalité, Code personnalité, CC), champs vides → `"—"`
- [ ] T041 [US3] Brancher `ListModal` dans `ModalStack` : quand `?list=code&panel=n` est présent dans l'URL, rendre `ListModal` (par-dessus `CityModal` si `?city=` est aussi présent)
- [ ] T042 [US3] Brancher clic sur liste dans `CityModal` → `buildModalUrl()` ajoute `list=` et `panel=` sans supprimer `city=` (empilement)
- [ ] T043 [US3] Implémenter navigation retour : dans `ListModal`, "Retour" → `router.back()` (revient à l'URL précédente, donc ville si empilé ou recherche si direct)

**Checkpoint** : Les trois vues sont fonctionnelles avec navigation retour correcte à tous les niveaux

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Design institutionnel, accessibilité, dark mode, responsive

- [ ] T044 Télécharger la police Marianne (https://www.systeme-de-design.gouv.fr/fondamentaux/typographie) et la placer dans `public/fonts/`, configurer `next/font/local` dans `src/app/layout.tsx`
- [ ] T045 Implémenter `src/app/layout.tsx` complet : `ThemeProvider` (next-themes), police Marianne, meta tags, `lang="fr"`
- [ ] T046 [P] Créer `src/components/ThemeToggle.tsx` : bouton icône soleil/lune, persistance localStorage via next-themes
- [ ] T047 Appliquer la palette Marianne dans `src/app/globals.css` : variables CSS `--color-blue` (#000091), `--color-red` (#E1000F), surfaces dark/light, via Tailwind CSS variables
- [ ] T048 Appliquer le design institutionnel sur tous les composants : typographie Marianne, espacement généreux, couleurs Marianne, bordures fines, pas d'ombres excessives
- [ ] T049 [P] Implémenter les layouts responsive (mobile-first) : SearchBar pleine largeur sur mobile, 1 colonne → 2 colonnes → 3 colonnes pour la vue cartes
- [ ] T050 [P] Ajouter les squelettes de chargement (`Skeleton` shadcn) sur `ResultListView`, `CityModal` et `ListModal` pendant le fetch
- [ ] T051 [P] Ajouter les états d'erreur (fetch échoué) sur toutes les vues avec message et bouton "Réessayer"
- [ ] T052 [P] Ajouter la navigation clavier dans les modales : fermeture sur Échap (natif Dialog shadcn), focus trap automatique (natif Radix UI), focus visible sur tous les éléments interactifs
- [ ] T053 [P] Vérifier les attributs ARIA : `aria-label` sur les boutons icônes, `role` sur les listes de résultats, titres de modales liés via `aria-labelledby`
- [ ] T054 Mettre à jour le `readme.md` racine avec les instructions de setup et d'import (pointer vers `specs/001-election-search-app/quickstart.md`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** : Aucune dépendance — peut démarrer immédiatement
- **Phase 2 (Foundation)** : Dépend de Phase 1 — **bloque toutes les user stories**
- **Phase 3 (US1 Recherche)** : Dépend de Phase 2 — première à implémenter (MVP)
- **Phase 4 (US2 Ville)** : Dépend de Phase 2 — peut démarrer en parallèle de Phase 3
- **Phase 5 (US3 Liste)** : Dépend de Phase 2 — peut démarrer en parallèle des phases 3 et 4
- **Phase 6 (Polish)** : Dépend des phases 3, 4, 5 pour être appliqué à tous les composants

### Within Each User Story

- Tests → Utilitaires/Lib → Route API → Composants → Branchement
- Chaque story doit être indépendamment testable avant de passer à la suivante

### Parallel Opportunities

- T002–T005 (installations) en parallèle
- T017–T020 (tests US1) tous en parallèle entre eux
- T024–T025 (composants US1) en parallèle
- T029–T030 (tests US2) en parallèle
- T036–T037 (tests US3) en parallèle
- T044–T053 (polish) majoritairement en parallèle

---

## Implementation Strategy

### MVP (Phase 1 + 2 + 3 uniquement)

1. Setup + Foundation
2. User Story 1 (Recherche)
3. **STOP** → Valider : l'application est utilisable, la recherche retourne des résultats
4. Déployer sur Vercel pour validation

### Livraison incrémentale

1. MVP validé → ajouter US2 (détail ville) → retester + déployer
2. US2 validé → ajouter US3 (détail liste) → retester + déployer
3. Toutes stories validées → Polish → déploiement final

---

## Notes

- `[P]` = parallélisable (fichiers distincts, pas de dépendance non complétée)
- `[USn]` = appartient à la User Story n pour traçabilité
- Vérifier que tous les tests passent après chaque phase avant de continuer
- `getLongestLabel()` : si les deux libellés sont identiques, retourner l'un d'eux une seule fois
- Les champs vides en base (NULL) sont affichés `"—"` côté UI via `formatEmptyField()`
- L'URL `?q=rennes&city=35238&list=35238&panel=3` représente : recherche "rennes", modale ville 35238, modale liste 35238 panneau 3 ouverte par-dessus
