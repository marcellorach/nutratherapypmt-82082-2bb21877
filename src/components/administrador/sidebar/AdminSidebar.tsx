
import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader, 
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
    >
      <SidebarHeader className="p-4 pb-2">
        <h2 className="text-lg font-semibold">Área de P&D</h2>
      </SidebarHeader>
      
      <SidebarContent>
        <AdminSidebarGroups currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-4">
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={handleSettingsClick}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
