import { db } from "@/db/index";
import { sql } from "drizzle-orm";
import type { CityResponse } from "@/types";

/**
 * Récupère les détails d'une circonscription avec toutes ses listes et têtes de liste.
 * Retourne null si la circonscription n'existe pas.
 */
export async function getCityDetail(code: string): Promise<CityResponse | null> {
  if (!code || !code.trim()) {
    throw new Error("Le code de circonscription est requis.");
  }

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
      tl.sexe       AS tl_sexe,
      tl.nom        AS tl_nom,
      tl.prenom     AS tl_prenom,
      tl.nationalite AS tl_nationalite
    FROM listes l
    JOIN circonscriptions ci ON ci.code_circonscription = l.code_circonscription
    LEFT JOIN candidats tl ON
      tl.code_circonscription = l.code_circonscription
      AND tl.numero_panneau = l.numero_panneau
      AND tl.tete_de_liste = TRUE
    WHERE l.code_circonscription = ${code}
    ORDER BY l.numero_panneau ASC
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

  const listes = rowsArray.map((row) => ({
    code_circonscription: String(row.code_circonscription),
    numero_panneau: Number(row.numero_panneau),
    libelle_abrege: row.libelle_abrege ? String(row.libelle_abrege) : null,
    libelle_liste: String(row.libelle_liste),
    code_nuance: row.code_nuance ? String(row.code_nuance) : null,
    nuance: row.nuance ? String(row.nuance) : null,
    tete_de_liste: {
      sexe: (row.tl_sexe as "M" | "F") ?? "F",
      nom: row.tl_nom ? String(row.tl_nom) : "—",
      prenom: row.tl_prenom ? String(row.tl_prenom) : "—",
      nationalite: row.tl_nationalite ? String(row.tl_nationalite) : null,
    },
  }));

  return { circo, listes };
}
