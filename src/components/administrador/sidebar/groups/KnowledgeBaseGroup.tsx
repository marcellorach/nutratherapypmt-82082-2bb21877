
import React from 'react';
import { BookOpen, Beaker, Network, Microscope, Settings } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarGroup } from "../AdminSidebarGroups";

interface KnowledgeBaseGroupProps {
  group: SidebarGroup;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const KnowledgeBaseGroup: React.FC<KnowledgeBaseGroupProps> = ({ 
  group, 
  currentStep, 
  setCurrentStep 
}) => {
  const handleStepClick = (step: string) => {
    setCurrentStep(step);
  };

  return (
    <>
      {group.items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton 
            isActive={currentStep === item.id} 
            onClick={() => handleStepClick(item.id)}
          >
            {item.icon && React.createElement(item.icon, { className: "h-4 w-4" })}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

export default KnowledgeBaseGroup;
