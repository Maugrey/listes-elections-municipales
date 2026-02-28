"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CityModal } from "./CityModal";
import { ListModal } from "./ListModal";
import { buildModalUrl } from "@/lib/utils";
import type { CityResponse, ListResponse } from "@/types";

type ModalStackProps = {
  query: string;
};

/**
 * Gestionnaire de pile de modales basé sur l'URL.
 * Lit les searchParams ?city= et ?list=&panel= pour afficher les modales.
 * La fermeture / le retour modifie l'URL proprement.
 */
export function ModalStack({ query }: ModalStackProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cityCode = searchParams.get("city");
  const listCode = searchParams.get("list");
  const panelStr = searchParams.get("panel");
  const panelNum = panelStr ? parseInt(panelStr, 10) : null;

  const [cityData, setCityData] = useState<CityResponse | null>(null);
  const [listData, setListData] = useState<ListResponse | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // Charger les données de la ville quand cityCode change
  useEffect(() => {
    if (!cityCode) {
      setCityData(null);
      return;
    }
    setCityLoading(true);
    fetch(`/api/city/${encodeURIComponent(cityCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CityResponse | null) => setCityData(d))
      .catch(() => setCityData(null))
      .finally(() => setCityLoading(false));
  }, [cityCode]);

  // Charger les données de la liste quand listCode/panelNum changent
  useEffect(() => {
    if (!listCode || !panelNum) {
      setListData(null);
      return;
    }
    setListLoading(true);
    fetch(`/api/list/${encodeURIComponent(listCode)}/${panelNum}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ListResponse | null) => setListData(d))
      .catch(() => setListData(null))
      .finally(() => setListLoading(false));
  }, [listCode, panelNum]);

  /** Ferme tout */
  const handleClose = () => {
    router.push(buildModalUrl({ q: query }));
  };

  /** Retour : depuis liste → retourne à la ville si ouverte, sinon ferme */
  const handleListBack = () => {
    if (cityCode) {
      router.push(buildModalUrl({ q: query, city: cityCode }));
    } else {
      router.push(buildModalUrl({ q: query }));
    }
  };

  /** Depuis CityModal, ouvre une liste en empilant */
  const handleListClickFromCity = (code: string, panel: number) => {
    router.push(buildModalUrl({ q: query, city: cityCode ?? code, list: code, panel }));
  };

  return (
    <>
      {/* Modale Ville — affichée si cityCode présent et pas de modale liste */}
      <CityModal
        data={cityData}
        isOpen={!!cityCode && !listCode && !cityLoading}
        onClose={handleClose}
        onListClick={handleListClickFromCity}
      />

      {/* Modale Liste — affichée si listCode + panel présents */}
      <ListModal
        data={listData}
        isOpen={!!listCode && !!panelNum && !listLoading}
        onClose={handleClose}
        onBack={handleListBack}
      />
    </>
  );
}
