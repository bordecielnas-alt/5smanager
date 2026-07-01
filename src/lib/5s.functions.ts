import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Type mirrors kept in sync with 5s-types.ts (client-safe).
export interface Site { id: string; name: string }
export interface Uap { id: string; site_id: string; name: string }
export interface Gap { id: string; uap_id: string; name: string }
export interface Category { id: string; name: string; position: number }
export interface Item { id: string; category_id: string; label: string; position: number }
export interface Audit {
  id: string;
  created_at: string;
  auditor_name: string;
  site_id: string | null;
  uap_id: string | null;
  gap_id: string | null;
  site_name: string | null;
  uap_name: string | null;
  gap_name: string | null;
  category_totals: Record<string, number>;
  total_score: number;
}
export interface AuditScore {
  id: string;
  audit_id: string;
  item_id: string | null;
  category_name: string;
  item_label: string;
  score: number;
}

// ---------- Reads ----------

export const getAll = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const conn = db();
  const sites = conn.prepare("SELECT id, name FROM sites ORDER BY name").all() as Site[];
  const uaps = conn.prepare("SELECT id, site_id, name FROM uaps ORDER BY name").all() as Uap[];
  const gaps = conn.prepare("SELECT id, uap_id, name FROM gaps ORDER BY name").all() as Gap[];
  const categories = conn
    .prepare("SELECT id, name, position FROM categories ORDER BY position")
    .all() as Category[];
  const items = conn
    .prepare("SELECT id, category_id, label, position FROM items ORDER BY position")
    .all() as Item[];
  return { sites, uaps, gaps, categories, items };
});

export const listAudits = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  const conn = db();
  const rowsA = conn.prepare("SELECT * FROM audits ORDER BY created_at DESC").all() as (Omit<
    Audit,
    "category_totals"
  > & { category_totals: string })[];
  const audits: Audit[] = rowsA.map((r) => ({
    ...r,
    category_totals: safeJson(r.category_totals),
  }));
  const scores = conn.prepare("SELECT * FROM audit_scores").all() as AuditScore[];
  return { audits, scores };
});

function safeJson(s: string): Record<string, number> {
  try { return JSON.parse(s ?? "{}"); } catch { return {}; }
}

// ---------- Sites ----------

export const createSite = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db, newId } = await import("./db.server");
    const id = newId();
    db().prepare("INSERT INTO sites (id, name) VALUES (?, ?)").run(id, data.name);
    return { id };
  });

export const updateSite = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string(), name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("UPDATE sites SET name = ? WHERE id = ?").run(data.name, data.id);
    return { ok: true };
  });

export const deleteSite = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("DELETE FROM sites WHERE id = ?").run(data.id);
    return { ok: true };
  });

// ---------- UAPs ----------

export const createUap = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ site_id: z.string(), name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db, newId } = await import("./db.server");
    const id = newId();
    db().prepare("INSERT INTO uaps (id, site_id, name) VALUES (?, ?, ?)").run(id, data.site_id, data.name);
    return { id };
  });

export const updateUap = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string(), name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("UPDATE uaps SET name = ? WHERE id = ?").run(data.name, data.id);
    return { ok: true };
  });

export const deleteUap = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("DELETE FROM uaps WHERE id = ?").run(data.id);
    return { ok: true };
  });

// ---------- GAPs ----------

export const createGap = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ uap_id: z.string(), name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db, newId } = await import("./db.server");
    const id = newId();
    db().prepare("INSERT INTO gaps (id, uap_id, name) VALUES (?, ?, ?)").run(id, data.uap_id, data.name);
    return { id };
  });

export const updateGap = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string(), name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("UPDATE gaps SET name = ? WHERE id = ?").run(data.name, data.id);
    return { ok: true };
  });

export const deleteGap = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string() }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("DELETE FROM gaps WHERE id = ?").run(data.id);
    return { ok: true };
  });

// ---------- Categories / Items (label edit only) ----------

export const updateCategory = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string(), name: z.string().trim().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("UPDATE categories SET name = ? WHERE id = ?").run(data.name, data.id);
    return { ok: true };
  });

export const updateItem = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string(), label: z.string().trim().min(1).max(500) }).parse(i))
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    db().prepare("UPDATE items SET label = ? WHERE id = ?").run(data.label, data.id);
    return { ok: true };
  });

// ---------- Save audit ----------

const saveAuditInput = z.object({
  auditor_name: z.string().trim().min(1).max(120),
  site_id: z.string().nullable(),
  uap_id: z.string().nullable(),
  gap_id: z.string().nullable(),
  site_name: z.string().nullable(),
  uap_name: z.string().nullable(),
  gap_name: z.string().nullable(),
  category_totals: z.record(z.string(), z.number()),
  total_score: z.number().int(),
  scores: z.array(
    z.object({
      item_id: z.string().nullable(),
      category_name: z.string(),
      item_label: z.string(),
      score: z.number().int().min(0).max(5),
    }),
  ),
});

export const saveAudit = createServerFn({ method: "POST" })
  .inputValidator((i) => saveAuditInput.parse(i))
  .handler(async ({ data }) => {
    const { db, newId } = await import("./db.server");
    const conn = db();
    const auditId = newId();
    const tx = conn.transaction(() => {
      conn
        .prepare(
          `INSERT INTO audits
           (id, auditor_name, site_id, uap_id, gap_id, site_name, uap_name, gap_name, category_totals, total_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          auditId,
          data.auditor_name,
          data.site_id,
          data.uap_id,
          data.gap_id,
          data.site_name,
          data.uap_name,
          data.gap_name,
          JSON.stringify(data.category_totals),
          data.total_score,
        );
      const ins = conn.prepare(
        `INSERT INTO audit_scores (id, audit_id, item_id, category_name, item_label, score)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );
      for (const s of data.scores) {
        ins.run(newId(), auditId, s.item_id, s.category_name, s.item_label, s.score);
      }
    });
    tx();
    return { id: auditId };
  });
