
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import OutcomesTab from './relationships/OutcomesTab';
import StudiesTab from './relationships/StudiesTab';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';

interface ManageRelationshipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical: any;
  onSuccess?: () => void;
  initialTab?: 'outcomes' | 'studies';
}

/**
 * Diálogo para gerenciar as relações de um nutracêutico com
 * outcomes e estudos científicos
 */
const ManageRelationshipsDialog: React.FC<ManageRelationshipsDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  onSuccess,
  initialTab = 'studies'
}) => {
  const [activeTab, setActiveTab] = useState<'outcomes' | 'studies'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Carregar dados necessários
  const { conditions, fetchConditions, isLoading: isLoadingConditions } = useConditions();
  const { studies, fetchStudies, isLoading: isLoadingStudies } = useStudies();
  
  // Carregar dados quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      console.log('Carregando dados para o diálogo de relações');
      fetchConditions();
      fetchStudies();
    }
  }, [open]);
  
  // Handler para quando uma operação é concluída com sucesso
  const handleSuccess = () => {
    if (onSuccess) {
      console.log('Relações atualizadas com sucesso, chamando callback de sucesso');
      onSuccess();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            Gerenciar Relações para: {nutraceutical?.name}
          </DialogTitle>
          <DialogDescription>
            Associar outcomes e estudos científicos a este nutracêutico
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'outcomes' | 'studies')}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="outcomes">
              Outcomes
            </TabsTrigger>
            <TabsTrigger value="studies">
              Estudos Científicos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="outcomes">
            <OutcomesTab 
              nutraceutical={nutraceutical}
              conditions={conditions}
              isLoading={isLoadingConditions}
              onSuccess={handleSuccess}
            />
          </TabsContent>
          
          <TabsContent value="studies">
            <StudiesTab 
              nutraceutical={nutraceutical}
              studies={studies}
              isLoading={isLoadingStudies}
              onSuccess={handleSuccess}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageRelationshipsDialog;
