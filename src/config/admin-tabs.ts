
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

// Lazy loading dos componentes (Base de Conhecimento)
const EstudosTab = lazy(() => import('@/components/administrador/EstudosTab'));

const NutraceuticalsUnifiedTab = lazy(() => import('@/components/administrador/NutraceuticalsUnifiedTab'));
const VeterinaryTargetsTab = lazy(() => import('@/components/administrador/VeterinaryTargetsTab'));
const AIInsightsTab = lazy(() => import('@/components/administrador/AIInsightsTab'));
const RelationsTab = lazy(() => import('@/components/administrador/visualizations/relations/RelationsTab'));
const KnowledgeBaseSettingsTab = lazy(() => import('@/components/administrador/settings/KnowledgeBaseSettingsTab'));

// Outros componentes
const RegrasClinicasTab = lazy(() => import('@/components/administrador/RegrasClinicasTab'));
const ImportStep = lazy(() => import('@/components/administrador/dataAnalysis/ImportStep'));
const VisualizationStep = lazy(() => import('@/components/administrador/dataAnalysis/VisualizationStep'));
const ActionsStep = lazy(() => import('@/components/administrador/dataAnalysis/ActionsStep'));
const ClinicalMonitoringTab = lazy(() => import('@/components/administrador/clinical-monitoring/ClinicalMonitoringTab'));
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
const PromptConfigurationTab = lazy(() => import('@/components/administrador/PromptConfigurationTab'));
const AnalyticsTab = lazy(() => import('@/components/administrador/AnalyticsTab'));
const DesignConventionsTab = lazy(() => import('@/components/administrador/DesignConventionsTab'));
const DatabaseMigrationsTab = lazy(() => import('@/components/administrador/migrations/DatabaseMigrationsTab'));
const TranslationAuditTab = lazy(() => import('@/components/administrador/auditoria/TranslationAuditTab'));
const TranslationManager = lazy(() => import('@/components/administrador/traducoes/TranslationManager'));
const OntologyAuditTab = lazy(() => import('@/components/administrador/auditoria/OntologyAuditTab'));
const OntologyMappingTab = lazy(() => import('@/components/administrador/OntologyMappingTab'));
const AccessRequestsPanel = lazy(() => import('@/components/administrador/access/AccessRequestsPanel'));
const AdminPetManagementTab = lazy(() => import('@/components/administrador/patients/AdminPetManagementTab'));

