import React from 'react';
import { Cpu, Bot, ListTree, ShieldCheck, FileSearch, Info, Sparkles, ChevronRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTranslation } from 'react-i18next';

interface Props {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const items = [
  { id: 'priorizacoes', icon: LayoutGrid, key: 'admin.sidebar.governanceAI.priorizacoes', fallback: 'Priorizações' },
  { id: 'config-ia', icon: Cpu, key: 'admin.sidebar.configuration.aiConfig' },
  { id: 'prompts', icon: Bot, key: 'admin.sidebar.configuration.aiPrompts' },
  { id: 'organograma', icon: ListTree, key: 'admin.sidebar.configuration.organograma' },
  { id: 'compliance-dashboard', icon: ShieldCheck, key: 'admin.sidebar.configuration.complianceDashboard' },
  { id: 'technical-audits', icon: FileSearch, key: 'admin.sidebar.configuration.technicalAudits' },
  { id: 'about-senex', icon: Info, key: 'admin.sidebar.configuration.aboutSenex' },
  { id: 'fundamentos', icon: Sparkles, key: 'admin.sidebar.configuration.fundamentos', fallback: 'Fundamentos Arquiteturais' },
];

const ConfiguredCheck = () => (
  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-2 shrink-0" aria-label="Configurado" />
);

const GovernanceAIGroup: React.FC<Props> = ({ currentStep, handleStepClick }) => {
  const { t } = useTranslation();
  return (
    <>
      {items.map(({ id, icon: Icon, key, fallback }) => {
        const active = currentStep === id;
        return (
          <SidebarMenuItem key={id}>
            <SidebarMenuButton
              isActive={active}
              onClick={() => handleStepClick(id)}
              className={active ? "bg-primary/10 text-primary" : ""}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Icon className={`h-4 w-4 mr-2 ${active ? "text-primary" : ""}`} />
                  <span>{t(key, fallback || '')}</span>
                  <ConfiguredCheck />
                </div>
                <div className="flex items-center ml-auto">
                  {active && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
};

export default GovernanceAIGroup;