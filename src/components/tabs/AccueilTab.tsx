import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, BarChart3, Settings, Sparkles } from "lucide-react";

export function AccueilTab() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="bg-primary text-primary-foreground p-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-sm uppercase tracking-wide text-primary-foreground/70">Bienvenue</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Démarche 5S</h2>
          <p className="text-primary-foreground/80 max-w-2xl">
            Pilotez vos audits 5S sur le terrain. Évaluez chaque GAP selon les 5 rubriques
            <strong className="text-accent"> Tri, Rangement, Nettoyage, Standard, Suivi</strong>, suivez vos indicateurs
            et améliorez en continu vos conditions de travail.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <ClipboardCheck className="h-8 w-8 text-accent mb-3" />
            <h3 className="font-semibold mb-1">Réaliser un audit</h3>
            <p className="text-sm text-muted-foreground">Notez chaque item de 0 à 5 et obtenez un score sur 100.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <BarChart3 className="h-8 w-8 text-accent mb-3" />
            <h3 className="font-semibold mb-1">Suivre les indicateurs</h3>
            <p className="text-sm text-muted-foreground">Historique des audits et histogrammes filtrables.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Settings className="h-8 w-8 text-accent mb-3" />
            <h3 className="font-semibold mb-1">Paramétrer la structure</h3>
            <p className="text-sm text-muted-foreground">Gérez vos sites, UAP, GAP, catégories et items.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
