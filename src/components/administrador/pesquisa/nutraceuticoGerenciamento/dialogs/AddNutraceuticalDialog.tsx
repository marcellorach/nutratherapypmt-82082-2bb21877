
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNutraceuticals } from '@/hooks/nutraceuticals/useNutraceuticals';
import { useTranslation } from 'react-i18next';

// Importando os componentes de cada tab
import BasicInfoTab from './tabs/BasicInfoTab';
import RelationshipsTab from './tabs/RelationshipsTab';
import ManageRelationshipsDialog from './ManageRelationshipsDialog';

// Tipagem para os dados do formulário
type FormData = {
  name: string;
  description?: string;
  dosage?: string;
  source?: string;
  chemical_compound?: string;
  contraindications?: string;
};

interface AddNutraceuticalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical?: any;
  onSuccess?: () => void;
}

const AddNutraceuticalDialog: React.FC<AddNutraceuticalDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { createNutraceutical, updateNutraceutical } = useNutraceuticals();
  
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRelationshipsDialogOpen, setIsRelationshipsDialogOpen] = useState(false);
  const [savedNutraceutical, setSavedNutraceutical] = useState<any>(null);
  
  const isEditMode = Boolean(nutraceutical);
  
  // Schema de validação
  const nutraceuticalSchema = z.object({
    name: z.string().min(1, t('addNutraceuticalDialog.validation.nameRequired')),
    description: z.string().optional(),
    dosage: z.string().optional(),
    source: z.string().optional(),
    chemical_compound: z.string().optional(),
    contraindications: z.string().optional()
  });

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
          title: t('addNutraceuticalDialog.toasts.successTitle'),
          description: t('addNutraceuticalDialog.toasts.updated'),
        });
      } else {
        result = await createNutraceutical({
          name: values.name || '',
          ...nutraceuticalData
        });
        toast({
          title: t('addNutraceuticalDialog.toasts.successTitle'),
          description: t('addNutraceuticalDialog.toasts.created'),
        });
      }
      
      if (result && result.id) {
        setSavedNutraceutical(result);
        setActiveTab('relationships');
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
        title: t('addNutraceuticalDialog.toasts.errorTitle'),
        description: t('addNutraceuticalDialog.toasts.errorDescription'),
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

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isSubmitting) onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t('addNutraceuticalDialog.editTitle') : t('addNutraceuticalDialog.addTitle')}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="basic-info">{t('addNutraceuticalDialog.basicInfo')}</TabsTrigger>
              <TabsTrigger 
                value="relationships" 
                disabled={!isEditMode && !savedNutraceutical}
              >
                {t('addNutraceuticalDialog.relationships')}
              </TabsTrigger>
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
              
              <TabsContent value="relationships">
                <RelationshipsTab 
                  nutraceutical={savedNutraceutical || nutraceutical}
                  onOpenRelationshipsDialog={handleOpenRelationshipsDialog}
                  onFinish={handleFinish}
                />
              </TabsContent>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {(savedNutraceutical || nutraceutical) && (
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

export default AddNutraceuticalDialog;
