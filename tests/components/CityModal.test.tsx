import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CityModal } from "@/components/CityModal";
import type { CityResponse } from "@/types";

const mockData: CityResponse = {
  circo: {
    code_circonscription: "35238",
    circonscription: "Rennes",
    code_departement: "35",
    departement: "Ille-et-Vilaine",
  },
  listes: [
    {
      code_circonscription: "35238",
      numero_panneau: 1,
      libelle_abrege: "RU",
      libelle_liste: "RENNES UNIE",
      code_nuance: "DVG",
      nuance: "Divers gauche",
      tete_de_liste: {
        sexe: "F",
        nom: "MARTIN",
        prenom: "Claire",
        nationalite: "Française",
      },
    },
    {
      code_circonscription: "35238",
      numero_panneau: 2,
      libelle_abrege: null,
      libelle_liste: "RENNES AVENIR",
      code_nuance: "DVD",
      nuance: "Divers droite",
      tete_de_liste: {
        sexe: "M",
        nom: "DUPONT",
        prenom: "Jean",
        nationalite: "Française",
      },
    },
  ],
};

describe("CityModal — rendu des infos", () => {
  it("affiche le nom de la circonscription", () => {
    render(
      <CityModal
        data={mockData}
        isOpen={true}
        onClose={vi.fn()}
        onListClick={vi.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: /Rennes/i })).toBeInTheDocument();
  });

  it("affiche le département", () => {
    render(
      <CityModal
        data={mockData}
        isOpen={true}
        onClose={vi.fn()}
        onListClick={vi.fn()}
      />
    );
    expect(screen.getByText(/Ille-et-Vilaine/i)).toBeInTheDocument();
  });

  it("affiche toutes les listes", () => {
    render(
      <CityModal
        data={mockData}
        isOpen={true}
        onClose={vi.fn()}
        onListClick={vi.fn()}
      />
    );
    expect(screen.getByText(/RENNES UNIE/i)).toBeInTheDocument();
    expect(screen.getByText(/RENNES AVENIR/i)).toBeInTheDocument();
  });
});

describe("CityModal — interactions", () => {
  it("appelle onClose au clic sur le bouton fermer", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CityModal
        data={mockData}
        isOpen={true}
        onClose={onClose}
        onListClick={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: /fermer|close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("appelle onListClick au clic sur un nom de liste", async () => {
    const user = userEvent.setup();
    const onListClick = vi.fn();
    render(
      <CityModal
        data={mockData}
        isOpen={true}
        onClose={vi.fn()}
        onListClick={onListClick}
      />
    );
    await user.click(screen.getByRole("button", { name: /RENNES UNIE/i }));
    expect(onListClick).toHaveBeenCalledWith("35238", 1);
  });
});

describe("CityModal — fermée", () => {
  it("n'affiche rien si isOpen=false", () => {
    const { container } = render(
      <CityModal
        data={mockData}
        isOpen={false}
        onClose={vi.fn()}
        onListClick={vi.fn()}
      />
    );
    expect(screen.queryByText(/RENNES UNIE/i)).not.toBeInTheDocument();
  });
});
