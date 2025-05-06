
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import ConditionsTab from './relationships/ConditionsTab';
import StudiesTab from './relationships/StudiesTab';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';

interface ManageRelationshipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical: any;
  onSuccess?: () => void;
  initialTab?: 'conditions' | 'studies';
}

/**
 * Diálogo para gerenciar as relações de um nutracêutico com
 * condições de saúde e estudos científicos
 */
const ManageRelationshipsDialog: React.FC<ManageRelationshipsDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  onSuccess,
  initialTab = 'conditions'
}) => {
  const [activeTab, setActiveTab] = useState<'conditions' | 'studies'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const { 
    conditions,
    isLoading: conditionsLoading,
    fetchConditions 
  } = useConditions();
  
  const { 
    studies,
    isLoading: studiesLoading,
    fetchStudies
  } = useStudies();
  
  // Carregar dados necessários quando o diálogo abrir
  useEffect(() => {
    if (open) {
      fetchConditions();
      fetchStudies();
    }
  }, [open, fetchConditions, fetchStudies]);
  
  const handleClose = () => {
    onOpenChange(false);
    
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Relações - {nutraceutical?.name}</DialogTitle>
          <DialogDescription>
            Associe condições de saúde e estudos científicos a este nutracêutico.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value: 'conditions' | 'studies') => setActiveTab(value)} className="mt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="conditions">Condições de Saúde</TabsTrigger>
            <TabsTrigger value="studies">Estudos Científicos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conditions">
            <ConditionsTab 
              nutraceutical={nutraceutical}
              conditions={conditions}
              isLoading={conditionsLoading}
            />
          </TabsContent>
          
          <TabsContent value="studies">
            <StudiesTab 
              nutraceutical={nutraceutical}
              studies={studies}
              isLoading={studiesLoading}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageRelationshipsDialog;
