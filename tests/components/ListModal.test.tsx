import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListModal } from "@/components/ListModal";
import type { ListResponse } from "@/types";

const mockData: ListResponse = {
  circo: {
    code_circonscription: "35238",
    circonscription: "Rennes",
    code_departement: "35",
    departement: "Ille-et-Vilaine",
  },
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
    candidats: [
      {
        ordre: 1,
        sexe: "F",
        nom: "MARTIN",
        prenom: "Claire",
        nationalite: "Française",
        code_personnalite: null,
        cc: null,
        tete_de_liste: true,
      },
      {
        ordre: 2,
        sexe: "M",
        nom: "DUPONT",
        prenom: "Jean",
        nationalite: "Française",
        code_personnalite: null,
        cc: null,
        tete_de_liste: false,
      },
    ],
  },
};

describe("ListModal — rendu des infos", () => {
  it("affiche la circonscription", () => {
    render(
      <ListModal data={mockData} isOpen={true} onClose={vi.fn()} onBack={vi.fn()} />
    );
    // La circonscription apparaît dans le sous-titre (pas dans le h2)
    const allRennes = screen.getAllByText(/Rennes/i);
    expect(allRennes.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le libellé de la liste", () => {
    render(
      <ListModal data={mockData} isOpen={true} onClose={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText(/RENNES POUR TOUS/i)).toBeInTheDocument();
  });

  it("affiche tous les candidats dans l'ordre", () => {
    render(
      <ListModal data={mockData} isOpen={true} onClose={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText(/MARTIN/i)).toBeInTheDocument();
    expect(screen.getByText(/DUPONT/i)).toBeInTheDocument();
    // Vérifier que MARTIN apparaît avant DUPONT
    const rows = screen.getAllByRole("row");
    const martinRow = rows.findIndex((r) => r.textContent?.includes("MARTIN"));
    const dupontRow = rows.findIndex((r) => r.textContent?.includes("DUPONT"));
    expect(martinRow).toBeLessThan(dupontRow);
  });
});

describe("ListModal — interactions", () => {
  it("appelle onClose au clic sur fermer", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ListModal data={mockData} isOpen={true} onClose={onClose} onBack={vi.fn()} />
    );
    await user.click(screen.getByRole("button", { name: /fermer|close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("appelle onBack au clic sur retour", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ListModal data={mockData} isOpen={true} onClose={vi.fn()} onBack={onBack} />
    );
    await user.click(screen.getByRole("button", { name: /retour/i }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe("ListModal — fermée", () => {
  it("n'affiche rien si isOpen=false", () => {
    render(
      <ListModal data={mockData} isOpen={false} onClose={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.queryByText(/RENNES POUR TOUS/i)).not.toBeInTheDocument();
  });
});
