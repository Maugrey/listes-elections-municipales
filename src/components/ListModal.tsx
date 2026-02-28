"use client";

import { ArrowLeft, X } from "lucide-react";
import { getLongestLabel, formatEmptyField } from "@/lib/utils";
import type { ListResponse } from "@/types";

type ListModalProps = {
  data: ListResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
};

export function ListModal({ data, isOpen, onClose, onBack }: ListModalProps) {
  if (!isOpen || !data) return null;

  const { circo, liste } = data;
  const label = getLongestLabel(liste.libelle_abrege, liste.libelle_liste);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau */}
      <div className="
        relative z-50 w-full sm:max-w-2xl mx-4 sm:mx-0
        max-h-[90vh] overflow-hidden
        rounded-t-2xl sm:rounded-2xl
        bg-card border border-border
        flex flex-col
        shadow-xl
      ">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
          <div className="flex items-start gap-3">
            {/* Bouton Retour */}
            <button
              type="button"
              onClick={onBack}
              aria-label="Retour"
              className="
                flex items-center justify-center mt-1
                h-7 w-7 rounded-md shrink-0
                text-muted-foreground hover:text-foreground hover:bg-accent
                transition-colors focus:outline-none focus:ring-2 focus:ring-ring
              "
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                {circo.code_departement} — {circo.departement} · {circo.circonscription}
              </p>
              <h2 id="list-modal-title" className="text-lg font-bold text-foreground leading-snug">
                {label}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  Panneau {liste.numero_panneau}
                </span>
                {liste.nuance && (
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                    {liste.nuance}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="
              flex items-center justify-center
              h-8 w-8 rounded-md shrink-0
              text-muted-foreground hover:text-foreground hover:bg-accent
              transition-colors focus:outline-none focus:ring-2 focus:ring-ring
            "
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Tableau des candidats */}
        <div className="overflow-y-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground w-10">
                  N°
                </th>
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground w-6">
                  Sx
                </th>
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground">
                  Nom
                </th>
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground">
                  Prénom
                </th>
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Nationalité
                </th>
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Personnalité
                </th>
                <th scope="col" className="py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">
                  CC
                </th>
              </tr>
            </thead>
            <tbody>
              {liste.candidats.map((c) => (
                <tr
                  key={c.ordre}
                  className={`
                    border-b border-border/50 hover:bg-accent/20 transition-colors
                    ${c.tete_de_liste ? "font-medium" : ""}
                  `}
                >
                  <td className="py-2 pr-3 text-muted-foreground text-xs">
                    {c.ordre}
                    {c.tete_de_liste && (
                      <span className="ml-1 text-primary" title="Tête de liste" aria-label="Tête de liste">★</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground text-xs">
                    {c.sexe}
                  </td>
                  <td className="py-2 pr-3 font-medium">{c.nom}</td>
                  <td className="py-2 pr-3">{c.prenom}</td>
                  <td className="py-2 pr-3 text-muted-foreground hidden sm:table-cell">
                    {formatEmptyField(c.nationalite)}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground hidden md:table-cell">
                    {formatEmptyField(c.code_personnalite)}
                  </td>
                  <td className="py-2 text-muted-foreground hidden md:table-cell">
                    {formatEmptyField(c.cc)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
