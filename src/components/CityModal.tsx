"use client";

import { X } from "lucide-react";
import { getLongestLabel } from "@/lib/utils";
import type { CityResponse } from "@/types";

type CityModalProps = {
  data: CityResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onListClick: (code: string, panel: number) => void;
};

export function CityModal({ data, isOpen, onClose, onListClick }: CityModalProps) {
  if (!isOpen || !data) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau */}
      <div className="
        relative z-50 w-full sm:max-w-lg mx-4 sm:mx-0
        max-h-[85vh] overflow-hidden
        rounded-t-2xl sm:rounded-2xl
        bg-card border border-border
        flex flex-col
        shadow-xl
      ">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {data.circo.code_departement} — {data.circo.departement}
            </p>
            <h2
              id="city-modal-title"
              className="text-xl font-bold text-foreground"
            >
              {data.circo.circonscription}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {data.listes.length} liste{data.listes.length > 1 ? "s" : ""} en compétition
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="
              flex items-center justify-center
              h-8 w-8 rounded-md
              text-muted-foreground hover:text-foreground hover:bg-accent
              transition-colors focus:outline-none focus:ring-2 focus:ring-ring
              shrink-0
            "
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Liste des listes */}
        <div
          className="overflow-y-auto p-4 flex flex-col gap-2"
          role="list"
          aria-label="Listes électorales"
        >
          {data.listes.map((liste) => {
            const label = getLongestLabel(liste.libelle_abrege, liste.libelle_liste);
            return (
              <div
                key={liste.numero_panneau}
                role="listitem"
                className="
                  flex items-start gap-3 p-3 rounded-lg
                  border border-border hover:border-primary/40
                  hover:bg-accent/30 transition-colors
                "
              >
                {/* Numéro de panneau */}
                <span className="
                  shrink-0 flex items-center justify-center
                  h-7 w-7 rounded-full
                  bg-primary text-primary-foreground
                  text-xs font-bold
                ">
                  {liste.numero_panneau}
                </span>

                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onListClick(liste.code_circonscription, liste.numero_panneau)}
                    aria-label={`Voir les candidats de ${label}`}
                    className="
                      text-sm font-medium text-foreground text-left
                      hover:text-primary hover:underline underline-offset-2
                      focus:outline-none focus:ring-2 focus:ring-ring rounded
                      w-full truncate block
                    "
                  >
                    {label}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {liste.tete_de_liste.prenom} {liste.tete_de_liste.nom}
                    {liste.nuance && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                        {liste.nuance}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
