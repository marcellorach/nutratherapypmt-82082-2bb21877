import React, { useState } from "react";
import {
  ListTree,
  Sparkles,
  Network,
  Workflow,
  History,
  GitBranch,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useLocalizedField } from "@/hooks/useLocalizedField";
import {
  organograma,
  organogramaConvencoes,
  organogramaLastUpdated,
  type OrganogramaArea,
} from "@/data/projectOrganograma";
import { changelog } from "@/data/projectChangelog";
import OrganogramaCards from "@/components/administrador/organograma/OrganogramaCards";
import OrganogramaForceGraph from "@/components/administrador/organograma/OrganogramaForceGraph";
import OrganogramaDiagram from "@/components/administrador/organograma/OrganogramaDiagram";
import ChangelogTimeline from "@/components/administrador/organograma/ChangelogTimeline";

const OrganogramaTab: React.FC = () => {
  const [tab, setTab] = useState<string>("grafo");
  const [highlightedAreaKey, setHighlightedAreaKey] =
    useState<OrganogramaArea["key"] | null>(null);
  const { t } = useTranslation();
  const { localizedField } = useLocalizedField();

  const totalNodes = organograma.reduce((acc, a) => acc + 1 + (a.children?.length ?? 0), 0);
  const totalCrossLinks = organograma.reduce((acc, a) => acc + (a.linksTo?.length ?? 0), 0);

  const handleJumpToCards = (areaKey: string) => {
    setHighlightedAreaKey(areaKey as OrganogramaArea["key"]);
    setTab("cards");
    setTimeout(() => {
      const el = document.getElementById(`area-card-${areaKey}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <ListTree className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{t('organograma.pageTitle')}</h1>
            <Badge variant="secondary" className="text-xs">
              {t('organograma.updatedOn', { date: organogramaLastUpdated })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            {t('organograma.pageSubtitle')}{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              src/data/projectOrganograma.ts
            </code>
            . {t('organograma.updatedEach')}{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">CHANGELOG.md</code>.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 italic">
            Motor <strong>Senex AI</strong> · © <strong>PetMoreTime</strong> · 2025–presente · sucessor da arquitetura interna VetGraphRAG/VetMedGraph
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <GitBranch className="h-3 w-3" />
            {t('organograma.areasNodesLinks', { areas: organograma.length, nodes: totalNodes, crossLinks: totalCrossLinks })}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <History className="h-3 w-3" />
            {t('organograma.changelogEntries', { count: changelog.length })}
          </Badge>
        </div>
      </div>

      {/* Convenções Core */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('organograma.coreConventions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {organogramaConvencoes.map((c) => (
              <div key={c.label} className="flex gap-2 text-sm">
                <span className="font-semibold min-w-[140px] text-foreground">{localizedField(c, 'label')}:</span>
                <span className="text-muted-foreground">{localizedField(c, 'value')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="grafo" className="gap-2">
            <Workflow className="h-4 w-4" />
            {t('organograma.tabGraph')}
          </TabsTrigger>
          <TabsTrigger value="diagrama" className="gap-2">
            <Network className="h-4 w-4" />
            {t('organograma.tabDiagram')}
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <ListTree className="h-4 w-4" />
            {t('organograma.tabCards')}
          </TabsTrigger>
          <TabsTrigger value="changelog" className="gap-2">
            <History className="h-4 w-4" />
            {t('organograma.tabChangelog')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grafo">
          <OrganogramaForceGraph onJumpToCards={handleJumpToCards} />
        </TabsContent>

        <TabsContent value="diagrama">
          <OrganogramaDiagram onJumpToCards={handleJumpToCards} />
        </TabsContent>

        <TabsContent value="cards">
          <OrganogramaCards highlightedAreaKey={highlightedAreaKey} />
        </TabsContent>

        <TabsContent value="changelog">
          <ChangelogTimeline />
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="py-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>
            {t('organograma.footerSource')}{" "}
            <code className="bg-background px-1.5 py-0.5 rounded">
              src/data/projectOrganograma.ts
            </code>{" "}
            +{" "}
            <code className="bg-background px-1.5 py-0.5 rounded">
              src/data/projectChangelog.ts
            </code>
          </span>
          <span>
            {t('organograma.footerInstructions')}
          </span>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganogramaTab;
