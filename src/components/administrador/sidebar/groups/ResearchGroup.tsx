
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Beaker, FlaskConical, CheckCheck, Database, Lightbulb, ChevronRight } from "lucide-react";

interface ResearchGroupProps {
  currentStep: string;
  handleStepClick: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ currentStep, handleStepClick }) => {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "sugestoes-ai"}
          onClick={() => handleStepClick("sugestoes-ai")}
          className={currentStep === "sugestoes-ai" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Beaker className={`h-4 w-4 mr-2 ${currentStep === "sugestoes-ai" ? "text-primary" : ""}`} />
              <span>Proposição de Estudos</span>
            </div>
            {currentStep === "sugestoes-ai" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-planejados"}
          onClick={() => handleStepClick("estudos-planejados")}
          className={currentStep === "estudos-planejados" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Beaker className={`h-4 w-4 mr-2 ${currentStep === "estudos-planejados" ? "text-primary" : ""}`} />
              <span>Estudos Planejados</span>
            </div>
            {currentStep === "estudos-planejados" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-andamento"}
          onClick={() => handleStepClick("estudos-andamento")}
          className={currentStep === "estudos-andamento" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <FlaskConical className={`h-4 w-4 mr-2 ${currentStep === "estudos-andamento" ? "text-primary" : ""}`} />
              <span>Estudos em Andamento</span>
            </div>
            {currentStep === "estudos-andamento" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={currentStep === "estudos-concluidos"}
          onClick={() => handleStepClick("estudos-concluidos")}
          className={currentStep === "estudos-concluidos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <CheckCheck className={`h-4 w-4 mr-2 ${currentStep === "estudos-concluidos" ? "text-primary" : ""}`} />
              <span>Estudos Concluídos</span>
            </div>
            {currentStep === "estudos-concluidos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          isActive={currentStep === "modelos"} 
          onClick={() => handleStepClick("modelos")}
          className={currentStep === "modelos" ? "bg-primary/10 text-primary" : ""}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Lightbulb className={`h-4 w-4 mr-2 ${currentStep === "modelos" ? "text-primary" : ""}`} />
              <span>Modelos Preditivos</span>
            </div>
            {currentStep === "modelos" && (
              <ChevronRight className="h-4 w-4 ml-auto text-primary" />
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
};

export default ResearchGroup;
