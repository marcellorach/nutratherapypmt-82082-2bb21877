
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import AddNutraceuticalDialog from './dialogs/AddNutraceuticalDialog';

interface ActionPanelProps {
  refreshData: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ refreshData }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);

  const handleAddSuccess = () => {
    refreshData();
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
      </CardContent>
    </Card>
  );
};

export default ActionPanel;
