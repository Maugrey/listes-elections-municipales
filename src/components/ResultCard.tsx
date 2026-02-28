"use client";

import { getLongestLabel, formatEmptyField } from "@/lib/utils";
import type { SearchResultItem } from "@/types";

type ResultCardProps = {
  item: SearchResultItem;
  onCityClick: (code: string) => void;
  onListClick: (code: string, panel: number) => void;
};

export function ResultCard({ item, onCityClick, onListClick }: ResultCardProps) {
  const { liste, circo, matched_candidate } = item;
  const label = getLongestLabel(liste.libelle_abrege, liste.libelle_liste);

  return (
    <article className="
      rounded-lg border border-border bg-card text-card-foreground
      p-4 flex flex-col gap-3
      hover:border-primary/50 transition-colors
    ">
      {/* En-tête : département + ville */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {circo.code_departement} — {circo.departement}
          </span>
          <button
            type="button"
            onClick={() => onCityClick(circo.code_circonscription)}
            aria-label={`Voir les listes de ${circo.circonscription}`}
            className="
              block mt-0.5 text-base font-semibold text-foreground
              hover:text-primary underline-offset-2 hover:underline
              text-left focus:outline-none focus:ring-2 focus:ring-ring rounded
            "
          >
            {circo.circonscription}
          </button>
        </div>
        {liste.nuance && (
          <span className="
            inline-flex items-center px-2 py-0.5 rounded-full
            text-xs font-medium bg-secondary text-secondary-foreground
            shrink-0
          ">
            {liste.nuance}
          </span>
        )}
      </div>

      {/* Nom de la liste */}
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Panneau {liste.numero_panneau}</p>
        <button
          type="button"
          onClick={() => onListClick(liste.code_circonscription, liste.numero_panneau)}
          aria-label={`Voir les candidats de la liste ${label}`}
          className="
            text-sm font-medium text-foreground
            hover:text-primary underline-offset-2 hover:underline
            text-left focus:outline-none focus:ring-2 focus:ring-ring rounded
          "
        >
          {label}
        </button>
      </div>

      {/* Tête de liste */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Tête de liste :
        </span>{" "}
        {liste.tete_de_liste.prenom} {liste.tete_de_liste.nom}
        {liste.tete_de_liste.sexe === "F" && (
          <span className="ml-1 text-primary" aria-label="Femme">♀</span>
        )}
      </div>

      {/* Candidat correspondant (si la recherche a matché un candidat non-tête) */}
      {matched_candidate && (
        <div className="
          mt-1 px-3 py-2 rounded-md
          bg-primary/5 border border-primary/20
          text-xs
        ">
          <span className="text-muted-foreground">Candidat trouvé :</span>{" "}
          <span className="font-medium">
            {matched_candidate.prenom} {matched_candidate.nom}
          </span>{" "}
          <span className="text-muted-foreground">(n°{matched_candidate.ordre})</span>
        </div>
      )}
    </article>
  );
}
