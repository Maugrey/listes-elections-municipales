import { db } from "@/db/index";
import { sql } from "drizzle-orm";
import type { ListResponse } from "@/types";

/**
 * Récupère les détails complets d'une liste avec tous ses candidats triés par ordre.
 * Retourne null si la liste n'existe pas.
 */
export async function getListDetail(
  code: string,
  panel: number
): Promise<ListResponse | null> {
  if (!code || !code.trim()) throw new Error("Le code de circonscription est requis.");
  if (!Number.isInteger(panel) || panel < 1) throw new Error("Le numéro de panneau est invalide.");

  const rows = await db.execute(sql`
    SELECT
      ci.code_circonscription,
      ci.circonscription,
      ci.code_departement,
      ci.departement,
      l.numero_panneau,
      l.libelle_abrege,
      l.libelle_liste,
      l.code_nuance,
      l.nuance,
      c.ordre,
      c.sexe,
      c.nom,
      c.prenom,
      c.nationalite,
      c.code_personnalite,
      c.cc,
      c.tete_de_liste,
      -- Tête de liste de la liste
      tl.sexe       AS tl_sexe,
      tl.nom        AS tl_nom,
      tl.prenom     AS tl_prenom,
      tl.nationalite AS tl_nationalite
    FROM listes l
    JOIN circonscriptions ci ON ci.code_circonscription = l.code_circonscription
    JOIN candidats c ON
      c.code_circonscription = l.code_circonscription
      AND c.numero_panneau = l.numero_panneau
    LEFT JOIN candidats tl ON
      tl.code_circonscription = l.code_circonscription
      AND tl.numero_panneau = l.numero_panneau
      AND tl.tete_de_liste = TRUE
    WHERE l.code_circonscription = ${code}
      AND l.numero_panneau = ${panel}
    ORDER BY c.ordre ASC
  `);

  const rowsArray = rows as Record<string, unknown>[];
  if (rowsArray.length === 0) return null;

  const first = rowsArray[0];

  const circo = {
    code_circonscription: String(first.code_circonscription),
    circonscription: String(first.circonscription),
    code_departement: String(first.code_departement),
    departement: String(first.departement),
  };

  const candidats = rowsArray.map((row) => ({
    ordre: Number(row.ordre),
    sexe: (row.sexe as "M" | "F"),
    nom: String(row.nom),
    prenom: String(row.prenom),
    nationalite: row.nationalite ? String(row.nationalite) : null,
    code_personnalite: row.code_personnalite ? String(row.code_personnalite) : null,
    cc: row.cc ? String(row.cc) : null,
    tete_de_liste: Boolean(row.tete_de_liste),
  }));

  const liste = {
    code_circonscription: String(first.code_circonscription),
    numero_panneau: Number(first.numero_panneau),
    libelle_abrege: first.libelle_abrege ? String(first.libelle_abrege) : null,
    libelle_liste: String(first.libelle_liste),
    code_nuance: first.code_nuance ? String(first.code_nuance) : null,
    nuance: first.nuance ? String(first.nuance) : null,
    tete_de_liste: {
      sexe: (first.tl_sexe as "M" | "F") ?? "F",
      nom: first.tl_nom ? String(first.tl_nom) : "—",
      prenom: first.tl_prenom ? String(first.tl_prenom) : "—",
      nationalite: first.tl_nationalite ? String(first.tl_nationalite) : null,
    },
    candidats,
  };

  return { circo, liste };
}
