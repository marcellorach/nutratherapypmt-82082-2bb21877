
/**
 * Configuração centralizada para tabs do administrador
 * Facilita manutenção e implementa lazy loading
 */

import { lazy } from 'react';

export interface AdminTabConfig {
  id: string;
  label: string;
  group: string;
  icon?: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  description?: string;
  permissions?: string[];
}

// Lazy loading dos componentes
const EstudosTab = lazy(() => import('@/components/administrador/EstudosTab'));
const NutraceuticalsUnifiedTab = lazy(() => import('@/components/administrador/NutraceuticalsUnifiedTab'));
const VeterinaryTargetsTab = lazy(() => import('@/components/administrador/VeterinaryTargetsTab'));
const RegrasClinicasTab = lazy(() => import('@/components/administrador/RegrasClinicasTab'));
const AIInsightsTab = lazy(() => import('@/components/administrador/AIInsightsTab'));
const RelationsTab = lazy(() => import('@/components/administrador/visualizations/relations/RelationsTab'));
const KnowledgeBaseSettingsTab = lazy(() => import('@/components/administrador/settings/KnowledgeBaseSettingsTab'));
const ImportStep = lazy(() => import('@/components/administrador/dataAnalysis/ImportStep'));
const FontesTab = lazy(() => import('@/components/administrador/FontesTab'));
const AnalysisStep = lazy(() => import('@/components/administrador/dataAnalysis/AnalysisStep'));
const VisualizationStep = lazy(() => import('@/components/administrador/dataAnalysis/VisualizationStep'));
const ActionsStep = lazy(() => import('@/components/administrador/dataAnalysis/ActionsStep'));
const AcompanhamentoTab = lazy(() => import('@/components/administrador/acompanhamento/AcompanhamentoTab'));
const DataProcessingSettingsTab = lazy(() => import('@/components/administrador/settings/DataProcessingSettingsTab'));
const EstudosPlanejadosTab = lazy(() => import('@/components/administrador/pesquisa/EstudosPlanejadosTab'));
const EstudosAndamentoTab = lazy(() => import('@/components/administrador/pesquisa/EstudosAndamentoTab'));
const EstudosConcluidosTab = lazy(() => import('@/components/administrador/pesquisa/EstudosConcluidosTab'));
const SugestoesAITab = lazy(() => import('@/components/administrador/pesquisa/SugestoesAITab'));

const PesquisaEstudosTab = lazy(() => import('@/components/administrador/pesquisa/PesquisaEstudosTab'));
const ResearchSettingsTab = lazy(() => import('@/components/administrador/settings/ResearchSettingsTab'));
const ModelosPreditivosTab = lazy(() => import('@/components/administrador/ModelosPreditivosTab'));
const CustoBeneficioTab = lazy(() => import('@/components/administrador/CustoBeneficioTab'));
const PredictiveAnalysisSettingsTab = lazy(() => import('@/components/administrador/settings/PredictiveAnalysisSettingsTab'));
const ConfiguracoesIATab = lazy(() => import('@/components/administrador/ConfiguracoesIATab'));
const PromptsTab = lazy(() => import('@/components/administrador/PromptsTab'));
const AnalyticsTab = lazy(() => import('@/components/administrador/AnalyticsTab'));
const DesignConventionsTab = lazy(() => import('@/components/administrador/DesignConventionsTab'));
const MicrobiomeAnalysisTab = lazy(() => import('@/components/administrador/MicrobiomeAnalysisTab'));
const DatabaseMigrationsTab = lazy(() => import('@/components/administrador/migrations/DatabaseMigrationsTab'));

