
import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader, 
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebarGroups from './AdminSidebarGroups';
import { useSearchParams } from 'react-router-dom';

interface AdminSidebarProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentStep, setCurrentStep }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSettingsClick = () => {
    setCurrentStep('knowledge-base-settings');
    setSearchParams({ tab: 'knowledge-base-settings' });
  };

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="offcanvas"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader className="p-4 pb-2 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Área de P&D</h2>
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <AdminSidebarGroups currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          size="sm"
          onClick={handleSettingsClick}
        >
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
