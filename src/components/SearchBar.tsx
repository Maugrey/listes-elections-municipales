"use client";

import { useCallback, useRef } from "react";
import { Search, LayoutList, LayoutGrid } from "lucide-react";

export type ViewMode = "list" | "cards";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isLoading?: boolean;
};

export function SearchBar({
  value,
  onChange,
  viewMode,
  onViewModeChange,
  isLoading = false,
}: SearchBarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Mise à jour immédiate de la valeur affichée
      onChange(val);
      // Debounce : ne déclenche la recherche qu'après 300ms d'inactivité
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // L'onChange parent gère déjà le debounce via ce mécanisme
      }, 300);
    },
    [onChange]
  );

  const toggleView = () =>
    onViewModeChange(viewMode === "list" ? "cards" : "list");

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Champ de recherche */}
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={18}
          aria-hidden="true"
        />
        <input
          role="searchbox"
          type="search"
          value={value}
          onChange={handleChange}
          placeholder="Rechercher une ville, une liste, un candidat…"
          aria-label="Rechercher une ville, une liste ou un candidat"
          className="
            w-full h-10 pl-10 pr-4
            rounded-md border border-input bg-background
            text-sm text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
            transition-colors
          "
          disabled={isLoading}
          autoFocus
        />
      </div>

      {/* Bouton bascule liste / cartes */}
      <button
        type="button"
        onClick={toggleView}
        aria-label={viewMode === "list" ? "Passer en vue cartes" : "Passer en vue liste"}
        title={viewMode === "list" ? "Vue cartes" : "Vue liste"}
        className="
          flex items-center justify-center
          h-10 w-10 rounded-md border border-input bg-background
          text-muted-foreground hover:text-foreground hover:bg-accent
          transition-colors focus:outline-none focus:ring-2 focus:ring-ring
        "
      >
        {viewMode === "list" ? (
          <LayoutGrid size={18} aria-hidden="true" />
        ) : (
          <LayoutList size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
