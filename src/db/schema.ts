import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  primaryKey,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const circonscriptions = pgTable(
  "circonscriptions",
  {
    code_circonscription: varchar("code_circonscription", { length: 10 }).primaryKey(),
    circonscription: text("circonscription").notNull(),
    code_departement: varchar("code_departement", { length: 5 }).notNull(),
    departement: text("departement").notNull(),
  },
  (table) => ({
    searchIdx: index("idx_circo_search").using(
      "gin",
      sql`to_tsvector('simple', unaccent(${table.circonscription} || ' ' || ${table.departement}))`
    ),
  })
);

export const listes = pgTable(
  "listes",
  {
    code_circonscription: varchar("code_circonscription", { length: 10 })
      .notNull()
      .references(() => circonscriptions.code_circonscription),
    numero_panneau: integer("numero_panneau").notNull(),
    libelle_abrege: text("libelle_abrege"),
    libelle_liste: text("libelle_liste").notNull(),
    code_nuance: varchar("code_nuance", { length: 20 }),
    nuance: text("nuance"),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.code_circonscription, table.numero_panneau],
    }),
    searchIdx: index("idx_listes_search").using(
      "gin",
      sql`to_tsvector('simple', unaccent(${table.libelle_liste} || ' ' || coalesce(${table.libelle_abrege}, '') || ' ' || coalesce(${table.nuance}, '')))`
    ),
  })
);

export const candidats = pgTable(
  "candidats",
  {
    code_circonscription: varchar("code_circonscription", { length: 10 }).notNull(),
    numero_panneau: integer("numero_panneau").notNull(),
    ordre: integer("ordre").notNull(),
    sexe: varchar("sexe", { length: 1 }).notNull(),
    nom: text("nom").notNull(),
    prenom: text("prenom").notNull(),
    nationalite: text("nationalite"),
    code_personnalite: varchar("code_personnalite", { length: 20 }),
    cc: varchar("cc", { length: 20 }),
    tete_de_liste: boolean("tete_de_liste").notNull().default(false),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.code_circonscription, table.numero_panneau, table.ordre],
    }),
    fk: foreignKey({
      columns: [table.code_circonscription, table.numero_panneau],
      foreignColumns: [listes.code_circonscription, listes.numero_panneau],
    }),
    searchIdx: index("idx_candidats_search").using(
      "gin",
      sql`to_tsvector('simple', unaccent(${table.nom} || ' ' || ${table.prenom}))`
    ),
    teteIdx: index("idx_candidats_tete").on(
      table.code_circonscription,
      table.numero_panneau
    ),
  })
);
