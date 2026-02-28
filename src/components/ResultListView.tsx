"use client";

import { ResultCard } from "./ResultCard";
import { EmptyState } from "./EmptyState";
import type { SearchResultItem } from "@/types";
import type { ViewMode } from "./SearchBar";

type ResultListViewProps = {
  results: SearchResultItem[];
  query: string;
  viewMode: ViewMode;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onCityClick: (code: string) => void;
  onListClick: (code: string, panel: number) => void;
};

/** Skeleton d'une carte pendant le chargement */
function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 animate-pulse"
    >
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="h-4 w-2/3 bg-muted rounded" />
      <div className="h-3 w-1/2 bg-muted rounded" />
    </div>
  );
}

export function ResultListView({
  results,
  query,
  viewMode,
  isLoading,
  hasMore,
  onLoadMore,
  onCityClick,
  onListClick,
}: ResultListViewProps) {
  // État de chargement initial (pas encore de résultats)
  if (isLoading && results.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Chargement des résultats"
        className={
          viewMode === "cards"
            ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-3"
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Aucun résultat
  if (!isLoading && results.length === 0 && query.length >= 3) {
    return <EmptyState query={query} />;
  }

  // Résultats
  return (
    <div className="flex flex-col gap-4">
      {results.length > 0 && (
        <div
          className={
            viewMode === "cards"
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
          role="list"
          aria-label={`Résultats de recherche pour "${query}"`}
        >
          {results.map((item) => (
            <div
              key={`${item.liste.code_circonscription}-${item.liste.numero_panneau}`}
              role="listitem"
            >
              <ResultCard
                item={item}
                onCityClick={onCityClick}
                onListClick={onListClick}
              />
            </div>
          ))}
          {/* Squelettes supplémentaires pendant le chargement de plus */}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={`sk-${i}`} />
            ))}
        </div>
      )}

      {/* Bouton "Charger plus" */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            className="
              px-6 py-2 rounded-md border border-input
              text-sm font-medium text-foreground
              hover:bg-accent hover:text-accent-foreground
              transition-colors focus:outline-none focus:ring-2 focus:ring-ring
            "
          >
            Charger plus de résultats
          </button>
        </div>
      )}
    </div>
  );
}
