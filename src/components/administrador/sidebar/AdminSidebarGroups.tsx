
import React from "react";
import {
  BookOpen,
  Database,
  BarChartBig,
  PieChart,
  FileSpreadsheet,
  BookMarked,
  BookCopy,
  FlaskConical,
  User,
  Stethoscope,
  Bot,
  Braces,
  LucideIcon,
  Link,
  Code2,
  Settings,
  FileCode,
  FileJson,
  LayoutDashboard,
  Brain,
  DollarSign,
  PlaySquare,
  LineChart,
  Focus,
  FastForward,
  Rocket,
  UsersRound,
  PenTool,
  BookOpenCheck,
  Layers,
} from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import KnowledgeBaseGroup from "./groups/KnowledgeBaseGroup";
import DataProcessingGroup from "./groups/DataProcessingGroup";
import PredictiveAnalysisGroup from "./groups/PredictiveAnalysisGroup";
import ResearchGroup from "./groups/ResearchGroup";
import ConfigurationGroup from "./groups/ConfigurationGroup";

export type GroupName = 
  | "conhecimento" 
  | "processamento-dados" 
  | "analise-preditiva" 
  | "pesquisa" 
  | "configuracao";

export interface SidebarGroup {
  name: GroupName;
  title: string;
  icon: LucideIcon;
  items: {
    id: string;
    title: string;
    icon?: LucideIcon;
    beta?: boolean;
  }[];
}

interface AdminSidebarGroupsProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebarGroups: React.FC<AdminSidebarGroupsProps> = ({
  currentStep,
  setCurrentStep
}) => {
  const groups: SidebarGroup[] = [
    {
      name: "conhecimento",
      title: "Base de Conhecimento",
      icon: BookOpen,
      items: [
        { id: "nutraceuticos", title: "Nutracêuticos", icon: BookMarked },
        { id: "estudos", title: "Estudos Científicos", icon: BookCopy },
        { id: "regras", title: "Regras Clínicas", icon: Stethoscope },
        { id: "relacoes", title: "Relações", icon: Link },
        { id: "fontes", title: "Fontes Científicas", icon: BookOpenCheck },
      ],
    },
    {
      name: "processamento-dados",
      title: "Processamento de Dados",
      icon: Database,
      items: [
        { id: "import", title: "Importar Dados", icon: FileSpreadsheet },
        { id: "analysis", title: "Análise", icon: BarChartBig },
        { id: "visualization", title: "Visualização", icon: PieChart },
        { id: "actions", title: "Ações", icon: FastForward },
      ],
    },
    {
      name: "analise-preditiva",
      title: "Análise Preditiva",
      icon: Brain,
      items: [
        { id: "modelos", title: "Modelos Preditivos", icon: Focus },
        { id: "custo-beneficio", title: "Custo-Benefício", icon: DollarSign },
        { id: "relatorios", title: "Relatórios", icon: LineChart, beta: true },
      ],
    },
    {
      name: "pesquisa",
      title: "Pesquisa",
      icon: FlaskConical,
      items: [
        { id: "estudos-planejados", title: "Estudos Planejados", icon: PlaySquare },
        { id: "estudos-andamento", title: "Estudos em Andamento", icon: Rocket },
        { id: "estudos-concluidos", title: "Estudos Concluídos", icon: UsersRound },
        { id: "sugestoes-ai", title: "Sugestões da IA", icon: Bot },
        { id: "ora-biomedical", title: "Conexão ORA Biomedical", icon: PenTool, beta: true },
      ],
    },
    {
      name: "configuracao",
      title: "Configuração",
      icon: Settings,
      items: [
        { id: "engines-convencoes", title: "Engines & Convenções", icon: Layers },
        { id: "config-ia", title: "Configurações de IA", icon: Bot },
        { id: "prompts", title: "Prompts", icon: Braces },
        { id: "analytics", title: "Analytics", icon: LayoutDashboard },
      ],
    },
  ];

  return (
    <Accordion type="multiple" defaultValue={["conhecimento"]} className="w-full">
      <KnowledgeBaseGroup 
        group={groups[0]} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
      <DataProcessingGroup 
        group={groups[1]} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
      <PredictiveAnalysisGroup 
        group={groups[2]} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
      <ResearchGroup 
        group={groups[3]} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
      <ConfigurationGroup 
        group={groups[4]} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
    </Accordion>
  );
};

export default AdminSidebarGroups;
