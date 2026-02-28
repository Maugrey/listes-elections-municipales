import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultCard } from "@/components/ResultCard";
import type { SearchResultItem } from "@/types";

const mockItem: SearchResultItem = {
  liste: {
    code_circonscription: "35238",
    numero_panneau: 3,
    libelle_abrege: "RPT",
    libelle_liste: "RENNES POUR TOUS",
    code_nuance: "DVG",
    nuance: "Divers gauche",
    tete_de_liste: {
      sexe: "F",
      nom: "MARTIN",
      prenom: "Claire",
      nationalite: "Française",
    },
  },
  circo: {
    code_circonscription: "35238",
    circonscription: "Rennes",
    code_departement: "35",
    departement: "Ille-et-Vilaine",
  },
  matched_candidate: null,
};

const mockItemWithCandidate: SearchResultItem = {
  ...mockItem,
  matched_candidate: {
    nom: "DUPONT",
    prenom: "Jean",
    ordre: 5,
  },
};

describe("ResultCard — rendu des infos liste", () => {
  it("affiche le libellé de la liste", () => {
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={vi.fn()} />);
    expect(screen.getByText(/RENNES POUR TOUS/i)).toBeInTheDocument();
  });

  it("affiche le nom de la circonscription", () => {
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={vi.fn()} />);
    // "Rennes" apparaît comme bouton ville (aria-label contient "Rennes")
    expect(screen.getByRole("button", { name: /Voir les listes de Rennes/i })).toBeInTheDocument();
  });

  it("affiche le département", () => {
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={vi.fn()} />);
    expect(screen.getByText(/Ille-et-Vilaine/i)).toBeInTheDocument();
  });

  it("affiche la nuance", () => {
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={vi.fn()} />);
    expect(screen.getByText(/Divers gauche/i)).toBeInTheDocument();
  });
});

describe("ResultCard — tête de liste", () => {
  it("affiche le nom de la tête de liste", () => {
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={vi.fn()} />);
    expect(screen.getByText(/MARTIN/i)).toBeInTheDocument();
    expect(screen.getByText(/Claire/i)).toBeInTheDocument();
  });
});

describe("ResultCard — candidat correspondant", () => {
  it("n'affiche pas de section candidat si matched_candidate est null", () => {
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={vi.fn()} />);
    expect(screen.queryByText(/DUPONT/i)).not.toBeInTheDocument();
  });

  it("affiche le candidat correspondant si présent", () => {
    render(
      <ResultCard item={mockItemWithCandidate} onCityClick={vi.fn()} onListClick={vi.fn()} />
    );
    expect(screen.getByText(/DUPONT/i)).toBeInTheDocument();
  });
});

describe("ResultCard — interactions", () => {
  it("appelle onCityClick au clic sur le nom de la ville", async () => {
    const user = userEvent.setup();
    const onCityClick = vi.fn();
    render(<ResultCard item={mockItem} onCityClick={onCityClick} onListClick={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Voir les listes de Rennes/i }));
    expect(onCityClick).toHaveBeenCalledWith("35238");
  });

  it("appelle onListClick au clic sur le nom de la liste", async () => {
    const user = userEvent.setup();
    const onListClick = vi.fn();
    render(<ResultCard item={mockItem} onCityClick={vi.fn()} onListClick={onListClick} />);
    await user.click(screen.getByRole("button", { name: /RENNES POUR TOUS/i }));
    expect(onListClick).toHaveBeenCalledWith("35238", 3);
  });
});
