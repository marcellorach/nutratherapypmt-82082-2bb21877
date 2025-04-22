
import { 
  Database, 
  Network, 
  Calculator, 
  Settings2, 
  Beaker 
} from "lucide-react";

export const navigationConfig = {
  knowledgeBase: {
    icon: Database,
    title: "Base de Conhecimento",
    description: "Nutracêuticos, condições e estudos",
    subMenu: [
      { title: "Nutracêuticos", step: "nutraceuticos" },
      { title: "Estudos Científicos", step: "estudos" },
      { title: "Regras Clínicas", step: "regras" },
      { title: "Relações", step: "relacoes" },
      { title: "Configurações", step: "knowledge-base-settings" }
    ]
  },
  dataProcessing: {
    icon: Network,
    title: "Processamento de Dados",
    description: "Importação, análise e visualização",
    subMenu: [
      { title: "Importação", step: "import" },
      { title: "Fontes de Dados", step: "fontes" },
      { title: "Análise Multi-Agente", step: "analysis", badge: "IA" },
      { title: "Visualizações", step: "visualization" },
      { title: "Configurações", step: "data-processing-settings" }
    ]
  },
  research: {
    icon: Beaker,
    title: "Pesquisa & Desenvolvimento",
    description: "Estudos em andamento e planejados",
    subMenu: [
      { title: "Estudos Planejados", step: "estudos-planejados" },
      { title: "Estudos em Andamento", step: "estudos-andamento" },
      { title: "Estudos Concluídos", step: "estudos-concluidos" },
      { title: "Sugestões da IA", step: "sugestoes-ai", badge: "IA" },
      { title: "OraBiomedical", step: "ora-biomedical" },
      { title: "Configurações", step: "research-settings" }
    ]
  },
  predictiveAnalysis: {
    icon: Calculator,
    title: "Análise Preditiva",
    description: "Modelos e relatórios",
    subMenu: [
      { title: "Modelos Preditivos", step: "modelos" },
      { title: "Análise Custo/Benefício", step: "custo-beneficio" },
      { title: "Relatórios", step: "relatorios" },
      { title: "Configurações", step: "predictive-analysis-settings" }
    ]
  },
  settings: {
    icon: Settings2,
    title: "Configurações Gerais",
    description: "IA, prompts e design",
    subMenu: [
      { title: "Configurações IA", step: "config-ia" },
      { title: "Prompts GPT", step: "prompts" },
      { title: "Prompts NTAI", step: "ntai-prompts", badge: "Novo" },
      { title: "Analytics", step: "analytics" },
      { title: "Ações", step: "actions" },
      { title: "Design Conventions", step: "design-conventions" }
    ]
  }
};
