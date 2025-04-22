
import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureSubMenuItem {
  title: string;
  step: string;
  description?: string;
  badge?: string;
}

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  active?: boolean;
  subMenu?: FeatureSubMenuItem[];
  showSubMenu?: boolean;
  onToggleSubMenu?: () => void;
}

const Feature: React.FC<FeatureProps> = ({
  icon,
  title,
  description,
  onClick,
  active,
  subMenu,
  showSubMenu,
  onToggleSubMenu,
}) => {
  return (
    <div className="relative">
      <Card
        className={`p-4 hover:shadow-md cursor-pointer transition-all ${
          active ? "bg-primary/10 border-primary/30" : ""
        }`}
        onClick={subMenu && subMenu.length > 0 ? onToggleSubMenu : onClick}
      >
        <div className="flex items-center">
          <div
            className={`mr-4 p-2 rounded-full ${
              active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {subMenu && subMenu.length > 0 && (
            <div className={`transition-transform ${showSubMenu ? "rotate-180" : ""}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          )}
        </div>
      </Card>
      {showSubMenu && subMenu && subMenu.length > 0 && (
        <div className="pl-4 border-l border-gray-200 ml-8 mt-1 space-y-1">
          {subMenu.map((item, index) => (
            <div
              key={index}
              className={cn(
                "p-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between",
                active && currentStepIncluded(item.step) ? "bg-primary/5 text-primary" : ""
              )}
              onClick={() => onClick()}
            >
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-primary/20 text-primary">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to check if current step is included
function currentStepIncluded(step: string): boolean {
  return location.pathname.includes(step);
}

export default Feature;
