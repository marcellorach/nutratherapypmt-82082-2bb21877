
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
const NutraceuticosTab = lazy(() => import('@/components/administrador/NutraceuticosTab'));
const NutraceuticoGerenciamentoTab = lazy(() => import('@/components/administrador/pesquisa/NutraceuticoGerenciamentoTab'));
const RegrasClinicasTab = lazy(() => import('@/components/administrador/RegrasClinicasTab'));
const RelationsTab = lazy(() => import('@/components/administrador/visualizations/relations/RelationsTab'));
const KnowledgeBaseSettingsTab = lazy(() => import('@/components/administrador/settings/KnowledgeBaseSettingsTab'));
const OutcomeManagementPanel = lazy(() => import('@/components/administrador/settings/panels/OutcomeManagementPanel'));
const ImportStep = lazy(() => import('@/components/administrador/dataAnalysis/ImportStep'));
const FontesTab = lazy(() => import('@/components/administrador/FontesTab'));
const AnalysisStep = lazy(() => import('@/components/administrador/dataAnalysis/AnalysisStep'));
const VisualizationStep = lazy(() => import('@/components/administrador/dataAnalysis/VisualizationStep'));
const ActionsStep = lazy(() => import('@/components/administrador/dataAnalysis/ActionsStep'));
const DataProcessingSettingsTab = lazy(() => import('@/components/administrador/settings/DataProcessingSettingsTab'));
const EstudosPlanejadosTab = lazy(() => import('@/components/administrador/pesquisa/EstudosPlanejadosTab'));
const EstudosAndamentoTab = lazy(() => import('@/components/administrador/pesquisa/EstudosAndamentoTab'));
const EstudosConcluidosTab = lazy(() => import('@/components/administrador/pesquisa/EstudosConcluidosTab'));
const SugestoesAITab = lazy(() => import('@/components/administrador/pesquisa/SugestoesAITab'));
const OraBiomedicalTab = lazy(() => import('@/components/administrador/pesquisa/OraBiomedicalTab'));
const PesquisaEstudosTab = lazy(() => import('@/components/administrador/pesquisa/PesquisaEstudosTab'));
const ResearchSettingsTab = lazy(() => import('@/components/administrador/settings/ResearchSettingsTab'));
const ModelosPreditivosTab = lazy(() => import('@/components/administrador/ModelosPreditivosTab'));
const CustoBeneficioTab = lazy(() => import('@/components/administrador/CustoBeneficioTab'));
const PredictiveAnalysisSettingsTab = lazy(() => import('@/components/administrador/settings/PredictiveAnalysisSettingsTab'));
const ConfiguracoesIATab = lazy(() => import('@/components/administrador/ConfiguracoesIATab'));
const PromptsTab = lazy(() => import('@/components/administrador/PromptsTab'));
const AnalyticsTab = lazy(() => import('@/components/administrador/AnalyticsTab'));
const DesignConventionsTab = lazy(() => import('@/components/administrador/DesignConventionsTab'));

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
    id: 'nutraceuticos',
    label: 'Nutracêuticos',
    group: 'knowledge-base',
    component: NutraceuticosTab,
    description: 'Catálogo de nutracêuticos'
  },
  {
    id: 'nutraceu-gerenciamento',
    label: 'Gerenciamento',
    group: 'knowledge-base',
    component: NutraceuticoGerenciamentoTab,
    description: 'Gerenciamento avançado de nutracêuticos'
  },
  {
    id: 'regras',
    label: 'Regras Clínicas',
    group: 'knowledge-base',
    component: RegrasClinicasTab,
    description: 'Regras clínicas e protocolos'
  },
  {
    id: 'relacoes',
    label: 'Relações',
    group: 'knowledge-base',
    component: RelationsTab,
    description: 'Visualização de relações entre dados'
  },
  {
    id: 'knowledge-base-settings',
    label: 'Configurações',
    group: 'knowledge-base',
    component: KnowledgeBaseSettingsTab,
    description: 'Configurações da base de conhecimento'
  },
  {
    id: 'outcomes-management',
    label: 'Outcomes',
    group: 'knowledge-base',
    component: OutcomeManagementPanel,
    description: 'Gerenciamento de outcomes'
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
    id: 'ora-biomedical',
    label: 'Ora Biomedical',
    group: 'research',
    component: OraBiomedicalTab,
    description: 'Integração Ora Biomedical'
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
