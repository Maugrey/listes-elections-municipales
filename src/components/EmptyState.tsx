type EmptyStateProps = {
  query: string;
};

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-16 text-center gap-3"
    >
      <span className="text-4xl" aria-hidden="true">🗳️</span>
      <p className="text-base font-medium text-foreground">
        Aucun résultat pour{" "}
        <span className="text-primary">« {query} »</span>
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Essayez avec un autre nom de commune, de liste ou de candidat.
      </p>
    </div>
  );
}
