
import React from 'react';
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { SidebarGroup } from "../AdminSidebarGroups";

interface ConfigurationGroupProps {
  group: SidebarGroup;
  currentStep: string;
  setCurrentStep: (step: string) => void;
}

const ConfigurationGroup: React.FC<ConfigurationGroupProps> = ({ 
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
            className={currentStep === item.id ? "bg-primary/10 text-primary" : ""}
          >
            {item.icon && React.createElement(item.icon, { 
              className: `h-4 w-4 ${currentStep === item.id ? "text-primary" : ""}`
            })}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};

export default ConfigurationGroup;
