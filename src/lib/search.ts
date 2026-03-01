import { db } from "@/db/index";
import { sql } from "drizzle-orm";
import type { SearchResponse, SearchResultItem } from "@/types";

export type SearchParams = {
  q: string;
  page?: number;
  limit?: number;
};

/**
 * Recherche plein-texte avec unaccent sur tous les champs pertinents.
 * Si la requête contient plusieurs mots, chaque mot est recherché indépendamment
 * (logique AND inter-mots, OR intra-mot sur les champs).
 * Retourne des résultats au niveau liste avec tête de liste et candidat correspondant.
 */
export async function search(params: SearchParams): Promise<SearchResponse> {
  const { q, page = 1, limit = Math.min(params.limit ?? 20, 50) } = params;

  if (!q || q.trim().length < 3) {
    throw new Error("La recherche nécessite au moins 3 caractères.");
  }

  const term = q.trim();
  const offset = (page - 1) * limit;

  // Découpage en mots individuels : chaque mot doit être trouvé quelque part
  const words = term.split(/\s+/).filter(Boolean);

  // Pour chaque mot : condition OR sur tous les champs
  const perWordConditions = words.map((word) => {
    const pattern = `%${word}%`;
    return sql`(
      unaccent(ci.circonscription) ILIKE unaccent(${pattern})
      OR unaccent(ci.departement) ILIKE unaccent(${pattern})
      OR unaccent(l.libelle_liste) ILIKE unaccent(${pattern})
      OR unaccent(COALESCE(l.libelle_abrege, '')) ILIKE unaccent(${pattern})
      OR unaccent(COALESCE(l.nuance, '')) ILIKE unaccent(${pattern})
      OR EXISTS (
        SELECT 1 FROM candidats c_w
        WHERE c_w.code_circonscription = l.code_circonscription
          AND c_w.numero_panneau = l.numero_panneau
          AND unaccent(c_w.nom || ' ' || c_w.prenom) ILIKE unaccent(${pattern})
      )
    )`;
  });

  // Condition matched_candidate : le candidat dont le nom contient au moins un des mots
  const anyWordCandidateConditions = words.map((word) => {
    const pattern = `%${word}%`;
    return sql`unaccent(c_m.nom || ' ' || c_m.prenom) ILIKE unaccent(${pattern})`;
  });

  // AND sur tous les mots (tous doivent être trouvés)
  const whereClause = sql.join(perWordConditions, sql` AND `);
  // OR sur les mots pour la sous-requête candidat correspondant
  const anyWordCandidateClause = sql.join(anyWordCandidateConditions, sql` OR `);

  // Requête principale : récupère les listes + circo + tête de liste + candidat correspondant
  // On utilise du SQL brut pour bénéficier de unaccent()
  const rows = await db.execute(sql`
    WITH matching_listes AS (
      SELECT DISTINCT
        l.code_circonscription,
        l.numero_panneau,
        ci.code_departement,
        ci.circonscription
      FROM listes l
      JOIN circonscriptions ci ON ci.code_circonscription = l.code_circonscription
      WHERE ${whereClause}
    ),
    counted AS (
      SELECT COUNT(DISTINCT (code_circonscription, numero_panneau))::int AS total
      FROM matching_listes
    )
    SELECT
      ml.code_circonscription,
      ml.numero_panneau,
      -- Candidat correspondant : premier non-tête-de-liste dont le nom contient au moins un mot
      (
        SELECT jsonb_build_object('nom', c_m.nom, 'prenom', c_m.prenom, 'ordre', c_m.ordre)
        FROM candidats c_m
        WHERE c_m.code_circonscription = ml.code_circonscription
          AND c_m.numero_panneau = ml.numero_panneau
          AND NOT c_m.tete_de_liste
          AND (${anyWordCandidateClause})
        ORDER BY c_m.ordre
        LIMIT 1
      ) AS matched_candidate,
      l.libelle_abrege,
      l.libelle_liste,
      l.code_nuance,
      l.nuance,
      ci.circonscription,
      ci.code_departement,
      ci.departement,
      -- Tête de liste
      tl.sexe AS tl_sexe,
      tl.nom AS tl_nom,
      tl.prenom AS tl_prenom,
      tl.nationalite AS tl_nationalite,
      (SELECT total FROM counted) AS total
    FROM matching_listes ml
    JOIN listes l ON l.code_circonscription = ml.code_circonscription
      AND l.numero_panneau = ml.numero_panneau
    JOIN circonscriptions ci ON ci.code_circonscription = ml.code_circonscription
    LEFT JOIN candidats tl ON
      tl.code_circonscription = ml.code_circonscription
      AND tl.numero_panneau = ml.numero_panneau
      AND tl.tete_de_liste = TRUE
    ORDER BY ci.code_departement ASC, ci.circonscription ASC, ml.numero_panneau ASC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const rowsArray = rows.rows as Record<string, unknown>[];
  const total = rowsArray.length > 0 ? Number(rowsArray[0].total ?? 0) : 0;

  const results: SearchResultItem[] = rowsArray.map((row) => ({
    liste: {
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
    },
    circo: {
      code_circonscription: String(row.code_circonscription),
      circonscription: String(row.circonscription),
      code_departement: String(row.code_departement),
      departement: String(row.departement),
    },
    matched_candidate: row.matched_candidate
      ? (row.matched_candidate as { nom: string; prenom: string; ordre: number })
      : null,
  }));

  return {
    results,
    total,
    page,
    limit,
    has_more: offset + results.length < total,
  };
}
