
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Import, Database } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="px-6 pt-4">
      <TabsList className="w-full justify-start">
        <TabsTrigger 
          value="file-upload" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("file-upload")}
        >
          <Upload className="h-4 w-4" />
          <span>Upload de Arquivos</span>
        </TabsTrigger>
        <TabsTrigger 
          value="scispace-api" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("scispace-api")}
        >
          <Import className="h-4 w-4" />
          <span>Importar Integrativa (SCISPACE)</span>
        </TabsTrigger>
        <TabsTrigger 
          value="import-history" 
          className="flex items-center gap-1"
          onClick={() => onTabChange("import-history")}
        >
          <Database className="h-4 w-4" />
          <span>Histórico</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default TabNavigation;
