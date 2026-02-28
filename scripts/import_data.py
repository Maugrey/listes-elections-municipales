#!/usr/bin/env python3
"""
Import CSV → PostgreSQL pour les élections municipales 2026.
Effectue un DROP + RELOAD complet à chaque exécution.
"""

import os
import sys
import time
import glob
from pathlib import Path
from dotenv import load_dotenv

# Charger .env.local depuis la racine du projet
root = Path(__file__).parent.parent
load_dotenv(root / ".env.local")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL manquant. Copier .env.local.example → .env.local et renseigner la valeur.")
    sys.exit(1)

try:
    import pandas as pd
    import psycopg2
    import psycopg2.extras
except ImportError as e:
    print(f"❌ Dépendance manquante : {e}")
    print("   Installer avec : pip install pandas psycopg2-binary python-dotenv")
    sys.exit(1)


def find_csv() -> Path:
    """Trouve le fichier CSV source dans data/."""
    pattern = str(root / "data" / "municipales-2026*.csv")
    files = sorted(glob.glob(pattern))
    if not files:
        print(f"❌ Aucun fichier CSV trouvé dans data/ (pattern: municipales-2026*.csv)")
        sys.exit(1)
    if len(files) > 1:
        print(f"⚠️  Plusieurs fichiers CSV trouvés, utilisation du plus récent : {files[-1]}")
    return Path(files[-1])


def detect_encoding(path: Path) -> str:
    """Détecte l'encodage du fichier (UTF-8 ou Latin-1)."""
    try:
        with open(path, encoding="utf-8") as f:
            f.read(1024)
        return "utf-8"
    except UnicodeDecodeError:
        return "latin-1"


def connect() -> psycopg2.extensions.connection:
    """Établit une connexion à PostgreSQL."""
    print("Connexion à la base de données...", end=" ")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    print("OK")
    return conn


def drop_and_create(conn: psycopg2.extensions.connection) -> None:
    """Supprime et recrée le schéma complet."""
    print("Suppression des tables existantes...", end=" ")
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS candidats CASCADE")
        cur.execute("DROP TABLE IF EXISTS listes CASCADE")
        cur.execute("DROP TABLE IF EXISTS circonscriptions CASCADE")
        print("OK")

        print("Activation des extensions PostgreSQL...", end=" ")
        cur.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        cur.execute("""
            CREATE OR REPLACE FUNCTION unaccent_immutable(text)
            RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
              SELECT unaccent('unaccent', $1)
            $$
        """)
        print("OK")

        print("Création des tables...", end=" ")
        cur.execute("""
            CREATE TABLE circonscriptions (
                code_circonscription VARCHAR(10) PRIMARY KEY,
                circonscription      TEXT        NOT NULL,
                code_departement     VARCHAR(5)  NOT NULL,
                departement          TEXT        NOT NULL
            )
        """)
        cur.execute("""
            CREATE TABLE listes (
                code_circonscription VARCHAR(10) NOT NULL REFERENCES circonscriptions,
                numero_panneau       INTEGER     NOT NULL,
                libelle_abrege       TEXT,
                libelle_liste        TEXT        NOT NULL,
                code_nuance          VARCHAR(20),
                nuance               TEXT,
                PRIMARY KEY (code_circonscription, numero_panneau)
            )
        """)
        cur.execute("""
            CREATE TABLE candidats (
                code_circonscription VARCHAR(10) NOT NULL,
                numero_panneau       INTEGER     NOT NULL,
                ordre                INTEGER     NOT NULL,
                sexe                 VARCHAR(1)  NOT NULL,
                nom                  TEXT        NOT NULL,
                prenom               TEXT        NOT NULL,
                nationalite          TEXT,
                code_personnalite    VARCHAR(20),
                cc                   VARCHAR(20),
                tete_de_liste        BOOLEAN     NOT NULL DEFAULT FALSE,
                PRIMARY KEY (code_circonscription, numero_panneau, ordre),
                FOREIGN KEY (code_circonscription, numero_panneau)
                    REFERENCES listes(code_circonscription, numero_panneau)
            )
        """)
        print("OK")

    conn.commit()


def create_indexes(conn: psycopg2.extensions.connection) -> None:
    """Crée les index de recherche après import (plus rapide)."""
    print("Création des index de recherche...", end=" ")
    with conn.cursor() as cur:
        cur.execute("""
            CREATE INDEX idx_circo_search ON circonscriptions
            USING gin (to_tsvector('simple', unaccent_immutable(circonscription || ' ' || departement)))
        """)
        cur.execute("""
            CREATE INDEX idx_listes_search ON listes
            USING gin (to_tsvector('simple', unaccent_immutable(
                libelle_liste || ' ' || COALESCE(libelle_abrege, '') || ' ' || COALESCE(nuance, '')
            )))
        """)
        cur.execute("""
            CREATE INDEX idx_candidats_search ON candidats
            USING gin (to_tsvector('simple', unaccent_immutable(nom || ' ' || prenom)))
        """)
        cur.execute("""
            CREATE INDEX idx_candidats_tete ON candidats (code_circonscription, numero_panneau)
            WHERE tete_de_liste = TRUE
        """)
    conn.commit()
    print("OK")


def load_csv(path: Path) -> pd.DataFrame:
    """Charge et nettoie le CSV source."""
    encoding = detect_encoding(path)
    print(f"Lecture du CSV ({encoding})...", end=" ")
    df = pd.read_csv(
        path,
        sep=";",
        encoding=encoding,
        dtype=str,
        keep_default_na=False,
    )
    # Remplacer les chaînes vides par NaN (→ NULL en DB)
    df = df.replace("", None)
    print(f"{len(df):,} lignes lues")
    return df


