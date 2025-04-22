
import React from 'react';
import Feature from './layout/Feature';
import AdminHeader from './AdminHeader';
import { navigationConfig } from './config/navigation';

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
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <div className="container mx-auto p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4 space-y-4">
            <div className="text-lg font-semibold mb-4">Gerenciamento do Sistema</div>
            
            <Feature
              icon={<navigationConfig.knowledgeBase.icon size={20} />}
              title={navigationConfig.knowledgeBase.title}
              description={navigationConfig.knowledgeBase.description}
              active={["nutraceuticos", "estudos", "regras", "relacoes", "knowledge-base-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("nutraceuticos")}
              subMenu={navigationConfig.knowledgeBase.subMenu}
              showSubMenu={expandedMenu === "baseDeConhecimento"}
              onToggleSubMenu={() => toggleMenu("baseDeConhecimento")}
            />

            <Feature
              icon={<navigationConfig.dataProcessing.icon size={20} />}
              title={navigationConfig.dataProcessing.title}
              description={navigationConfig.dataProcessing.description}
              active={["import", "fontes", "analysis", "visualization", "data-processing-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("import")}
              subMenu={navigationConfig.dataProcessing.subMenu}
              showSubMenu={expandedMenu === "processamentoDados"}
              onToggleSubMenu={() => toggleMenu("processamentoDados")}
            />

            <Feature
              icon={<navigationConfig.research.icon size={20} />}
              title={navigationConfig.research.title}
              description={navigationConfig.research.description}
              active={["estudos-planejados", "estudos-andamento", "estudos-concluidos", "sugestoes-ai", "ora-biomedical", "research-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("estudos-planejados")}
              subMenu={navigationConfig.research.subMenu}
              showSubMenu={expandedMenu === "pesquisaDesenvolvimento"}
              onToggleSubMenu={() => toggleMenu("pesquisaDesenvolvimento")}
            />

            <Feature
              icon={<navigationConfig.predictiveAnalysis.icon size={20} />}
              title={navigationConfig.predictiveAnalysis.title}
              description={navigationConfig.predictiveAnalysis.description}
              active={["modelos", "custo-beneficio", "relatorios", "predictive-analysis-settings"].includes(currentStep)}
              onClick={() => setCurrentStep("modelos")}
              subMenu={navigationConfig.predictiveAnalysis.subMenu}
              showSubMenu={expandedMenu === "analisePreditiva"}
              onToggleSubMenu={() => toggleMenu("analisePreditiva")}
            />

            <Feature
              icon={<navigationConfig.settings.icon size={20} />}
              title={navigationConfig.settings.title}
              description={navigationConfig.settings.description}
              active={["config-ia", "prompts", "ntai-prompts", "analytics", "actions", "design-conventions"].includes(currentStep)}
              onClick={() => setCurrentStep("config-ia")}
              subMenu={navigationConfig.settings.subMenu}
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
