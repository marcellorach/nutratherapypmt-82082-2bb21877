import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrioritizationBoard from '@/components/administrador/priorizacoes/PrioritizationBoard';
import CohortRequestGenerator from '@/components/administrador/priorizacoes/CohortRequestGenerator';
import RoleViewEditor from '@/components/administrador/priorizacoes/RoleViewEditor';
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

      <Tabs defaultValue="board" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="board">{t('prioritization.tabs.board', 'Kanban')}</TabsTrigger>

          <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wide text-gray-500 px-1 self-center">
            {t('prioritization.groups.cohorts', 'Cohorts')}
          </span>
          <TabsTrigger value="cohort">{t('prioritization.tabs.cohort', 'Gerador de Sugestão de Cohort')}</TabsTrigger>
          <TabsTrigger value="synthetic">{t('prioritization.tabs.synthetic', 'Cohorts sintéticos')}</TabsTrigger>

          <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wide text-gray-500 px-1 self-center">
            {t('prioritization.groups.analysis', 'Análises & Perfis')}
          </span>
          <TabsTrigger value="population">{t('prioritization.tabs.population', 'Population Insights v0')}</TabsTrigger>
          <TabsTrigger value="playground">{t('prioritization.tabs.playground', 'Playground multi-fonte')}</TabsTrigger>
          <TabsTrigger value="roles">{t('prioritization.tabs.roles', 'Perfis de Visualização')}</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <PrioritizationBoard />
        </TabsContent>
        <TabsContent value="cohort" className="mt-4">
          <CohortRequestGenerator />
        </TabsContent>
        <TabsContent value="synthetic" className="mt-4">
          <SyntheticCohortsManager />
        </TabsContent>
        <TabsContent value="population" className="mt-4">
          <PopulationInsightsV0 />
        </TabsContent>
        <TabsContent value="playground" className="mt-4">
          <MultiSourcePlayground />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RoleViewEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PriorizacoesTab;