
import React from 'react';
import { Card } from "@/components/ui/card";
import {
  MenuIcon,
  LayoutDashboardIcon,
  BookOpenIcon,
  TestTubeIcon,
  Database,
  Network,
  Workflow,
  FlaskConical,
  Cog,
  Calculator,
  BarChart3,
  Brain,
  LineChart,
  Flask,
  Layers,
  FilePlus2,
  Settings2,
} from "lucide-react";
import AdminHeader from './AdminHeader';
import { useLocation, useNavigate } from "react-router-dom";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  active?: boolean;
  subMenu?: {
    title: string;
    step: string;
    description?: string;
    badge?: string;
  }[];
  showSubMenu?: boolean;
  onToggleSubMenu?: () => void;
}

const Feature: React.FC<FeatureProps> = ({
  icon,
  title,
  description,
  onClick,
  active,
  subMenu,
  showSubMenu,
  onToggleSubMenu,
}) => {
  return (
    <div className="relative">
      <Card
        className={`p-4 hover:shadow-md cursor-pointer transition-all ${
          active ? "bg-primary/10 border-primary/30" : ""
        }`}
        onClick={subMenu && subMenu.length > 0 ? onToggleSubMenu : onClick}
      >
        <div className="flex items-center">
          <div
            className={`mr-4 p-2 rounded-full ${
              active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {subMenu && subMenu.length > 0 && (
            <div className={`transition-transform ${showSubMenu ? "rotate-180" : ""}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          )}
        </div>
      </Card>
      {showSubMenu && subMenu && subMenu.length > 0 && (
        <div className="pl-4 border-l border-gray-200 ml-8 mt-1 space-y-1">
          {subMenu.map((item, index) => (
            <div
              key={index}
              className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                active && currentStepIncluded(item.step) ? "bg-primary/5 text-primary" : ""
              }`}
              onClick={() => onClick(item.step)}
            >
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Função para verificar se o passo atual está incluído
function currentStepIncluded(step: string): boolean {
  const location = useLocation();
  return location.pathname.includes(step);
}

interface AdminLayoutProps {
  children: React.ReactNode;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentStep,
  setCurrentStep,
}) => {
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>("baseDeConhecimento");
  
  const toggleMenu = (menu: string) => {
    if (expandedMenu === menu) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menu);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <div className="container mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4 space-y-4">
            <div className="text-lg font-semibold mb-4">Gerenciamento do Sistema</div>
            <Feature
              icon={<Database size={20} />}
              title="Base de Conhecimento"
              description="Nutracêuticos, condições e estudos"
              active={["nutraceuticos", "estudos", "regras", "relacoes", "knowledge-base-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("nutraceuticos")}
              subMenu={[
                { title: "Nutracêuticos", step: "nutraceuticos" },
                { title: "Estudos Científicos", step: "estudos" },
                { title: "Regras Clínicas", step: "regras" },
                { title: "Relações", step: "relacoes" },
                { title: "Configurações", step: "knowledge-base-settings" }
              ]}
              showSubMenu={expandedMenu === "baseDeConhecimento"}
              onToggleSubMenu={() => toggleMenu("baseDeConhecimento")}
            />

            <Feature
              icon={<Network size={20} />}
              title="Processamento de Dados"
              description="Importação, análise e visualização"
              active={["import", "fontes", "analysis", "visualization", "data-processing-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("import")}
              subMenu={[
                { title: "Importação", step: "import" },
                { title: "Fontes de Dados", step: "fontes" },
                { title: "Análise Multi-Agente", step: "analysis", badge: "IA" },
                { title: "Visualizações", step: "visualization" },
                { title: "Configurações", step: "data-processing-settings" }
              ]}
              showSubMenu={expandedMenu === "processamentoDados"}
              onToggleSubMenu={() => toggleMenu("processamentoDados")}
            />

            <Feature
              icon={<Flask size={20} />}
              title="Pesquisa & Desenvolvimento"
              description="Estudos em andamento e planejados"
              active={["estudos-planejados", "estudos-andamento", "estudos-concluidos", "sugestoes-ai", "ora-biomedical", "research-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("estudos-planejados")}
              subMenu={[
                { title: "Estudos Planejados", step: "estudos-planejados" },
                { title: "Estudos em Andamento", step: "estudos-andamento" },
                { title: "Estudos Concluídos", step: "estudos-concluidos" },
                { title: "Sugestões da IA", step: "sugestoes-ai", badge: "IA" },
                { title: "OraBiomedical", step: "ora-biomedical" },
                { title: "Configurações", step: "research-settings" }
              ]}
              showSubMenu={expandedMenu === "pesquisaDesenvolvimento"}
              onToggleSubMenu={() => toggleMenu("pesquisaDesenvolvimento")}
            />

            <Feature
              icon={<Calculator size={20} />}
              title="Análise Preditiva"
              description="Modelos e relatórios"
              active={["modelos", "custo-beneficio", "relatorios", "predictive-analysis-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("modelos")}
              subMenu={[
                { title: "Modelos Preditivos", step: "modelos" },
                { title: "Análise Custo/Benefício", step: "custo-beneficio" },
                { title: "Relatórios", step: "relatorios" },
                { title: "Configurações", step: "predictive-analysis-settings" }
              ]}
              showSubMenu={expandedMenu === "analisePreditiva"}
              onToggleSubMenu={() => toggleMenu("analisePreditiva")}
            />

            <Feature
              icon={<Settings2 size={20} />}
              title="Configurações Gerais"
              description="IA, prompts e design"
              active={["config-ia", "prompts", "ntai-prompts", "analytics", "actions", "design-conventions"].includes(currentStep)}
              onClick={() => setCurrentStep("config-ia")}
              subMenu={[
                { title: "Configurações IA", step: "config-ia" },
                { title: "Prompts GPT", step: "prompts" },
                { title: "Prompts NTAI", step: "ntai-prompts", badge: "Novo" },
                { title: "Analytics", step: "analytics" },
                { title: "Ações", step: "actions" },
                { title: "Design Conventions", step: "design-conventions" }
              ]}
              showSubMenu={expandedMenu === "configuracoesGerais"}
              onToggleSubMenu={() => toggleMenu("configuracoesGerais")}
            />
          </div>

          <div className="flex-1 bg-white p-6 rounded-lg border shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
