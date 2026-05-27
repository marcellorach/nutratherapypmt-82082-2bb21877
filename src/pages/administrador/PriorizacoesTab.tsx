import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Info, KanbanSquare, FlaskConical, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrioritizationBoard from '@/components/administrador/priorizacoes/PrioritizationBoard';
import CohortRequestGenerator from '@/components/administrador/priorizacoes/CohortRequestGenerator';
import PopulationInsightsV0 from '@/components/administrador/priorizacoes/PopulationInsightsV0';
import SyntheticCohortsManager from '@/components/administrador/priorizacoes/SyntheticCohortsManager';
import MultiSourcePlayground from '@/components/administrador/priorizacoes/MultiSourcePlayground';
import { PRIORITIZATION_BOARD_LAST_UPDATED } from '@/data/prioritizationBoard';

const PriorizacoesTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 max-w-[1400px]">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            {t('prioritization.title', 'AI Scientist')}
          </h1>
          <p className="text-sm text-gray-600 max-w-3xl mt-1">
            {t(
              'prioritization.subtitle',
              'Fonte única do roadmap operacional. Ordem do board = ordem sugerida de execução. Cada card declara área, esforço, valor estratégico e dependências.',
            )}
          </p>
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 border rounded px-3 py-2 flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          {t('prioritization.lastUpdated', 'Atualizado em')}: <span className="font-mono">{PRIORITIZATION_BOARD_LAST_UPDATED}</span>
        </div>
      </header>

      <Tabs defaultValue="roadmap" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-3xl h-auto p-1 bg-gray-100">
          <TabsTrigger value="roadmap" className="flex-col gap-1 py-2 data-[state=active]:bg-white">
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-4 w-4" />
              <span className="font-semibold">{t('prioritization.sections.roadmap', 'Roadmap')}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">
              {t('prioritization.sections.roadmapHint', 'Kanban de execução')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="flex-col gap-1 py-2 data-[state=active]:bg-white">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="font-semibold">{t('prioritization.sections.cohorts', 'Geração de Cohorts')}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">
              {t('prioritization.sections.cohortsHint', 'Sugestão + sintéticos')}
            </span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex-col gap-1 py-2 data-[state=active]:bg-white">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="font-semibold">{t('prioritization.sections.analysis', 'Análises & Perfis')}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-normal">
              {t('prioritization.sections.analysisHint', 'Insights · Playground multi-fonte')}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="mt-6">
          <PrioritizationBoard />
        </TabsContent>

        <TabsContent value="cohorts" className="mt-6">
          <Tabs defaultValue="cohort" className="w-full">
            <TabsList>
              <TabsTrigger value="cohort">{t('prioritization.tabs.cohort', 'Gerador de Sugestão de Cohort')}</TabsTrigger>
              <TabsTrigger value="synthetic">{t('prioritization.tabs.synthetic', 'Cohorts sintéticos')}</TabsTrigger>
            </TabsList>
            <TabsContent value="cohort" className="mt-4">
              <CohortRequestGenerator />
            </TabsContent>
            <TabsContent value="synthetic" className="mt-4">
              <SyntheticCohortsManager />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <Tabs defaultValue="population" className="w-full">
            <TabsList>
              <TabsTrigger value="population">{t('prioritization.tabs.population', 'Population Insights v0')}</TabsTrigger>
              <TabsTrigger value="playground">{t('prioritization.tabs.playground', 'Playground multi-fonte')}</TabsTrigger>
            </TabsList>
            <TabsContent value="population" className="mt-4">
              <PopulationInsightsV0 />
            </TabsContent>
            <TabsContent value="playground" className="mt-4">
              <MultiSourcePlayground />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PriorizacoesTab;