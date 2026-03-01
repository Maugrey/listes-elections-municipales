import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("pg", () => ({ Pool: class MockPool { constructor() {} } }));
vi.mock("drizzle-orm/node-postgres", () => ({ drizzle: vi.fn(() => mockDb) }));

const mockDb = { execute: vi.fn() };
vi.mock("@/db/index", () => ({ db: mockDb }));

const mockCandidats = [
  {
    code_circonscription: "35238",
    numero_panneau: 3,
    libelle_abrege: "RPT",
    libelle_liste: "RENNES POUR TOUS",
    code_nuance: "DVG",
    nuance: "Divers gauche",
    circonscription: "Rennes",
    code_departement: "35",
    departement: "Ille-et-Vilaine",
    ordre: 1,
    sexe: "F",
    nom: "MARTIN",
    prenom: "Claire",
    nationalite: "Française",
    code_personnalite: null,
    cc: null,
    tete_de_liste: true,
    tl_sexe: "F",
    tl_nom: "MARTIN",
    tl_prenom: "Claire",
    tl_nationalite: "Française",
  },
  {
    code_circonscription: "35238",
    numero_panneau: 3,
    libelle_abrege: "RPT",
    libelle_liste: "RENNES POUR TOUS",
    code_nuance: "DVG",
    nuance: "Divers gauche",
    circonscription: "Rennes",
    code_departement: "35",
    departement: "Ille-et-Vilaine",
    ordre: 2,
    sexe: "M",
    nom: "DUPONT",
    prenom: "Jean",
    nationalite: "Française",
    code_personnalite: null,
    cc: null,
    tete_de_liste: false,
    tl_sexe: "F",
    tl_nom: "MARTIN",
    tl_prenom: "Claire",
    tl_nationalite: "Française",
  },
];

describe("getListDetail — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejette un code vide", async () => {
    const { getListDetail } = await import("@/lib/list");
    await expect(getListDetail("", 1)).rejects.toThrow();
  });

  it("rejette un numéro de panneau invalide", async () => {
    const { getListDetail } = await import("@/lib/list");
    await expect(getListDetail("35238", 0)).rejects.toThrow();
    await expect(getListDetail("35238", -1)).rejects.toThrow();
  });
});

describe("getListDetail — structure de la réponse", () => {
  beforeEach(() => {
    mockDb.execute = vi.fn().mockResolvedValueOnce({ rows: mockCandidats });
  });

  it("retourne circo et liste avec candidats", async () => {
    const { getListDetail } = await import("@/lib/list");
    const result = await getListDetail("35238", 3);
    expect(result).not.toBeNull();
    expect(result!).toHaveProperty("circo");
    expect(result!).toHaveProperty("liste");
    expect(result!.liste).toHaveProperty("candidats");
  });

  it("les candidats sont triés par ordre croissant", async () => {
    const { getListDetail } = await import("@/lib/list");
    const result = await getListDetail("35238", 3);
    const ordres = result!.liste.candidats.map((c) => c.ordre);
    expect(ordres).toEqual([...ordres].sort((a, b) => a - b));
  });
});

describe("getListDetail — 404", () => {
  beforeEach(() => {
    mockDb.execute = vi.fn().mockResolvedValueOnce({ rows: [] });
  });

  it("retourne null si liste inexistante", async () => {
    const { getListDetail } = await import("@/lib/list");
    const result = await getListDetail("XXXXX", 99);
    expect(result).toBeNull();
  });
});
