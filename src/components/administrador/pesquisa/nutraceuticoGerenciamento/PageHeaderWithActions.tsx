import React, { useState } from 'react';
import { Database, Plus, RefreshCw, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddNutraceuticalDialog from './dialogs/AddNutraceuticalDialog';
import AddScientificStudyDialog from './dialogs/AddScientificStudyDialog';

interface PageHeaderWithActionsProps {
  refreshData: () => void;
}

const PageHeaderWithActions: React.FC<PageHeaderWithActionsProps> = ({ refreshData }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isAddStudyDialogOpen, setIsAddStudyDialogOpen] = useState<boolean>(false);

  const handleAddSuccess = () => {
    refreshData();
  };

  const handleStudyAddSuccess = () => {
    setIsAddStudyDialogOpen(false);
  };

  const currentDateTime = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-center">
        <Database className="h-8 w-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Banco de Nutracêuticos</h1>
          <p className="text-gray-600">
            Gerencie e mantenha atualizado o banco de dados de nutracêuticos e estudos científicos
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Última atualização em {currentDateTime}
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          variant="default"
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Nutracêutico
        </Button>
        
        <Button 
          onClick={() => setIsAddStudyDialogOpen(true)} 
          variant="outline"
          className="flex items-center"
        >
          <FileText className="mr-2 h-4 w-4" />
          Adicionar Estudo
        </Button>
        
        <Button 
          onClick={refreshData} 
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>

        <Button variant="outline" className="flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </div>

      {/* Diálogos */}
      <AddNutraceuticalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
      />
      
      <AddScientificStudyDialog
        open={isAddStudyDialogOpen}
        onOpenChange={setIsAddStudyDialogOpen}
        onSuccess={handleStudyAddSuccess}
      />
    </div>
  );
};

export default PageHeaderWithActions;