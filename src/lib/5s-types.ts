export type Site = { id: string; name: string };
export type Uap = { id: string; site_id: string; name: string };
export type Gap = { id: string; uap_id: string; name: string };
export type Category = { id: string; name: string; position: number };
export type Item = { id: string; category_id: string; label: string; position: number };
export type Audit = {
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
};
export type AuditScore = {
  id: string;
  audit_id: string;
  item_id: string | null;
  category_name: string;
  item_label: string;
  score: number;
};