export const adminTabsConfig: AdminTabConfig[] = [
  // Base de Conhecimento
  {
    id: 'estudos',
    label: 'Estudos Científicos',
    group: 'knowledge-base',
    component: EstudosTab,
    description: 'Gestão de estudos científicos'
  },
  {
    id: 'nutraceuticals-unified',
    label: 'Nutracêuticos',
    group: 'knowledge-base',
    component: NutraceuticalsUnifiedTab,
    description: 'Gerenciamento completo de nutracêuticos e relações'
  },
  {
    id: 'veterinary-targets',
    label: 'Alvos Veterinários',
    group: 'knowledge-base',
    component: VeterinaryTargetsTab,
    description: 'Condições de saúde gerenciáveis por nutracêuticos'
  },
  {
    id: 'ai-insights',
    label: 'A.I. Insights',
    group: 'knowledge-base',
    component: AIInsightsTab,
    description: 'Descobertas e análises geradas pela IA'
  },
  {
    id: 'relacoes',
    label: 'Relações',
    group: 'knowledge-base',
    component: RelationsTab,
    description: 'Visualização de relações entre nutracêuticos e condições'
  },
  {
    id: 'knowledge-base-settings',
    label: 'Configurações',
    group: 'knowledge-base',
    component: KnowledgeBaseSettingsTab,
    description: 'Configurações da base de conhecimento'
  },

  // Processamento de Dados
  {
    id: 'import',
    label: 'Importação',
    group: 'data-processing',
    component: ImportStep,
    description: 'Importação de dados'
  },
  {
    id: 'fontes',
    label: 'Fontes',
    group: 'data-processing',
    component: FontesTab,
    description: 'Gerenciamento de fontes'
  },
  {
    id: 'analysis',
    label: 'Análise',
    group: 'data-processing',
    component: AnalysisStep,
    description: 'Análise de dados'
  },
  {
    id: 'visualization',
    label: 'Visualização',
    group: 'data-processing',
    component: VisualizationStep,
    description: 'Visualização de dados'
  },
  {
    id: 'actions',
    label: 'Ações',
    group: 'data-processing',
    component: ActionsStep,
    description: 'Ações e processamento'
  },
  {
    id: 'acompanhamento',
    label: 'Acompanhamento',
    group: 'data-processing',
    component: AcompanhamentoTab,
    description: 'Acompanhamento de campanhas'
  },
  {
    id: 'data-processing-settings',
    label: 'Configurações',
    group: 'data-processing',
    component: DataProcessingSettingsTab,
    description: 'Configurações de processamento'
  },

  // Pesquisa e Desenvolvimento
  {
    id: 'estudos-planejados',
    label: 'Planejados',
    group: 'research',
    component: EstudosPlanejadosTab,
    description: 'Estudos planejados'
  },
  {
    id: 'estudos-andamento',
    label: 'Em Andamento',
    group: 'research',
    component: EstudosAndamentoTab,
    description: 'Estudos em andamento'
  },
  {
    id: 'estudos-concluidos',
    label: 'Concluídos',
    group: 'research',
    component: EstudosConcluidosTab,
    description: 'Estudos concluídos'
  },
  {
    id: 'sugestoes-ai',
    label: 'Sugestões AI',
    group: 'research',
    component: SugestoesAITab,
    description: 'Sugestões de IA'
  },
  {
    id: 'pesquisa-estudos',
    label: 'Pesquisa',
    group: 'research',
    component: PesquisaEstudosTab,
    description: 'Pesquisa de estudos'
  },
  {
    id: 'research-settings',
    label: 'Configurações',
    group: 'research',
    component: ResearchSettingsTab,
    description: 'Configurações de pesquisa'
  },

  // Análise Preditiva
  {
    id: 'modelos',
    label: 'Modelos Preditivos',
    group: 'predictive-analysis',
    component: ModelosPreditivosTab,
    description: 'Modelos preditivos'
  },
  {
    id: 'custo-beneficio',
    label: 'Análise de ROI',
    group: 'predictive-analysis',
    component: CustoBeneficioTab,
    description: 'Análise de custo-benefício'
  },
  {
    id: 'predictive-analysis-settings',
    label: 'Configurações',
    group: 'predictive-analysis',
    component: PredictiveAnalysisSettingsTab,
    description: 'Configurações de análise preditiva'
  },

  // Configuração
  {
    id: 'config-ia',
    label: 'Configurações IA',
    group: 'configuration',
    component: ConfiguracoesIATab,
    description: 'Configurações de IA'
  },
  {
    id: 'prompts',
    label: 'Prompts',
    group: 'configuration',
    component: PromptsTab,
    description: 'Gerenciamento de prompts'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    group: 'configuration',
    component: AnalyticsTab,
    description: 'Análises e métricas'
  },
  {
    id: 'design-conventions',
    label: 'Design',
    group: 'configuration',
    component: DesignConventionsTab,
    description: 'Convenções de design'
  }
];

export const getTabConfig = (tabId: string): AdminTabConfig | undefined => {
  return adminTabsConfig.find(tab => tab.id === tabId);
};

export const getTabsByGroup = (group: string): AdminTabConfig[] => {
  return adminTabsConfig.filter(tab => tab.group === group);
};
