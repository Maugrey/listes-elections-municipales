# Tasks: Listes Élections Municipales 2026 — Baseline Stack

**Input**: `specs/master/` (plan.md, research.md, data-model.md, contracts/api.md, quickstart.md)
**Branch**: `master`

> **Note**: Toutes les tâches de développement sont déjà complètes ([x]). Les tâches
> opérationnelles (base de données, import, validation, déploiement) restent à exécuter ([ ]).

---

## Phase 1: Setup — Projet & Configuration

**Purpose**: Structure du projet, outils, dépendances

- [x] T001 Initialiser le projet Next.js 14 + TypeScript (`--tailwind --app --src-dir --import-alias "@/*"`)
- [x] T002 [P] Installer les dépendances DB : `drizzle-orm @neondatabase/serverless drizzle-kit`
- [x] T003 [P] Installer et configurer shadcn/ui + composants `button input badge dialog card skeleton`
- [x] T004 [P] Installer `next-themes`
- [x] T005 [P] Configurer Vitest + React Testing Library dans `vitest.config.ts`
- [x] T006 Créer `drizzle.config.ts` pointant vers `src/db/schema.ts` et Neon
- [x] T007 Créer `.env.local.example` avec `DATABASE_URL=`
- [x] T008 [P] Placer la police Marianne dans `public/fonts/` (source : etalab/marianne-font)
- [x] T009 Créer `src/types/index.ts` avec les types partagés de `contracts/api.md` : `Candidat`, `TeteDeListe`, `ListeResume`, `ListeDetail`, `Circonscription`, `SearchResultItem`, `SearchResponse`, `CityResponse`, `ListResponse`

---

## Phase 2: Foundation — Schéma DB & Pipeline d'import

**Purpose**: Infrastructure de données partagée par toutes les fonctionnalités

**⚠️ CRITIQUE : Les tâches opérationnelles T013–T015 bloquent le fonctionnement réel de l'application**

- [x] T010 Écrire le schéma Drizzle dans `src/db/schema.ts` : tables `circonscriptions`, `listes`, `candidats` avec PK composites, FK, colonnes nullable (voir `data-model.md`)
- [x] T011 Écrire la connexion Neon dans `src/db/index.ts` avec `@neondatabase/serverless` + `drizzle`
- [x] T012 Créer `scripts/init_extensions.sql` : `CREATE EXTENSION IF NOT EXISTS unaccent` + `pg_trgm`
- [x] T013 Écrire `scripts/import_data.py` : lecture CSV `;` + UTF-8 auto-détecté, DROP+CREATE tables, activation extensions, insertions batch (10 000 lignes), fallback tête de liste (`ordre = 1`), compte-rendu final
- [x] T014 Activer les extensions PostgreSQL sur Neon via `scripts/init_extensions.sql` (requis avant `drizzle-kit push`)
- [x] T015 Pousser le schéma en base : `npx drizzle-kit push` — valider dans le dashboard Neon que les 3 tables et leurs index existent
- [x] T016 Exécuter `python scripts/import_data.py` — valider les comptages (`≥ 100 000 candidats`, `≥ 30 000 listes`, `≥ 25 000 circonscriptions`)

**Checkpoint** : Base de données peuplée — l'application est fonctionnellement opérationnelle

---

## Phase 3: Recherche — `GET /api/search` (Priority: P1) 🎯 MVP

**Goal**: Recherche plein-texte multi-mots retournant des listes avec tête de liste et candidat correspondant

**Independent Test**: Taper "Rennes" → résultats avec code dépt, circo, libellé liste, nuance, tête de liste. Taper "Dupont Rennes" → AND inter-mots (tous les mots présents). Basculer vue liste/cartes.

### Tests Recherche

- [x] T017 [P] [US1] Écrire `tests/lib/utils.test.ts` : `getLongestLabel(abrege, complet)` (retourne le plus long, gère null/égaux), `formatEmptyField()` (retourne `"—"` si null/vide)
- [x] T018 [P] [US1] Écrire `tests/lib/search.test.ts` : validation ≥ 3 caractères, pagination par défaut, structure de réponse, construction SQL multi-mots (chaque mot dans les params)
- [x] T019 [P] [US1] Écrire `tests/components/SearchBar.test.tsx` : rendu, saisie, événement onChange, bouton bascule liste/carte
- [x] T020 [P] [US1] Écrire `tests/components/ResultCard.test.tsx` : affichage infos liste, tête de liste, candidat correspondant conditionnel, clic nom ville, clic nom liste

### Implémentation Recherche