// Knowledge Graph & Curation
const TripletCurationBoard = lazy(() => import('@/components/administrador/estudos/curation/TripletCurationBoard'));
const KnowledgeGraphViewer = lazy(() => import('@/components/administrador/visualizations/KnowledgeGraphViewer'));
const TripletQualityDashboard = lazy(() => import('@/components/administrador/analytics/TripletQualityDashboard'));
const ConflictReviewPanel = lazy(() => import('@/components/administrador/conflicts/ConflictReviewPanel'));
const BaseKnowledgeTab = lazy(() => import('@/components/administrador/base-knowledge/BaseKnowledgeTab'));
const BreedsManagementTab = lazy(() => import('@/components/administrador/breeds/BreedsManagementTab'));
const LabReferencesTab = lazy(() => import('@/components/administrador/lab-references/LabReferencesTab'));
const PetFoodCatalogTab = lazy(() => import('@/components/administrador/pet-food/PetFoodCatalogTab'));
const PetFoodCoverageTab = lazy(() => import('@/components/administrador/pet-food/PetFoodCoverageTab'));
const DosageCurationPanel = lazy(() => import('@/components/administrador/dosage-curation/DosageCurationPanel'));
const OrganogramaTab = lazy(() => import('@/pages/administrador/OrganogramaTab'));
const GapFillDiagnosticsTab = lazy(() => import('@/components/administrador/diagnostics/GapFillDiagnosticsTab'));
const PharmacologyTab = lazy(() => import('@/components/administrador/pharmacology/PharmacologyTab'));
const ComplianceDashboard = lazy(() => import('@/components/administrador/compliance/ComplianceDashboard'));
const TechnicalAuditsTab = lazy(() => import('@/components/administrador/audits/TechnicalAuditsTab'));
const AboutSenexTab = lazy(() => import('@/components/administrador/AboutSenexTab'));

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
    id: 'relacoes',
    label: 'Relações',
    group: 'knowledge-base',
    component: RelationsTab,
    description: 'Visualização de relações entre nutracêuticos e condições'
  },
  {
    id: 'ai-insights',
    label: 'A.I. Insights',
    group: 'knowledge-base',
    component: AIInsightsTab,
    description: 'Descobertas e análises geradas pela IA'
  },
  {
    id: 'triplet-curation',
    label: 'Curadoria de Triplets',
    group: 'knowledge-base',
    component: TripletCurationBoard,
    description: 'Sistema Kanban para revisão e aprovação de triplets extraídos'
  },
  {
    id: 'knowledge-graph',
    label: 'Knowledge Graph',
    group: 'knowledge-base',
    component: KnowledgeGraphViewer,
    description: 'Visualização 3D do grafo de conhecimento médico'
  },
  {
    id: 'evidence-conflicts',
    label: 'Conflitos de Evidência',
    group: 'knowledge-base',
    component: ConflictReviewPanel,
    description: 'Revisão e resolução de conflitos entre estudos científicos'
  },
  {
    id: 'base-knowledge',
    label: 'Dados Base',
    group: 'knowledge-base',
    component: BaseKnowledgeTab,
    description: 'Importação e curadoria de dados de ontologias externas'
  },
  {
    id: 'breeds-management',
    label: 'Raças & Predisposições',
    group: 'knowledge-base',
    component: BreedsManagementTab,
    description: 'Gerenciamento de raças e predisposições genéticas'
  },
  {
    id: 'lab-references',
    label: 'Referências Laboratoriais',
    group: 'knowledge-base',
    component: LabReferencesTab,
    description: 'Intervalos de referência para exames laboratoriais'
  },
  {
    id: 'pet-food-catalog',
    label: 'Catálogo de Rações',
    group: 'knowledge-base',
    component: PetFoodCatalogTab,
    description: 'Banco de marcas, produtos e perfil nutricional de rações'
  },
  {
    id: 'pet-food-coverage',
    label: 'Cobertura de Rações',
    group: 'knowledge-base',
    component: PetFoodCoverageTab,
    description: 'KPIs, heatmap por marca, enriquecimento em lote e log de execuções do catálogo de rações'
  },
  {
    id: 'dosage-curation',
    label: 'Curadoria de Doses',
    group: 'knowledge-base',
    component: DosageCurationPanel,
    description: 'Revisão e aprovação de doses extraídas da web ou estimadas por IA'
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
    id: 'visualization',
    label: 'Visualização',
    group: 'data-processing',
    component: VisualizationStep,
    description: 'Visualização de dados'
  },
  {
    id: 'actions',
    label: 'Ações',
    group: 'configuration',
    component: ActionsStep,
    description: 'Ações em lote e processamento'
  },
  {
    id: 'clinical-monitoring',
    label: 'Monitoramento Clínico',
    group: 'data-processing',
    component: ClinicalMonitoringTab,
    description: 'Monitoramento longitudinal de pets em nutraterapia'
  },
  {
    id: 'pet-management',
    label: 'Análise de Pacientes',
    group: 'data-processing',
    component: AdminPetManagementTab,
    description: 'Registro e gestão de pacientes caninos'
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
    label: 'AI Prompts',
    group: 'configuration',
    component: PromptConfigurationTab,
    description: 'Gerenciamento de prompts de IA (Extração, Triplets, Recomendação)'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    group: 'configuration',
    component: AnalyticsTab,
    description: 'Análises e métricas'
  },
  {
    id: 'triplet-quality',
    label: 'Qualidade Triplets',
    group: 'configuration',
    component: TripletQualityDashboard,
    description: 'Dashboard de qualidade e completude dos triplets extraídos'
  },
  {
    id: 'design-conventions',
    label: 'Design',
    group: 'configuration',
    component: DesignConventionsTab,
    description: 'Convenções de design'
  },
  {
    id: 'translation-audit',
    label: 'Translation Audit',
    group: 'configuration',
    component: TranslationAuditTab,
    description: 'Audit and monitor translation coverage'
  },
  {
    id: 'translation-manager',
    label: 'Gerenciar Traduções',
    group: 'configuration',
    component: TranslationManager,
    description: 'Editar traduções diretamente no banco de dados'
  },
  {
    id: 'ontology-audit',
    label: 'Auditoria de Ontologia',
    group: 'knowledge-base',
    component: OntologyAuditTab,
    description: 'Auditoria e correção de classificações de entidades no Knowledge Graph'
  },
  {
    id: 'ontology-mapping',
    label: 'Mapeamento SNOMED/UMLS',
    group: 'knowledge-base',
    component: OntologyMappingTab,
    description: 'Mapeamento de entidades para padrões SNOMED-CT e UMLS com auditoria'
  },
  {
    id: 'access-requests',
    label: 'Solicitações de Acesso',
    group: 'configuration',
    component: AccessRequestsPanel,
    description: 'Gerenciamento de solicitações de acesso à plataforma'
  },
  {
    id: 'organograma',
    label: 'Organograma do Projeto',
    group: 'configuration',
    component: OrganogramaTab,
    description: 'Mapa estrutural do projeto + changelog visual + grafo de áreas'
  },
  {
    id: 'gapfill-diagnostics',
    label: 'Diagnóstico Gap-Fill',
    group: 'knowledge-base',
    component: GapFillDiagnosticsTab,
    description: 'Mapeamento e diagnóstico dos dados usados no pipeline de gap-fill do KG'
  },
  {
    id: 'pharmacology',
    label: 'Base Farmacológica',
    group: 'knowledge-base',
    component: PharmacologyTab,
    description: 'Catálogo de drogas, marcas comerciais brasileiras e interações farmacológicas'
  },
  {
    id: 'compliance-dashboard',
    label: 'Conformidade Regulatória',
    group: 'configuration',
    component: ComplianceDashboard,
    description: 'Dashboard interativo FDA/EMA/AVMA com filtros por requisito, evidência e status'
  },
  {
    id: 'technical-audits',
    label: 'Auditorias Técnicas',
    group: 'configuration',
    component: TechnicalAuditsTab,
    description: 'Histórico versionado de auditorias técnicas internas (HTML/PDF/DOCX) vinculadas à versão do sistema'
  },
  {
    id: 'about-senex',
    label: 'About Senex AI',
    group: 'configuration',
    component: AboutSenexTab,
    description: 'Visão técnica detalhada do motor Senex AI: arquitetura em 6 fases, pilares científicos e princípios operacionais'
  }
];

export const getTabConfig = (tabId: string): AdminTabConfig | undefined => {
  return adminTabsConfig.find(tab => tab.id === tabId);
};

export const getTabsByGroup = (group: string): AdminTabConfig[] => {
  return adminTabsConfig.filter(tab => tab.group === group);
};