def import_circonscriptions(conn: psycopg2.extensions.connection, df: pd.DataFrame) -> int:
    """Import des circonscriptions (DISTINCT)."""
    print("Import des circonscriptions...", end=" ")
    circo_df = (
        df[["Code département", "Département", "Code circonscription", "Circonscription"]]
        .drop_duplicates(subset=["Code circonscription"])
    )
    rows = [
        (row["Code circonscription"], row["Circonscription"],
         row["Code département"], row["Département"])
        for _, row in circo_df.iterrows()
    ]
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO circonscriptions (code_circonscription, circonscription, code_departement, departement) VALUES %s",
            rows,
            page_size=5000,
        )
    conn.commit()
    print(f"{len(rows):,} insérées")
    return len(rows)


def import_listes(conn: psycopg2.extensions.connection, df: pd.DataFrame) -> int:
    """Import des listes (DISTINCT sur code_circo + panneau)."""
    print("Import des listes...", end=" ")
    liste_df = (
        df[["Code circonscription", "Numéro de panneau", "Libellé abrégé de liste",
            "Libellé de la liste", "Code nuance de liste", "Nuance de liste"]]
        .drop_duplicates(subset=["Code circonscription", "Numéro de panneau"])
    )
    # Filtrer les lignes sans numero_panneau valide
    liste_df = liste_df[pd.notna(liste_df["Num\u00e9ro de panneau"]) & (liste_df["Num\u00e9ro de panneau"] != "")]
    rows = [
        (
            row["Code circonscription"],
            int(float(row["Num\u00e9ro de panneau"])),
            row.get("Libell\u00e9 abr\u00e9g\u00e9 de liste") or None,
            row["Libell\u00e9 de la liste"],
            row.get("Code nuance de liste") or None,
            row.get("Nuance de liste") or None,
        )
        for _, row in liste_df.iterrows()
    ]
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """INSERT INTO listes
               (code_circonscription, numero_panneau, libelle_abrege, libelle_liste, code_nuance, nuance)
               VALUES %s""",
            rows,
            page_size=5000,
        )
    conn.commit()
    print(f"{len(rows):,} insérées")
    return len(rows)


def import_candidats(conn: psycopg2.extensions.connection, df: pd.DataFrame) -> int:
    """Import de tous les candidats."""
    print("Import des candidats...", end=" ")
    # Filtrer les lignes sans cles primaires valides
    valid_df = df[
        pd.notna(df["Num\u00e9ro de panneau"]) & (df["Num\u00e9ro de panneau"] != "") &
        pd.notna(df["Ordre"]) & (df["Ordre"] != "")
    ]
    rows = []
    for _, row in valid_df.iterrows():
        tete = row.get("T\u00eate de liste") == "OUI"
        rows.append((
            row["Code circonscription"],
            int(float(row["Num\u00e9ro de panneau"])),
            int(float(row["Ordre"])),
            row["Sexe"],
            row["Nom sur le bulletin de vote"],
            row["Prénom sur le bulletin de vote"],
            row.get("Nationalité"),
            row.get("Code personnalité"),
            row.get("CC"),
            tete,
        ))

    BATCH = 10000
    with conn.cursor() as cur:
        for i in range(0, len(rows), BATCH):
            psycopg2.extras.execute_values(
                cur,
                """INSERT INTO candidats
                   (code_circonscription, numero_panneau, ordre, sexe, nom, prenom,
                    nationalite, code_personnalite, cc, tete_de_liste)
                   VALUES %s""",
                rows[i : i + BATCH],
            )
            conn.commit()
    print(f"{len(rows):,} insérés")
    return len(rows)


def fix_tete_de_liste(conn: psycopg2.extensions.connection) -> int:
    """Fallback : met tete_de_liste=TRUE sur ordre=1 si aucun marqueur OUI."""
    print("Correction des têtes de liste manquantes...", end=" ")
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE candidats c
            SET tete_de_liste = TRUE
            WHERE c.ordre = 1
              AND NOT EXISTS (
                SELECT 1 FROM candidats c2
                WHERE c2.code_circonscription = c.code_circonscription
                  AND c2.numero_panneau = c.numero_panneau
                  AND c2.tete_de_liste = TRUE
              )
        """)
        count = cur.rowcount
    conn.commit()
    print(f"{count:,} corrigées")
    return count


def main() -> None:
    t0 = time.time()
    print("\n🗳️  Import données élections municipales 2026\n" + "=" * 50)

    csv_path = find_csv()
    print(f"Fichier source : {csv_path.name}")

    conn = connect()
    try:
        drop_and_create(conn)
        df = load_csv(csv_path)
        n_circo = import_circonscriptions(conn, df)
        n_listes = import_listes(conn, df)
        n_candidats = import_candidats(conn, df)
        n_fixed = fix_tete_de_liste(conn)
        create_indexes(conn)
    finally:
        conn.close()

    elapsed = time.time() - t0
    print(f"\n{'=' * 50}")
    print(f"✅ Import terminé en {elapsed:.1f}s")
    print(f"   → circonscriptions : {n_circo:>8,}")
    print(f"   → listes           : {n_listes:>8,}")
    print(f"   → candidats        : {n_candidats:>8,}")
    print(f"   → têtes corrigées  : {n_fixed:>8,}")


if __name__ == "__main__":
    main()
