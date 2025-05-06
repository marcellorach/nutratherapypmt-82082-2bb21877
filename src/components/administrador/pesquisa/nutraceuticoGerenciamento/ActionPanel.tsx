
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import AddNutraceuticalDialog from './dialogs/AddNutraceuticalDialog';
import AddScientificStudyDialog from './dialogs/AddScientificStudyDialog';

interface ActionPanelProps {
  refreshData: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ refreshData }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isAddStudyDialogOpen, setIsAddStudyDialogOpen] = useState<boolean>(false);

  const handleAddSuccess = () => {
    refreshData();
  };

  const handleStudyAddSuccess = () => {
    // Poderia atualizar alguma estatística ou lista de estudos recentes
    // Por enquanto, apenas fechamos o diálogo
    setIsAddStudyDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Nutracêutico
        </Button>
        
        <Button onClick={() => setIsAddStudyDialogOpen(true)} className="w-full" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Adicionar Estudo Científico
        </Button>
        
        <Button onClick={refreshData} className="w-full" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Dados
        </Button>
        
        {/* Diálogo para adicionar nutracêutico */}
        <AddNutraceuticalDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleAddSuccess}
        />
        
        {/* Diálogo para adicionar estudo científico */}
        <AddScientificStudyDialog
          open={isAddStudyDialogOpen}
          onOpenChange={setIsAddStudyDialogOpen}
          onSuccess={handleStudyAddSuccess}
        />
      </CardContent>
    </Card>
  );
};

export default ActionPanel;
