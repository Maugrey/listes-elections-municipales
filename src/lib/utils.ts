/**
 * Fonctions utilitaires partagées.
 */

/**
 * Retourne le libellé le plus long entre abrégé et complet.
 * Si identiques (ou l'un est vide), retourne le plus informatif.
 */
export function getLongestLabel(
  abrege: string | null | undefined,
  complet: string
): string {
  const a = abrege ?? "";
  if (!a) return complet;
  return a.length >= complet.length ? a : complet;
}

/**
 * Retourne "—" si la valeur est null, undefined ou chaîne blanche.
 */
export function formatEmptyField(
  val: string | null | undefined
): string {
  if (val == null) return "—";
  if (val.trim() === "") return "—";
  return val;
}

/**
 * Construit la query string de l'URL pour la navigation par modales.
 * Tous les paramètres sont optionnels sauf q.
 */
export function buildModalUrl(params: {
  q?: string;
  city?: string;
  list?: string;
  panel?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.q !== undefined) sp.set("q", params.q);
  if (params.city !== undefined) sp.set("city", params.city);
  if (params.list !== undefined) sp.set("list", params.list);
  if (params.panel !== undefined) sp.set("panel", String(params.panel));
  return `?${sp.toString()}`;
}
