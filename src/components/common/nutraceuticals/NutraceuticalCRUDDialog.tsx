
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNutraceuticalContext } from '@/contexts/NutraceuticalContext';
import { useTranslation } from 'react-i18next';

// Importando componentes específicos
import BasicInfoTab from '@/components/administrador/pesquisa/nutraceuticoGerenciamento/dialogs/tabs/BasicInfoTab';
import RelationshipsTab from '@/components/administrador/pesquisa/nutraceuticoGerenciamento/dialogs/tabs/RelationshipsTab';
import ManageRelationshipsDialog from '@/components/administrador/pesquisa/nutraceuticoGerenciamento/dialogs/ManageRelationshipsDialog';

// Schema de validação
const nutraceuticalSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  description: z.string().optional(),
  dosage: z.string().optional(),
  source: z.string().optional(),
  chemical_compound: z.string().optional(),
  contraindications: z.string().optional()
});

type FormData = z.infer<typeof nutraceuticalSchema>;

interface NutraceuticalCRUDDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical?: any;
  onSuccess?: () => void;
  mode?: 'admin' | 'scientific';
}

const NutraceuticalCRUDDialog: React.FC<NutraceuticalCRUDDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  onSuccess,
  mode = 'scientific'
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { createNutraceutical, updateNutraceutical } = useNutraceuticalContext();
  
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRelationshipsDialogOpen, setIsRelationshipsDialogOpen] = useState(false);
  const [savedNutraceutical, setSavedNutraceutical] = useState<any>(null);
  
  const isEditMode = Boolean(nutraceutical);
  
  const form = useForm<FormData>({
    resolver: zodResolver(nutraceuticalSchema),
    defaultValues: {
      name: '',
      description: '',
      dosage: '',
      source: '',
      chemical_compound: '',
      contraindications: ''
    },
  });

  useEffect(() => {
    if (isEditMode && nutraceutical) {
      const contraindicationsString = Array.isArray(nutraceutical.contraindications)
        ? nutraceutical.contraindications.join('\n')
        : nutraceutical.contraindications || '';
        
      form.reset({
        name: nutraceutical.name || '',
        description: nutraceutical.description || '',
        dosage: nutraceutical.dosage || '',
        source: nutraceutical.source || '',
        chemical_compound: nutraceutical.chemical_compound || '',
        contraindications: contraindicationsString
      });
    }
  }, [isEditMode, nutraceutical, form]);
  
  useEffect(() => {
    if (!open) {
      form.reset();
      setActiveTab('basic-info');
      setSavedNutraceutical(null);
    }
  }, [open, form]);

  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      
      const nutraceuticalData = {
        ...values,
        contraindications: values.contraindications 
          ? values.contraindications.split('\n').filter(item => item.trim() !== '') 
          : []
      };
      
      let result;
      
      if (isEditMode) {
        result = await updateNutraceutical(nutraceutical.id, nutraceuticalData);
        toast({
          title: t('nutraceuticals.toast.success'),
          description: t('nutraceuticals.toast.updated'),
        });
      } else {
        result = await createNutraceutical({
          name: values.name || '',
          ...nutraceuticalData
        });
        toast({
          title: t('nutraceuticals.toast.success'),
          description: t('nutraceuticals.toast.created'),
        });
      }
      
      if (result && result.id) {
        setSavedNutraceutical(result);
        // No modo admin, fechamos direto. No modo científico, vamos para relacionamentos
        if (mode === 'admin') {
          if (onSuccess) {
            onSuccess();
          } else {
            onOpenChange(false);
          }
        } else {
          setActiveTab('relationships');
        }
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          onOpenChange(false);
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar nutracêutico:', error);
      toast({
        title: t('nutraceuticals.toast.error'),
        description: t('nutraceuticals.toast.error'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onOpenChange(false);
    }
  };

  const handleOpenRelationshipsDialog = () => {
    setIsRelationshipsDialogOpen(true);
  };

  // Determinar se deve mostrar a aba de relacionamentos
  const showRelationshipsTab = mode === 'scientific';

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isSubmitting) onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t('nutraceuticals.dialog.editTitle') : t('nutraceuticals.dialog.addTitle')}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid ${showRelationshipsTab ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="basic-info">{t('nutraceuticals.dialog.tabs.basicInfo')}</TabsTrigger>
              {showRelationshipsTab && (
                <TabsTrigger 
                  value="relationships" 
                  disabled={!isEditMode && !savedNutraceutical}
                >
                  {t('nutraceuticals.dialog.tabs.relationships')}
                </TabsTrigger>
              )}
            </TabsList>
            
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <TabsContent value="basic-info">
                <BasicInfoTab 
                  form={form}
                  isSubmitting={isSubmitting}
                  isEditMode={isEditMode}
                  onCancel={() => onOpenChange(false)}
                />
              </TabsContent>
              
              {showRelationshipsTab && (
                <TabsContent value="relationships">
                  <RelationshipsTab 
                    nutraceutical={savedNutraceutical || nutraceutical}
                    onOpenRelationshipsDialog={handleOpenRelationshipsDialog}
                    onFinish={handleFinish}
                  />
                </TabsContent>
              )}
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para gerenciar relações (apenas no modo científico) */}
      {showRelationshipsTab && (savedNutraceutical || nutraceutical) && (
        <ManageRelationshipsDialog
          open={isRelationshipsDialogOpen}
          onOpenChange={setIsRelationshipsDialogOpen}
          nutraceutical={savedNutraceutical || nutraceutical}
          onSuccess={() => {
            setIsRelationshipsDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default NutraceuticalCRUDDialog;
