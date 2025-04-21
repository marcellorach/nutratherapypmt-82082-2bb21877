
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarGroup } from "../AdminSidebarGroups";

interface DataProcessingGroupProps {
  group: SidebarGroup;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const DataProcessingGroup: React.FC<DataProcessingGroupProps> = ({ 
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

export default DataProcessingGroup;
