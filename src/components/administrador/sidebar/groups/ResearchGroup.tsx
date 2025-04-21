
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarGroup } from "../AdminSidebarGroups";

interface ResearchGroupProps {
  group: SidebarGroup;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ 
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
            tooltip={item.title}
          >
            {item.icon && React.createElement(item.icon, { className: "h-4 w-4" })}
            <span>{item.title}</span>
            {item.beta && <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">Beta</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

export default ResearchGroup;
