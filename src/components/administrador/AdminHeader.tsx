
import React from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const AdminHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">Painel de Administração</h1>
        <p className="text-gray-600">Gerencie nutracêuticos, correlações e prompts da IA</p>
      </div>
      
      <div className="flex gap-2 mt-4 md:mt-0">
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </Button>
      </div>
    </div>
  );
};

export default AdminHeader;
