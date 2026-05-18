
import React from 'react';
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import AdminSidebarGroups from './AdminSidebarGroups';

interface AdminSidebarProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentStep, setCurrentStep }) => {
  return (
    <Sidebar 
      variant="sidebar"
      collapsible="none"
    >
      <SidebarContent className="pt-6">
        <AdminSidebarGroups currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
