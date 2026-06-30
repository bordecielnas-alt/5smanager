import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, ClipboardCheck, BarChart3, Settings } from "lucide-react";
import { AccueilTab } from "@/components/tabs/AccueilTab";
import { AuditTab } from "@/components/tabs/AuditTab";
import { IndicateursTab } from "@/components/tabs/IndicateursTab";
import { ParametrageTab } from "@/components/tabs/ParametrageTab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "5S Manager — Gestion de la démarche 5S" },
      { name: "description", content: "Audits 5S, indicateurs et paramétrage des sites, UAP et GAP." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center text-accent-foreground font-bold">
              5S
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">5S Manager</h1>
              <p className="text-xs text-primary-foreground/70">Gestion de la démarche 5S</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="accueil" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="accueil" className="flex items-center gap-2 py-2.5">
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">Accueil</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2 py-2.5">
              <ClipboardCheck className="h-4 w-4" /> <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="indicateurs" className="flex items-center gap-2 py-2.5">
              <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Indicateurs</span>
            </TabsTrigger>
            <TabsTrigger value="parametrage" className="flex items-center gap-2 py-2.5">
              <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Paramétrage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accueil" className="mt-6"><AccueilTab /></TabsContent>
          <TabsContent value="audit" className="mt-6"><AuditTab /></TabsContent>
          <TabsContent value="indicateurs" className="mt-6"><IndicateursTab /></TabsContent>
          <TabsContent value="parametrage" className="mt-6"><ParametrageTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
