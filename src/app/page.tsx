"use client";

import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar, type ViewMode } from "@/components/SearchBar";
import { ResultListView } from "@/components/ResultListView";
import { ModalStack } from "@/components/ModalStack";
import { buildModalUrl } from "@/lib/utils";
import type { SearchResponse, SearchResultItem } from "@/types";

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Lance la recherche (remplace les résultats existants) */
  const runSearch = useCallback(async (q: string, pg = 1) => {
    if (q.trim().length < 3) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&page=${pg}&limit=20`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SearchResponse = await res.json();
      setResults(pg === 1 ? data.results : (prev) => [...prev, ...data.results]);
      setTotal(data.total);
      setPage(pg);
      setHasMore(data.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Debounce sur la saisie */
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(1);
    // Sync URL
    router.replace(buildModalUrl({ q: val }), { scroll: false });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(val, 1);
    }, 300);
  };

  /** Charge la page suivante */
  const handleLoadMore = () => runSearch(query, page + 1);

  /** Ouvre la modale ville */
  const handleCityClick = (code: string) => {
    router.push(buildModalUrl({ q: query, city: code }));
  };

  /** Ouvre la modale liste */
  const handleListClick = (code: string, panel: number) => {
    router.push(buildModalUrl({ q: query, list: code, panel }));
  };

  // Recherche initiale si q est dans l'URL au montage
  useEffect(() => {
    if (initialQ.trim().length >= 3) runSearch(initialQ, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header institutionnel */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              République Française
            </p>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              Élections Municipales 2026
            </h1>
            <p className="text-sm text-muted-foreground">
              Candidatures — Tour 1
            </p>
          </div>
          {/* ThemeToggle sera injecté ici par le layout */}
        </div>
      </header>

      {/* Contenu principal */}
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col gap-6">
        {/* Barre de recherche */}
        <div className="flex flex-col gap-1">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isLoading={isLoading}
          />
          {total > 0 && query.length >= 3 && (
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString("fr-FR")} liste{total > 1 ? "s" : ""} trouvée
              {total > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Résultats */}
        <ResultListView
          results={results}
          query={query}
          viewMode={viewMode}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onCityClick={handleCityClick}
          onListClick={handleListClick}
        />

        {/* Pile de modales (ville + liste) pilotée par l'URL */}
        <ModalStack query={query} />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
