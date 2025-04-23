
import React from "react";
import { Badge } from "@/components/ui/badge";

interface TabHeaderProps {
  activeTab: string;
  scispaceLogo: string;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, scispaceLogo }) => {
  return (
    <div className="p-6 pb-0 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Importar Estudos Científicos</h2>
        <p className="text-muted-foreground">
          Importe estudos do SCISPACE, "análises integrativas" ou outras fontes
        </p>
      </div>
      {activeTab === 'scispace-api' && (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
          <img 
            src={scispaceLogo} 
            alt="SciSpace Logo" 
            className="h-8 w-auto mr-1 inline-block" 
          />
        </Badge>
      )}
    </div>
  );
};

export default TabHeader;
