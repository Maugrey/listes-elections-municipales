import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Neon et Drizzle avant tout import
vi.mock("pg", () => ({ Pool: class MockPool { constructor() {} } }));
vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => mockDb),
}));

// Mock de la base de données
const mockDb = {
  select: vi.fn(),
  execute: vi.fn(),
};

vi.mock("@/db/index", () => ({ db: mockDb }));

// Mock du module search (pour tester la validation)
vi.mock("@/lib/search", async (importOriginal) => {
  return await importOriginal();
});

describe("search — validation des paramètres", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejette une requête de moins de 3 caractères", async () => {
    const { search } = await import("@/lib/search");
    await expect(search({ q: "ab" })).rejects.toThrow(/3 caract/i);
  });

  it("rejette une requête vide", async () => {
    const { search } = await import("@/lib/search");
    await expect(search({ q: "" })).rejects.toThrow();
  });

  it("accepte une requête de 3 caractères ou plus", async () => {
    // Configure le mock pour retourner un résultat vide
    mockDb.execute = vi.fn().mockResolvedValueOnce([]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValueOnce([]),
    });

    const { search } = await import("@/lib/search");
    // Ne doit pas rejeter
    await expect(search({ q: "ren" })).resolves.toBeDefined();
  });
});

describe("search — pagination par défaut", () => {
  it("retourne page=1 et limit=20 par défaut", async () => {
    mockDb.execute = vi.fn().mockResolvedValueOnce([{ count: "0" }]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValueOnce([]),
    });

    const { search } = await import("@/lib/search");
    const result = await search({ q: "rennes" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("search — structure de la réponse", () => {
  it("retourne les champs attendus (results, total, page, limit, has_more)", async () => {
    mockDb.execute = vi.fn().mockResolvedValueOnce([{ count: "0" }]);
    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValueOnce([]),
    });

    const { search } = await import("@/lib/search");
    const result = await search({ q: "paris" });

    expect(result).toHaveProperty("results");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("has_more");
    expect(Array.isArray(result.results)).toBe(true);
  });
});
