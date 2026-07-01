// Server-only SQLite singleton. The .server.ts suffix prevents Vite from
// bundling this into the client. Imported from createServerFn handlers only.
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sites (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS uaps (
  id         TEXT PRIMARY KEY,
  site_id    TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS uaps_site_idx ON uaps(site_id);

CREATE TABLE IF NOT EXISTS gaps (
  id         TEXT PRIMARY KEY,
  uap_id     TEXT NOT NULL REFERENCES uaps(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS gaps_uap_idx ON gaps(uap_id);

CREATE TABLE IF NOT EXISTS categories (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS items (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS items_category_idx ON items(category_id);

CREATE TABLE IF NOT EXISTS audits (
  id               TEXT PRIMARY KEY,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  auditor_name     TEXT NOT NULL,
  site_id          TEXT,
  uap_id           TEXT,
  gap_id           TEXT,
  site_name        TEXT,
  uap_name         TEXT,
  gap_name         TEXT,
  category_totals  TEXT NOT NULL DEFAULT '{}',
  total_score      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS audits_date_idx ON audits(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_scores (
  id             TEXT PRIMARY KEY,
  audit_id       TEXT NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  item_id        TEXT,
  category_name  TEXT NOT NULL,
  item_label     TEXT NOT NULL,
  score          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS audit_scores_audit_idx ON audit_scores(audit_id);
`;

const DEFAULT_CATEGORIES: { name: string; items: string[] }[] = [
  {
    name: "TRI",
    items: [
      "Il n'y a pas d'éléments inutiles sur les postes de travail dans les zones de stockage",
      "Il n'y a pas de documentations en excès ou obsolètes",
      "Il n'y a pas d'éléments en mauvais état/hors d'état de fonctionnement pour lesquels aucune action n'est prévue",
      "Il n'y a pas d'éléments inutiles dans le reste de l'atelier",
    ],
  },
  {
    name: "RANGEMENT",
    items: [
      "Les documents et outils non utilisés sont rangés et clairement identifiés (Les tiroirs et armoires sont rangés et identifiés)",
      "Les matières et produits semi-finis sont rangés correctement dans les zones correspondantes",
      "Des poubelles sont disponibles et adaptées. Les règles de tri sont respectées",
      "Il n'y a pas d'obstacles à la circulation ou de risque sécurité",
    ],
  },
  {
    name: "NETTOYAGE",
    items: [
      "Le poste de travail et les zones de stockage sont propres",
      "Les abords du poste de travail sont propres",
      "Il y a du matériel de nettoyage adapté et à disposition dans l'atelier pour les machines et postes de travail",
      "Il n'y a pas de sources de salissure pour lesquelles aucune action n'est lancée",
    ],
  },
  {
    name: "STANDARD",
    items: [
      "Le standard de poste est affiché",
      "Le standard de poste est respecté",
      "Les écarts au standard sont justifiés",
      "Le standard est revu",
    ],
  },
  {
    name: "SUIVI",
    items: [
      "L'ensemble du personnel de la zone est sensibilisé et impliqué aux 5S",
      "Des audits sont réalisés chaque mois",
      "Le plan d'action de la zone est suivi et les délais respectés",
      "Des propositions d'amélioration sont régulièrement émises autour du 5S et des conditions de travail",
    ],
  },
];

function seedCategories(conn: Database.Database) {
  const row = conn.prepare("SELECT COUNT(*) AS c FROM categories").get() as { c: number };
  if (row.c > 0) return;
  const insCat = conn.prepare("INSERT INTO categories (id, name, position) VALUES (?, ?, ?)");
  const insItem = conn.prepare(
    "INSERT INTO items (id, category_id, label, position) VALUES (?, ?, ?, ?)",
  );
  const tx = conn.transaction(() => {
    DEFAULT_CATEGORIES.forEach((c, ci) => {
      const cid = randomUUID();
      insCat.run(cid, c.name, ci);
      c.items.forEach((label, ii) => insItem.run(randomUUID(), cid, label, ii));
    });
  });
  tx();
}

let _db: Database.Database | null = null;

function databasePath(): string {
  return process.env.DATABASE_PATH || ".data/5sproject.db";
}

function tryOpen(path: string): Database.Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  return new Database(path);
}

export function initializeDatabaseOnBoot(): void {
  const path = databasePath();
  console.log(`[db-init] DATABASE_PATH=${path}`);
  if (existsSync(path)) {
    console.log("[db-init] existing database detected, skipping");
    return;
  }
  console.log("[db-init] creating new database");
  const conn = db();
  conn.close();
  _db = null;
  console.log("[db-init] database initialized");
}

export function db(): Database.Database {
  if (_db) return _db;
  const primary = databasePath();
  let conn: Database.Database;
  try {
    conn = tryOpen(primary);
  } catch (err) {
    console.warn(`[db] cannot open ${primary} (${(err as Error).message}); falling back`);
    try {
      conn = tryOpen("/tmp/5sproject.db");
    } catch (err2) {
      console.warn(`[db] /tmp open failed (${(err2 as Error).message}); using :memory:`);
      conn = new Database(":memory:");
    }
  }
  conn.exec(SCHEMA);
  seedCategories(conn);
  _db = conn;
  return conn;
}

export function newId(): string {
  return randomUUID();
}
