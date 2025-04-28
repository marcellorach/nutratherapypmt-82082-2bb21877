
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import AddNutraceuticalDialog from './dialogs/AddNutraceuticalDialog';
import AddCategoryDialog from './dialogs/AddCategoryDialog';
import AddConditionDialog from './dialogs/AddConditionDialog';
import AddScientificStudyDialog from './dialogs/AddScientificStudyDialog';

interface ActionPanelProps {
  refreshData?: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ refreshData }) => {
  const [addNutraceuticalOpen, setAddNutraceuticalOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addConditionOpen, setAddConditionOpen] = useState(false);
  const [addStudyOpen, setAddStudyOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setAddNutraceuticalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Nutracêutico
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setAddCategoryOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setAddConditionOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Condição de Saúde
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setAddStudyOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Estudo Científico
          </Button>
        </CardContent>
      </Card>

      {/* Diálogos para adição de dados */}
      <AddNutraceuticalDialog 
        open={addNutraceuticalOpen} 
        onOpenChange={setAddNutraceuticalOpen}
        onSuccess={refreshData}
      />
      <AddCategoryDialog 
        open={addCategoryOpen} 
        onOpenChange={setAddCategoryOpen}
        onSuccess={refreshData}
      />
      <AddConditionDialog 
        open={addConditionOpen} 
        onOpenChange={setAddConditionOpen}
        onSuccess={refreshData}
      />
      <AddScientificStudyDialog 
        open={addStudyOpen} 
        onOpenChange={setAddStudyOpen}
        onSuccess={refreshData}
      />
    </>
  );
};

export default ActionPanel;
