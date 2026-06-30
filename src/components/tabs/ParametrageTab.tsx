import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Site, Uap, Gap, Category, Item } from "@/lib/5s-types";

export function ParametrageTab() {
  const [sites, setSites] = useState<Site[]>([]);
  const [uaps, setUaps] = useState<Uap[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const reload = async () => {
    const [s, u, g, c, i] = await Promise.all([
      supabase.from("sites").select("*").order("name"),
      supabase.from("uaps").select("*").order("name"),
      supabase.from("gaps").select("*").order("name"),
      supabase.from("categories").select("*").order("position"),
      supabase.from("items").select("*").order("position"),
    ]);
    setSites((s.data ?? []) as Site[]);
    setUaps((u.data ?? []) as Uap[]);
    setGaps((g.data ?? []) as Gap[]);
    setCategories((c.data ?? []) as Category[]);
    setItems((i.data ?? []) as Item[]);
  };
  useEffect(() => { void reload(); }, []);

  // SITES
  const [newSite, setNewSite] = useState("");
  const [editingSite, setEditingSite] = useState<{ id: string; name: string } | null>(null);

  const addSite = async () => {
    if (!newSite.trim()) return;
    const { error } = await supabase.from("sites").insert({ name: newSite.trim() });
    if (error) return toast.error(error.message);
    setNewSite(""); toast.success("Site créé"); reload();
  };
  const saveSite = async () => {
    if (!editingSite) return;
    const { error } = await supabase.from("sites").update({ name: editingSite.name }).eq("id", editingSite.id);
    if (error) return toast.error(error.message);
    setEditingSite(null); toast.success("Site mis à jour"); reload();
  };
  const deleteSite = async (id: string) => {
    if (!confirm("Supprimer ce site (et ses UAP/GAP) ?")) return;
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Site supprimé"); reload();
  };

  // UAPS
  const [newUap, setNewUap] = useState({ name: "", site_id: "" });
  const [editingUap, setEditingUap] = useState<{ id: string; name: string } | null>(null);
  const addUap = async () => {
    if (!newUap.name.trim() || !newUap.site_id) return toast.error("Site et nom requis");
    const { error } = await supabase.from("uaps").insert({ name: newUap.name.trim(), site_id: newUap.site_id });
    if (error) return toast.error(error.message);
    setNewUap({ name: "", site_id: "" }); toast.success("UAP créée"); reload();
  };
  const saveUap = async () => {
    if (!editingUap) return;
    const { error } = await supabase.from("uaps").update({ name: editingUap.name }).eq("id", editingUap.id);
    if (error) return toast.error(error.message);
    setEditingUap(null); reload();
  };
  const deleteUap = async (id: string) => {
    if (!confirm("Supprimer cette UAP (et ses GAP) ?")) return;
    const { error } = await supabase.from("uaps").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  // GAPS
  const [newGap, setNewGap] = useState({ name: "", uap_id: "" });
  const [editingGap, setEditingGap] = useState<{ id: string; name: string } | null>(null);
  const addGap = async () => {
    if (!newGap.name.trim() || !newGap.uap_id) return toast.error("UAP et nom requis");
    const { error } = await supabase.from("gaps").insert({ name: newGap.name.trim(), uap_id: newGap.uap_id });
    if (error) return toast.error(error.message);
    setNewGap({ name: "", uap_id: "" }); toast.success("GAP créé"); reload();
  };
  const saveGap = async () => {
    if (!editingGap) return;
    const { error } = await supabase.from("gaps").update({ name: editingGap.name }).eq("id", editingGap.id);
    if (error) return toast.error(error.message);
    setEditingGap(null); reload();
  };
  const deleteGap = async (id: string) => {
    if (!confirm("Supprimer ce GAP ?")) return;
    const { error } = await supabase.from("gaps").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  // CATEGORIES & ITEMS
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; label: string } | null>(null);
  const saveCat = async () => {
    if (!editingCat) return;
    const { error } = await supabase.from("categories").update({ name: editingCat.name }).eq("id", editingCat.id);
    if (error) return toast.error(error.message);
    setEditingCat(null); reload();
  };
  const saveItem = async () => {
    if (!editingItem) return;
    const { error } = await supabase.from("items").update({ label: editingItem.label }).eq("id", editingItem.id);
    if (error) return toast.error(error.message);
    setEditingItem(null); reload();
  };

  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const uapName = (id: string) => uaps.find((u) => u.id === id)?.name ?? "—";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* SITES */}
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
                    <Button size="icon" variant="ghost" onClick={() => deleteSite(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* UAPS */}
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
                    <Button size="icon" variant="ghost" onClick={() => deleteUap(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* GAPS */}
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
                    <Button size="icon" variant="ghost" onClick={() => deleteGap(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CATEGORIES & ITEMS */}
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
