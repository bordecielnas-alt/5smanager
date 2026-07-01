import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { listAudits } from "@/lib/5s.functions";
import type { Audit, AuditScore } from "@/lib/5s-types";

type FilterKey = "categories" | "items" | "sites" | "uaps" | "gaps";

export function IndicateursTab() {
  const fetchList = useServerFn(listAudits);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [scores, setScores] = useState<AuditScore[]>([]);

  useEffect(() => {
    void (async () => {
      const r = await fetchList();
      setAudits(r.audits as Audit[]);
      setScores(r.scores as AuditScore[]);
    })();
  }, [fetchList]);

  const opts = useMemo(() => {
    const categories = new Set<string>();
    const items = new Set<string>();
    const sites = new Set<string>();
    const uaps = new Set<string>();
    const gaps = new Set<string>();
    scores.forEach((s) => { categories.add(s.category_name); items.add(s.item_label); });
    audits.forEach((a) => {
      if (a.site_name) sites.add(a.site_name);
      if (a.uap_name) uaps.add(a.uap_name);
      if (a.gap_name) gaps.add(a.gap_name);
    });
    return {
      categories: [...categories].sort(),
      items: [...items].sort(),
      sites: [...sites].sort(),
      uaps: [...uaps].sort(),
      gaps: [...gaps].sort(),
    };
  }, [audits, scores]);

  const [sel, setSel] = useState<Record<FilterKey, Set<string>>>({
    categories: new Set(), items: new Set(), sites: new Set(), uaps: new Set(), gaps: new Set(),
  });

  const toggle = (k: FilterKey, v: string) => {
    setSel((prev) => {
      const next = new Set(prev[k]);
      if (next.has(v)) next.delete(v); else next.add(v);
      return { ...prev, [k]: next };
    });
  };

  const filteredScores = useMemo(() => {
    const auditById = new Map(audits.map((a) => [a.id, a]));
    return scores.filter((s) => {
      const a = auditById.get(s.audit_id);
      if (!a) return false;
      if (sel.categories.size && !sel.categories.has(s.category_name)) return false;
      if (sel.items.size && !sel.items.has(s.item_label)) return false;
      if (sel.sites.size && (!a.site_name || !sel.sites.has(a.site_name))) return false;
      if (sel.uaps.size && (!a.uap_name || !sel.uaps.has(a.uap_name))) return false;
      if (sel.gaps.size && (!a.gap_name || !sel.gaps.has(a.gap_name))) return false;
      return true;
    });
  }, [scores, audits, sel]);

  const chartData = useMemo(() => {
    const groupBy: "item" | "category" = sel.items.size > 0 ? "item" : "category";
    const map = new Map<string, { name: string; total: number; count: number }>();
    filteredScores.forEach((s) => {
      const key = groupBy === "item" ? s.item_label : s.category_name;
      const e = map.get(key) ?? { name: key, total: 0, count: 0 };
      e.total += s.score;
      e.count += 1;
      map.set(key, e);
    });
    return [...map.values()].map((e) => ({
      name: e.name.length > 40 ? e.name.slice(0, 40) + "…" : e.name,
      moyenne: e.count ? Number((e.total / e.count).toFixed(2)) : 0,
    }));
  }, [filteredScores, sel.items]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Historique des audits</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Auditeur</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>UAP</TableHead>
                  <TableHead>GAP</TableHead>
                  <TableHead className="text-right">Total /100</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun audit enregistré</TableCell></TableRow>
                )}
                {audits.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">{new Date(a.created_at + "Z").toLocaleString("fr-FR")}</TableCell>
                    <TableCell>{a.auditor_name}</TableCell>
                    <TableCell>{a.site_name ?? "—"}</TableCell>
                    <TableCell>{a.uap_name ?? "—"}</TableCell>
                    <TableCell>{a.gap_name ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{a.total_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histogramme — scores moyens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            {(Object.keys(opts) as FilterKey[]).map((k) => (
              <div key={k}>
                <Label className="mb-2 block capitalize">{k}</Label>
                <ScrollArea className="h-32 rounded border p-2">
                  <div className="space-y-1">
                    {opts[k].length === 0 && <p className="text-xs text-muted-foreground">Aucune donnée</p>}
                    {opts[k].map((v) => (
                      <label key={v} className="flex items-start gap-2 text-xs cursor-pointer">
                        <Checkbox checked={sel[k].has(v)} onCheckedChange={() => toggle(k, v)} />
                        <span className="leading-tight">{v}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={80} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="moyenne" fill="oklch(0.78 0.16 65)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
