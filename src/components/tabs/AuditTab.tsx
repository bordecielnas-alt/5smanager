import { useState, useEffect, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAll, saveAudit } from "@/lib/5s.functions";
import type { Site, Uap, Gap, Category, Item } from "@/lib/5s-types";

export function AuditTab() {
  const fetchAll = useServerFn(getAll);
  const save = useServerFn(saveAudit);

  const [sites, setSites] = useState<Site[]>([]);
  const [uaps, setUaps] = useState<Uap[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [siteId, setSiteId] = useState<string>("");
  const [uapId, setUapId] = useState<string>("");
  const [gapId, setGapId] = useState<string>("");
  const [auditorName, setAuditorName] = useState<string>("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await fetchAll();
      setSites(r.sites); setUaps(r.uaps); setGaps(r.gaps);
      setCategories(r.categories); setItems(r.items);
    })();
  }, [fetchAll]);

  const filteredUaps = useMemo(() => uaps.filter((u) => u.site_id === siteId), [uaps, siteId]);
  const filteredGaps = useMemo(() => gaps.filter((g) => g.uap_id === uapId), [gaps, uapId]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    categories.forEach((c) => map.set(c.id, []));
    items.forEach((it) => {
      const arr = map.get(it.category_id);
      if (arr) arr.push(it);
    });
    return map;
  }, [categories, items]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    categories.forEach((c) => {
      const its = itemsByCategory.get(c.id) ?? [];
      totals[c.name] = its.reduce((sum, it) => sum + (scores[it.id] ?? 0), 0);
    });
    return totals;
  }, [categories, itemsByCategory, scores]);

  const grandTotal = useMemo(
    () => Object.values(categoryTotals).reduce((a, b) => a + b, 0),
    [categoryTotals],
  );

  const setScore = (itemId: string, value: number) => {
    setScores((prev) => ({ ...prev, [itemId]: value }));
  };

  const reset = () => {
    setScores({});
    setSiteId(""); setUapId(""); setGapId("");
  };

  const handleSave = async () => {
    if (!auditorName.trim()) return toast.error("Saisissez le nom de l'auditeur");
    if (!siteId || !uapId || !gapId) return toast.error("Sélectionnez Site, UAP et GAP");

    setSaving(true);
    try {
      const site = sites.find((s) => s.id === siteId);
      const uap = uaps.find((u) => u.id === uapId);
      const gap = gaps.find((g) => g.id === gapId);

      const rows = items.map((it) => {
        const cat = categories.find((c) => c.id === it.category_id);
        return {
          item_id: it.id,
          category_name: cat?.name ?? "",
          item_label: it.label,
          score: scores[it.id] ?? 0,
        };
      });

      await save({
        data: {
          auditor_name: auditorName.trim(),
          site_id: siteId,
          uap_id: uapId,
          gap_id: gapId,
          site_name: site?.name ?? null,
          uap_name: uap?.name ?? null,
          gap_name: gap?.name ?? null,
          category_totals: categoryTotals,
          total_score: grandTotal,
          scores: rows,
        },
      });

      toast.success(`Audit enregistré — Score ${grandTotal}/100`);
      reset();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Contexte de l'audit</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-2 block">Auditeur</Label>
            <Input placeholder="Votre nom" value={auditorName} onChange={(e) => setAuditorName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Site</Label>
            <Select value={siteId} onValueChange={(v) => { setSiteId(v); setUapId(""); setGapId(""); }}>
              <SelectTrigger><SelectValue placeholder="Choisir un site" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">UAP</Label>
            <Select value={uapId} onValueChange={(v) => { setUapId(v); setGapId(""); }} disabled={!siteId}>
              <SelectTrigger><SelectValue placeholder="Choisir une UAP" /></SelectTrigger>
              <SelectContent>
                {filteredUaps.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">GAP</Label>
            <Select value={gapId} onValueChange={setGapId} disabled={!uapId}>
              <SelectTrigger><SelectValue placeholder="Choisir un GAP" /></SelectTrigger>
              <SelectContent>
                {filteredGaps.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((cat) => {
          const its = itemsByCategory.get(cat.id) ?? [];
          const total = categoryTotals[cat.name] ?? 0;
          return (
            <Card key={cat.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <Badge variant="secondary" className="text-base font-semibold">
                  {total} / {its.length * 5}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                {its.map((it) => {
                  const val = scores[it.id] ?? 0;
                  return (
                    <div key={it.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-snug">{it.label}</p>
                        <span className="shrink-0 inline-flex h-7 min-w-7 px-2 items-center justify-center rounded bg-accent text-accent-foreground text-sm font-semibold">
                          {val}
                        </span>
                      </div>
                      <Slider
                        min={0} max={5} step={1}
                        value={[val]}
                        onValueChange={(v) => setScore(it.id, v[0] ?? 0)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-primary-foreground/70">Score total</p>
            <p className="text-4xl font-bold">
              {grandTotal} <span className="text-xl text-primary-foreground/70">/ 100</span>
            </p>
          </div>
          <Button size="lg" onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer l'audit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