- [x] T021 [US1] Implémenter `src/lib/utils.ts` : `getLongestLabel()`, `formatEmptyField()`, `buildModalUrl()` (construit URL avec searchParams `?q=`, `?city=`, `?list=`, `?panel=`)
- [x] T022 [US1] Implémenter `src/lib/search.ts` : découpage multi-mots (`split(/\s+/)`), condition par mot (`unaccent(champ) ILIKE unaccent('%mot%')` OR sur champs), AND inter-mots, sous-requête `matched_candidate`, pagination, tri par département/circonscription/panneau
- [x] T023 [US1] Implémenter `src/app/api/search/route.ts` : validation `q` (≥ 3 chars), appel `search()`, retour `SearchResponse` typé
- [x] T024 [P] [US1] Créer `src/components/SearchBar.tsx` : champ texte, bouton bascule liste/cartes, debounce 300ms
- [x] T025 [P] [US1] Créer `src/components/ResultCard.tsx` : affichage complet d'un `SearchResultItem`, nom ville cliquable, nom liste cliquable, badge nuance, section `matched_candidate` conditionnelle
- [x] T026 [P] [US1] Créer `src/components/EmptyState.tsx` : message "Aucun résultat pour [terme]"
- [x] T027 [US1] Créer `src/components/ResultListView.tsx` : toggle liste/carte, mapping sur `ResultCard`, squelettes de chargement, état vide, bouton "Charger plus"
- [x] T028 [US1] Assembler `src/app/page.tsx` : `SearchBar` + `ResultListView`, état query via URL searchParam `?q=`

**Checkpoint** : Recherche fonctionnelle et testable indépendamment — MVP validable

---

## Phase 4: Détail Ville — `GET /api/city/[code]` (Priority: P2)

**Goal**: Modale affichant toutes les listes + têtes de liste d'une circonscription, navigable depuis les résultats

**Independent Test**: Clic sur nom de ville → modale avec toutes ses listes ordonnées par panneau, boutons fermer et retour fonctionnels

### Tests Détail Ville

- [x] T029 [P] [US2] Écrire `tests/lib/city.test.ts` : mock DB, vérifie que toutes les listes de la circonscription sont retournées avec tête de liste, triées par `numero_panneau`
- [x] T030 [P] [US2] Écrire `tests/components/CityModal.test.tsx` : rendu infos dépt/circo, liste des listes, clic sur nom de liste, bouton fermer

### Implémentation Détail Ville

- [x] T031 [US2] Implémenter `src/lib/city.ts` : requête Drizzle circo + toutes les listes avec tête de liste, triées par `numero_panneau` ASC
- [x] T032 [US2] Implémenter `src/app/api/city/[code]/route.ts` : valider `code`, appel `getCityDetail()`, retour `CityResponse`, 404 si introuvable
- [x] T033 [US2] Créer `src/components/CityModal.tsx` : dialog shadcn, infos dépt/circo en en-tête, liste des `ListeResume` avec tête de liste, noms de liste cliquables
- [x] T034 [US2] Créer `src/components/ModalStack.tsx` : lit `searchParams` (`?city=`, `?list=`, `?panel=`), rend `CityModal` et/ou `ListModal` selon l'URL, gère la pile via `router.push()` / `router.back()`
- [x] T035 [US2] Brancher dans `src/app/page.tsx` : inclure `ModalStack`, les clics sur ville dans `ResultCard` poussent `?city=code` via `buildModalUrl()`

**Checkpoint** : Navigation recherche → détail ville avec pile de modales fonctionnelle

---

## Phase 5: Détail Liste — `GET /api/list/[code]/[panel]` (Priority: P3)

**Goal**: Modale listant tous les candidats d'une liste dans l'ordre, accessible depuis recherche ou modale ville

**Independent Test**: Clic sur nom de liste → modale avec tous les candidats triés par ordre, retour correct vers la vue précédente

### Tests Détail Liste

- [x] T036 [P] [US3] Écrire `tests/lib/list.test.ts` : mock DB, tous les candidats triés par `ordre` ASC, 404 si liste inexistante
- [x] T037 [P] [US3] Écrire `tests/components/ListModal.test.tsx` : rendu infos circo, infos liste, tableau candidats dans l'ordre, bouton retour
- [x] T038 [P] [US3] Écrire `tests/lib/import.test.ts` : connexion DB exportée, typage des entités

### Implémentation Détail Liste

- [x] T039 [US3] Implémenter `src/lib/list.ts` : requête Drizzle circo + liste + tous candidats triés `ordre` ASC
- [x] T040 [US3] Implémenter `src/app/api/list/[code]/[panel]/route.ts` : valider `code` et `panel` (entier), appel `getListDetail()`, retour `ListResponse`, 400/404 appropriés
- [x] T041 [US3] Créer `src/components/ListModal.tsx` : dialog shadcn, infos circo + liste en en-tête, tableau ordonné des candidats (Ordre, Sexe, Nom, Prénom, Nationalité, Code perso, CC), champs vides → `"—"`
- [x] T042 [US3] Brancher `ListModal` dans `ModalStack` : quand `?list=code&panel=n` → rendre `ListModal` par-dessus `CityModal` si `?city=` présent
- [x] T043 [US3] Brancher clic liste dans `CityModal` → `buildModalUrl()` ajoute `list=` + `panel=` sans supprimer `city=` (empilement)
- [x] T044 [US3] Implémenter navigation retour : `ListModal` "Retour" → `router.back()` (→ ville si empilé, → recherche si direct)

**Checkpoint** : Les trois vues sont fonctionnelles avec navigation retour correcte à tous niveaux

---

## Phase 6: Polish & Déploiement

