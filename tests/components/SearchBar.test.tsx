import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/SearchBar";

describe("SearchBar — rendu", () => {
  it("affiche un champ de saisie", () => {
    render(<SearchBar value="" onChange={vi.fn()} viewMode="list" onViewModeChange={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("affiche un placeholder", () => {
    render(<SearchBar value="" onChange={vi.fn()} viewMode="list" onViewModeChange={vi.fn()} />);
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("placeholder");
  });

  it("affiche le bouton bascule liste/cartes", () => {
    render(<SearchBar value="" onChange={vi.fn()} viewMode="list" onViewModeChange={vi.fn()} />);
    // Au moins un bouton doit être présent pour le toggle
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});

describe("SearchBar — saisie", () => {
  it("appelle onChange lors de la saisie", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} viewMode="list" onViewModeChange={vi.fn()} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "r");
    expect(onChange).toHaveBeenCalled();
  });

  it("affiche la valeur passée en prop", () => {
    render(<SearchBar value="rennes" onChange={vi.fn()} viewMode="list" onViewModeChange={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("rennes");
  });
});

describe("SearchBar — bascule vue", () => {
  it("appelle onViewModeChange lors du clic sur le bouton", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();
    render(
      <SearchBar value="" onChange={vi.fn()} viewMode="list" onViewModeChange={onViewModeChange} />
    );
    // Clic sur le bouton toggle
    const toggleBtn = screen.getByRole("button", { name: /carte|grille|vue/i });
    await user.click(toggleBtn);
    expect(onViewModeChange).toHaveBeenCalled();
  });

  it("affiche l'icône correspondant au mode cartes quand viewMode='cards'", () => {
    render(<SearchBar value="" onChange={vi.fn()} viewMode="cards" onViewModeChange={vi.fn()} />);
    // Le bouton doit être présent
    expect(screen.getByRole("button", { name: /liste/i })).toBeInTheDocument();
  });
});
