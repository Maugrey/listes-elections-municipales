import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@neondatabase/serverless", () => ({ neon: vi.fn(() => vi.fn()) }));
vi.mock("drizzle-orm/neon-http", () => ({ drizzle: vi.fn(() => mockDb) }));

const mockDb = { execute: vi.fn() };
vi.mock("@/db/index", () => ({ db: mockDb }));

const mockListes = [
  {
    code_circonscription: "35238",
    numero_panneau: 1,
    libelle_abrege: "RENNES UNIE",
    libelle_liste: "RENNES POUR UNE VILLE UNIE",
    code_nuance: "DVG",
    nuance: "Divers gauche",
    tl_sexe: "F",
    tl_nom: "MARTIN",
    tl_prenom: "Claire",
    tl_nationalite: "Française",
    circonscription: "Rennes",
    code_departement: "35",
    departement: "Ille-et-Vilaine",
  },
];

describe("getCityDetail — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejette un code vide", async () => {
    const { getCityDetail } = await import("@/lib/city");
    await expect(getCityDetail("")).rejects.toThrow();
  });
});

describe("getCityDetail — structure de la réponse", () => {
  beforeEach(() => {
    mockDb.execute = vi.fn().mockResolvedValueOnce(mockListes);
  });

  it("retourne circo et listes", async () => {
    const { getCityDetail } = await import("@/lib/city");
    const result = await getCityDetail("35238");
    expect(result).toHaveProperty("circo");
    expect(result).toHaveProperty("listes");
    expect(Array.isArray(result.listes)).toBe(true);
  });

  it("chaque liste a une tête de liste", async () => {
    const { getCityDetail } = await import("@/lib/city");
    const result = await getCityDetail("35238");
    for (const liste of result.listes) {
      expect(liste).toHaveProperty("tete_de_liste");
      expect(liste.tete_de_liste).toHaveProperty("nom");
      expect(liste.tete_de_liste).toHaveProperty("prenom");
    }
  });
});

describe("getCityDetail — 404", () => {
  beforeEach(() => {
    mockDb.execute = vi.fn().mockResolvedValueOnce([]);
  });

  it("retourne null si aucune circonscription trouvée", async () => {
    const { getCityDetail } = await import("@/lib/city");
    const result = await getCityDetail("XXXXX");
    expect(result).toBeNull();
  });
});
