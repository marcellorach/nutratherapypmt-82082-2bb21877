
import React, { useState } from 'react';
import Layout from "@/components/layout/Layout";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  Database, 
  FileText, 
  Bot, 
  BarChart3, 
  Import, 
  Brain,
  LineChart, 
  Users,
  Mail,
  Check,
  Settings,
  BookOpen,
  Scan,
  Table,
  Beaker,
  Lightbulb,
  Microscope,
  Zap,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentStep, setCurrentStep }) => {
  return (
    <Layout>
      <div className="container mx-auto p-0">
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-[calc(100vh-8rem)] w-full">
            <AdminSidebar currentStep={currentStep} setCurrentStep={setCurrentStep} />
            <div className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </div>
          </div>
        </SidebarProvider>
      </div>
    </Layout>
  );
};

interface AdminSidebarProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentStep, setCurrentStep }) => {
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
  };
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Base de Conhecimento */}
        <SidebarGroup>
          <SidebarGroupLabel>Base de Conhecimento</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "nutraceuticos"} 
                  onClick={() => handleStepClick("nutraceuticos")}
                >
                  <Beaker />
                  <span>Nutracêuticos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "estudos"} 
                  onClick={() => handleStepClick("estudos")}
                >
                  <BookOpen />
                  <span>Estudos Científicos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "regras"} 
                  onClick={() => handleStepClick("regras")}
                >
                  <Microscope />
                  <span>Regras Clínicas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Processamento de Dados */}
        <SidebarGroup>
          <SidebarGroupLabel>Processamento de Dados</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "import"} 
                  onClick={() => handleStepClick("import")}
                >
                  <Import />
                  <span>Importar Dados</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "fontes"} 
                  onClick={() => handleStepClick("fontes")}
                >
                  <Database />
                  <span>Fontes de Dados</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "analysis"} 
                  onClick={() => handleStepClick("analysis")}
                >
                  <Brain />
                  <span>Simulação Multi-Agente</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "visualization"} 
                  onClick={() => handleStepClick("visualization")}
                >
                  <BarChart3 />
                  <span>Visualização</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Análise Preditiva */}
        <SidebarGroup>
          <SidebarGroupLabel>Análise Preditiva</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "modelos"} 
                  onClick={() => handleStepClick("modelos")}
                >
                  <Lightbulb />
                  <span>Modelos Preditivos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "custo-beneficio"} 
                  onClick={() => handleStepClick("custo-beneficio")}
                >
                  <Gauge />
                  <span>Análise de ROI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "relatorios"} 
                  onClick={() => handleStepClick("relatorios")}
                >
                  <LineChart />
                  <span>Relatórios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Configuração */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "prompts"} 
                  onClick={() => handleStepClick("prompts")}
                >
                  <Bot />
                  <span>Prompts da IA</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "analytics"} 
                  onClick={() => handleStepClick("analytics")}
                >
                  <Zap />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={currentStep === "actions"} 
                  onClick={() => handleStepClick("actions")}
                >
                  <Check />
                  <span>Ações em Massa</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4">
          <Button variant="outline" className="w-full" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminLayout;
