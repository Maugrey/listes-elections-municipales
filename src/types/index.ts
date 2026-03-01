export type Candidat = {
  ordre: number;
  sexe: "M" | "F";
  nom: string;
  prenom: string;
  nationalite: string | null;
  code_personnalite: string | null;
  cc: string | null;
  tete_de_liste: boolean;
};

export type TeteDeListe = {
  sexe: "M" | "F";
  nom: string;
  prenom: string;
  nationalite: string | null;
};

export type ListeResume = {
  code_circonscription: string;
  numero_panneau: number;
  libelle_abrege: string | null;
  libelle_liste: string;
  code_nuance: string | null;
  nuance: string | null;
  tete_de_liste: TeteDeListe;
};

export type ListeDetail = ListeResume & {
  candidats: Candidat[];
};

export type Circonscription = {
  code_circonscription: string;
  circonscription: string;
  code_departement: string;
  departement: string;
};

export type MatchedCandidate = {
  nom: string;
  prenom: string;
  ordre: number;
};

export type SearchResultItem = {
  liste: ListeResume;
  circo: Circonscription;
  matched_candidate: MatchedCandidate | null;
};

export type SearchResponse = {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
};

export type CityResponse = {
  circo: Circonscription;
  listes: ListeResume[];
};

export type ListResponse = {
  circo: Circonscription;
  liste: ListeDetail;
};
