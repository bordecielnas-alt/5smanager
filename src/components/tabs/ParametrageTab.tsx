import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAll,
  createSite, updateSite, deleteSite,
  createUap, updateUap, deleteUap,
  createGap, updateGap, deleteGap,
  updateCategory, updateItem,
} from "@/lib/5s.functions";
import type { Site, Uap, Gap, Category, Item } from "@/lib/5s-types";

export function ParametrageTab() {
  const fetchAll = useServerFn(getAll);
  const fnCreateSite = useServerFn(createSite);
  const fnUpdateSite = useServerFn(updateSite);
  const fnDeleteSite = useServerFn(deleteSite);
  const fnCreateUap = useServerFn(createUap);
  const fnUpdateUap = useServerFn(updateUap);
  const fnDeleteUap = useServerFn(deleteUap);
  const fnCreateGap = useServerFn(createGap);
  const fnUpdateGap = useServerFn(updateGap);
  const fnDeleteGap = useServerFn(deleteGap);
  const fnUpdateCategory = useServerFn(updateCategory);
  const fnUpdateItem = useServerFn(updateItem);

  const [sites, setSites] = useState<Site[]>([]);
  const [uaps, setUaps] = useState<Uap[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const reload = useCallback(async () => {
    const r = await fetchAll();
    setSites(r.sites); setUaps(r.uaps); setGaps(r.gaps);
    setCategories(r.categories); setItems(r.items);
  }, [fetchAll]);
  useEffect(() => { void reload(); }, [reload]);

  const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur");

  // SITES
  const [newSite, setNewSite] = useState("");
  const [editingSite, setEditingSite] = useState<{ id: string; name: string } | null>(null);
  const addSite = async () => {
    if (!newSite.trim()) return;
    try { await fnCreateSite({ data: { name: newSite.trim() } }); setNewSite(""); toast.success("Site créé"); reload(); } catch (e) { err(e); }
  };
  const saveSite = async () => {
    if (!editingSite) return;
    try { await fnUpdateSite({ data: editingSite }); setEditingSite(null); toast.success("Site mis à jour"); reload(); } catch (e) { err(e); }
  };
  const removeSite = async (id: string) => {
    if (!confirm("Supprimer ce site (et ses UAP/GAP) ?")) return;
    try { await fnDeleteSite({ data: { id } }); toast.success("Site supprimé"); reload(); } catch (e) { err(e); }
  };

  // UAPS
  const [newUap, setNewUap] = useState({ name: "", site_id: "" });
  const [editingUap, setEditingUap] = useState<{ id: string; name: string } | null>(null);
  const addUap = async () => {
    if (!newUap.name.trim() || !newUap.site_id) return toast.error("Site et nom requis");
    try { await fnCreateUap({ data: { name: newUap.name.trim(), site_id: newUap.site_id } }); setNewUap({ name: "", site_id: "" }); toast.success("UAP créée"); reload(); } catch (e) { err(e); }
  };
  const saveUap = async () => {
    if (!editingUap) return;
    try { await fnUpdateUap({ data: editingUap }); setEditingUap(null); reload(); } catch (e) { err(e); }
  };
  const removeUap = async (id: string) => {
    if (!confirm("Supprimer cette UAP (et ses GAP) ?")) return;
    try { await fnDeleteUap({ data: { id } }); reload(); } catch (e) { err(e); }
  };

  // GAPS
  const [newGap, setNewGap] = useState({ name: "", uap_id: "" });
  const [editingGap, setEditingGap] = useState<{ id: string; name: string } | null>(null);
  const addGap = async () => {
    if (!newGap.name.trim() || !newGap.uap_id) return toast.error("UAP et nom requis");
    try { await fnCreateGap({ data: { name: newGap.name.trim(), uap_id: newGap.uap_id } }); setNewGap({ name: "", uap_id: "" }); toast.success("GAP créé"); reload(); } catch (e) { err(e); }
  };
  const saveGap = async () => {
    if (!editingGap) return;
    try { await fnUpdateGap({ data: editingGap }); setEditingGap(null); reload(); } catch (e) { err(e); }
  };
  const removeGap = async (id: string) => {
    if (!confirm("Supprimer ce GAP ?")) return;
    try { await fnDeleteGap({ data: { id } }); reload(); } catch (e) { err(e); }
  };

  // CATEGORIES & ITEMS
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; label: string } | null>(null);
  const saveCat = async () => {
    if (!editingCat) return;
    try { await fnUpdateCategory({ data: editingCat }); setEditingCat(null); reload(); } catch (e) { err(e); }
  };
  const saveItem = async () => {
    if (!editingItem) return;
    try { await fnUpdateItem({ data: editingItem }); setEditingItem(null); reload(); } catch (e) { err(e); }
  };

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const uapName = (id: string) => uaps.find((u) => u.id === id)?.name ?? "—";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Sites</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Nom du site" value={newSite} onChange={(e) => setNewSite(e.target.value)} />
            <Button onClick={addSite}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
          </div>
          <ul className="divide-y rounded border">
            {sites.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun site</li>}
            {sites.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-2 gap-2">
                {editingSite?.id === s.id ? (
                  <>
                    <Input value={editingSite.name} onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={saveSite}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingSite(null)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm">{s.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingSite({ id: s.id, name: s.name })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeSite(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>UAP</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Select value={newUap.site_id} onValueChange={(v) => setNewUap({ ...newUap, site_id: v })}>
              <SelectTrigger><SelectValue placeholder="Site" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Nom de l'UAP" value={newUap.name} onChange={(e) => setNewUap({ ...newUap, name: e.target.value })} />
            <Button onClick={addUap}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
          </div>
          <ul className="divide-y rounded border">
            {uaps.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucune UAP</li>}
            {uaps.map((u) => (
              <li key={u.id} className="flex items-center justify-between p-2 gap-2">
                {editingUap?.id === u.id ? (
                  <>
                    <Input value={editingUap.name} onChange={(e) => setEditingUap({ ...editingUap, name: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={saveUap}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingUap(null)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{siteName(u.site_id)}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setEditingUap({ id: u.id, name: u.name })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeUap(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>GAP</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Select value={newGap.uap_id} onValueChange={(v) => setNewGap({ ...newGap, uap_id: v })}>
              <SelectTrigger><SelectValue placeholder="UAP" /></SelectTrigger>
              <SelectContent>{uaps.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} — {siteName(u.site_id)}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Nom du GAP" value={newGap.name} onChange={(e) => setNewGap({ ...newGap, name: e.target.value })} />
            <Button onClick={addGap}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
          </div>
          <ul className="divide-y rounded border">
            {gaps.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aucun GAP</li>}
            {gaps.map((g) => (
              <li key={g.id} className="flex items-center justify-between p-2 gap-2">
                {editingGap?.id === g.id ? (
                  <>
                    <Input value={editingGap.name} onChange={(e) => setEditingGap({ ...editingGap, name: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={saveGap}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingGap(null)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{uapName(g.uap_id)}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setEditingGap({ id: g.id, name: g.name })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeGap(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Catégories &amp; items</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded border p-3 space-y-2">
              <div className="flex items-center gap-2">
                {editingCat?.id === cat.id ? (
                  <>
                    <Input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} />
                    <Button size="icon" variant="ghost" onClick={saveCat}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingCat(null)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <h4 className="flex-1 font-semibold">{cat.name}</h4>
                    <Button size="icon" variant="ghost" onClick={() => setEditingCat({ id: cat.id, name: cat.name })}><Pencil className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
              <ul className="space-y-1">
                {items.filter((i) => i.category_id === cat.id).map((it) => (
                  <li key={it.id} className="flex items-start gap-2 text-sm">
                    {editingItem?.id === it.id ? (
                      <>
                        <Input value={editingItem.label} onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })} />
                        <Button size="icon" variant="ghost" onClick={saveItem}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingItem(null)}><X className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 leading-snug">• {it.label}</span>
                        <Button size="icon" variant="ghost" onClick={() => setEditingItem({ id: it.id, label: it.label })}><Pencil className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
