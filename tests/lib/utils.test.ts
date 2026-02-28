import { describe, it, expect } from "vitest";
import { getLongestLabel, formatEmptyField, buildModalUrl } from "@/lib/utils";

describe("getLongestLabel", () => {
  it("retourne le libellé le plus long quand les deux sont différents", () => {
    expect(getLongestLabel("RPT", "RENNES POUR TOUS")).toBe("RENNES POUR TOUS");
  });

  it("retourne abrégé si c'est le plus long", () => {
    expect(getLongestLabel("RENNES POUR TOUS", "RPT")).toBe("RENNES POUR TOUS");
  });

  it("retourne l'un des deux si identiques", () => {
    expect(getLongestLabel("MÊME LIBELLÉ", "MÊME LIBELLÉ")).toBe("MÊME LIBELLÉ");
  });

  it("retourne complet si abrégé est null", () => {
    expect(getLongestLabel(null, "RENNES POUR TOUS")).toBe("RENNES POUR TOUS");
  });

  it("retourne complet si abrégé est chaîne vide", () => {
    expect(getLongestLabel("", "RENNES POUR TOUS")).toBe("RENNES POUR TOUS");
  });

  it("retourne complet si les deux sont null/vide", () => {
    expect(getLongestLabel(null, "")).toBe("");
  });
});

describe("formatEmptyField", () => {
  it("retourne '—' pour null", () => {
    expect(formatEmptyField(null)).toBe("—");
  });

  it("retourne '—' pour chaîne vide", () => {
    expect(formatEmptyField("")).toBe("—");
  });

  it("retourne '—' pour chaîne espace seul", () => {
    expect(formatEmptyField("   ")).toBe("—");
  });

  it("retourne la valeur si non vide", () => {
    expect(formatEmptyField("Française")).toBe("Française");
  });

  it("retourne '—' pour undefined", () => {
    expect(formatEmptyField(undefined)).toBe("—");
  });
});

describe("buildModalUrl", () => {
  it("construit une URL avec q seulement", () => {
    const url = buildModalUrl({ q: "rennes" });
    expect(url).toContain("q=rennes");
    expect(url).not.toContain("city=");
    expect(url).not.toContain("list=");
  });

  it("ajoute city à une URL existante", () => {
    const url = buildModalUrl({ q: "rennes", city: "35238" });
    expect(url).toContain("q=rennes");
    expect(url).toContain("city=35238");
  });

  it("ajoute list + panel", () => {
    const url = buildModalUrl({ q: "rennes", city: "35238", list: "35238", panel: 3 });
    expect(url).toContain("list=35238");
    expect(url).toContain("panel=3");
  });

  it("n'inclut pas les paramètres undefined", () => {
    const url = buildModalUrl({ q: "paris" });
    expect(url).not.toContain("undefined");
    expect(url).not.toContain("null");
  });

  it("commence par ?", () => {
    const url = buildModalUrl({ q: "test" });
    expect(url).toMatch(/^\?/);
  });
});