**Purpose**: Design institutionnel, accessibilité, dark mode, responsive, déploiement

- [x] T045 Implémenter `src/app/layout.tsx` : `ThemeProvider` (next-themes), `next/font/local` Marianne, `lang="fr"`, meta tags
- [x] T046 [P] Créer `src/components/ThemeToggle.tsx` : bouton icône soleil/lune, persistance via next-themes
- [x] T047 Appliquer la palette Marianne dans `src/app/globals.css` : variables CSS `--color-blue` (#000091), `--color-red` (#E1000F), surfaces dark/light compatibles Tailwind
- [x] T048 Appliquer le design institutionnel gouv.fr sur tous les composants : typographie Marianne, espacement généreux, couleurs officielles, bordures fines
- [x] T049 [P] Layouts responsive mobile-first : SearchBar pleine largeur, 1→2→3 colonnes vue cartes
- [x] T050 [P] Squelettes de chargement (`Skeleton` shadcn) sur `ResultListView`, `CityModal`, `ListModal`
- [x] T051 [P] États d'erreur (fetch échoué) sur toutes les vues avec message + bouton "Réessayer"
- [x] T052 [P] Accessibilité clavier : fermeture Échap (natif Dialog Radix), focus trap (natif Radix), `aria-label` sur boutons icônes, `role` sur listes
- [x] T053 Mettre à jour `readme.md` avec instructions de setup et d'import
- [x] T054 Valider la suite de tests complète : `npm run test:run` → 0 échec
- [x] T055 Valider le build de production : `npm run build` → 0 erreur TypeScript, 0 erreur ESLint
- [ ] T056 Déployer sur Vercel : `vercel deploy --prod` — configurer `DATABASE_URL` dans les variables d'environnement Vercel

**Checkpoint** : Application déployée et opérationnelle sur Vercel free tier

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** : Aucune dépendance — peut démarrer immédiatement
- **Phase 2 (Foundation)** : Dépend de Phase 1 — **bloque le fonctionnement réel**
- **Phase 3 (Recherche)** : Dépend de Phase 2 (opérationnel) — MVP complet à elle seule
- **Phase 4 (Détail Ville)** : Dépend de Phase 2 — peut se paralléliser avec Phase 3
- **Phase 5 (Détail Liste)** : Dépend de Phase 2 — peut se paralléliser avec Phases 3 et 4
- **Phase 6 (Polish)** : T045–T053 indépendants, T054–T056 dépendent des phases 3–5

### User Story Dependencies

- **US1 (Recherche)** : Indépendante après Phase 2
- **US2 (Détail Ville)** : Intègre US1 (clic depuis résultats) mais testable via URL directe
- **US3 (Détail Liste)** : Intègre US1 et US2 (empilement) mais testable via URL directe

### Parallel Opportunities

- T002–T005 (installations) tous en parallèle
- T017–T020 (tests US1) tous en parallèle entre eux
- T024–T026 (composants US1 feuilles) en parallèle
- T029–T030 (tests US2) en parallèle
- T036–T038 (tests US3) en parallèle
- T045–T052 (polish) tous en parallèle entre eux

---

## Parallel Example: Phase 2 Opérationnel

```bash
# Séquentiel obligatoire (dépendances d'ordre) :
T014 — Activer extensions PostgreSQL
  ↓
T015 — npx drizzle-kit push
  ↓
T016 — python scripts/import_data.py
```

## Parallel Example: Phase 3 Recherche

```bash
# En parallèle (fichiers distincts) :
T017 — tests/lib/utils.test.ts
T018 — tests/lib/search.test.ts
T019 — tests/components/SearchBar.test.tsx
T020 — tests/components/ResultCard.test.tsx

# Séquentiel (dépendances) :
T021 (utils.ts) → T022 (search.ts) → T023 (route.ts)
T024 (SearchBar) + T025 (ResultCard) + T026 (EmptyState) → T027 (ResultListView) → T028 (page.tsx)
```

---

## Implementation Strategy

### Tâches opérationnelles restantes (ordre impératif)

```
1. T014 → activer extensions Neon
2. T015 → npx drizzle-kit push
3. T016 → python scripts/import_data.py
4. T054 → npm run test:run
5. T055 → npm run build
6. T056 → vercel deploy --prod
```

### MVP validable

L'application est déployable dès que T014–T016 sont complètes.
Toute la logique applicative (T001–T053) est déjà implémentée.

---

## Notes

- `[P]` = parallélisable (fichiers distincts, pas de dépendance non complétée)
- `[USn]` = appartient à l'aire fonctionnelle n (US1 = Recherche, US2 = Ville, US3 = Liste)
- Recherche multi-mots : `"Dupont Rennes"` → AND inter-mots (chaque mot cherché indépendamment sur tous les champs)
- `getLongestLabel(abrege, complet)` : retourne le plus long ; si identiques, retourne l'un d'eux
- `formatEmptyField(val)` : retourne `"—"` si `null` ou chaîne vide
- URL modale `?q=rennes&city=35238&list=35238&panel=3` → trois niveaux ouverts simultanément
