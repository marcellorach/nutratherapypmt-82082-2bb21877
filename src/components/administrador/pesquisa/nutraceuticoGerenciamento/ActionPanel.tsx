
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddNutraceuticalDialog from './dialogs/AddNutraceuticalDialog';

interface ActionPanelProps {
  refreshData: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ refreshData }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: 'Dados atualizados',
        description: 'Os dados foram atualizados com sucesso',
      });
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar os dados',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Nutracêutico
          </Button>
          
          <Button 
            onClick={handleRefresh}
            className="w-full justify-start"
            variant="outline"
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
          </Button>
          
          <Button 
            className="w-full justify-start"
            variant="outline"
            onClick={() => {
              toast({
                title: 'Importação',
                description: 'Funcionalidade de importação será implementada em breve',
              });
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar Dados
          </Button>
        </CardContent>
      </Card>
      
      <AddNutraceuticalDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={refreshData}
      />
    </>
  );
};

export default ActionPanel;
