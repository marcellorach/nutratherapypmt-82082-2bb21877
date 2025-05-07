
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNutraceuticals } from '@/hooks/nutraceuticals/useNutraceuticals';

// Importando os componentes de cada tab
import BasicInfoTab from './tabs/BasicInfoTab';
import RelationshipsTab from './tabs/RelationshipsTab';
import ManageRelationshipsDialog from './ManageRelationshipsDialog';

// Schema de validação
const nutraceuticalSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  description: z.string().optional(),
  dosage: z.string().optional(),
  source: z.string().optional(),
  chemical_compound: z.string().optional(),
  contraindications: z.string().optional()
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof nutraceuticalSchema>;

interface AddNutraceuticalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nutraceutical?: any;  // Se fornecido, é modo de edição
  onSuccess?: () => void;
}

const AddNutraceuticalDialog: React.FC<AddNutraceuticalDialogProps> = ({
  open,
  onOpenChange,
  nutraceutical,
  onSuccess
}) => {
  const { toast } = useToast();
  const { createNutraceutical, updateNutraceutical } = useNutraceuticals();
  
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRelationshipsDialogOpen, setIsRelationshipsDialogOpen] = useState(false);
  const [savedNutraceutical, setSavedNutraceutical] = useState<any>(null);
  
  // Modo de edição ou criação
  const isEditMode = Boolean(nutraceutical);
  
  // Inicialização do formulário
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

  // Preencher o formulário se estivermos em modo de edição
  useEffect(() => {
    if (isEditMode && nutraceutical) {
      // Transformar array de contraindicações em string, se necessário
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
  
  // Resetar o formulário quando o diálogo é fechado
  useEffect(() => {
    if (!open) {
      form.reset();
      setActiveTab('basic-info');
      setSavedNutraceutical(null);
    }
  }, [open, form]);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      console.log('Enviando formulário:', values);
      
      // Preparar dados para salvar
      const nutraceuticalData = {
        ...values,
        // Converter string de contraindicações em array
        contraindications: values.contraindications 
          ? values.contraindications.split('\n').filter(item => item.trim() !== '') 
          : []
      };
      
      let result;
      
      if (isEditMode) {
        // Atualizar nutracêutico existente
        console.log('Atualizando nutracêutico:', nutraceutical.id);
        result = await updateNutraceutical(nutraceutical.id, nutraceuticalData);
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico atualizado com sucesso",
        });
      } else {
        // Criar novo nutracêutico
        console.log('Criando novo nutracêutico');
        result = await createNutraceutical(nutraceuticalData);
        
        toast({
          title: "Sucesso",
          description: "Nutracêutico criado com sucesso",
        });
      }
      
      console.log('Resultado da operação:', result);
      
      // Se sucesso, vamos para a tab de relacionamentos
      if (result && result.id) {
        setSavedNutraceutical(result);
        setActiveTab('relationships');
      } else {
        // Se não tem resultado ou ID, fechamos o diálogo
        if (onSuccess) {
          onSuccess();
        } else {
          onOpenChange(false);
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar nutracêutico:', error);
      
      toast({
        title: "Erro",
        description: "Não foi possível salvar o nutracêutico. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para finalizar o diálogo
  const handleFinish = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onOpenChange(false);
    }
  };

  // Função para abrir o diálogo de relacionamentos
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
            <DialogTitle>{isEditMode ? "Editar Nutracêutico" : "Adicionar Novo Nutracêutico"}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="basic-info">Informações Básicas</TabsTrigger>
              <TabsTrigger 
                value="relationships" 
                disabled={!isEditMode && !savedNutraceutical}
              >
                Relacionamentos
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
      
      {/* Diálogo para gerenciar relações (estudos e condições) */}
      {(savedNutraceutical || nutraceutical) && (
        <ManageRelationshipsDialog
          open={isRelationshipsDialogOpen}
          onOpenChange={setIsRelationshipsDialogOpen}
          nutraceutical={savedNutraceutical || nutraceutical}
          onSuccess={() => {
            // Recarregar dados após alterações
            setIsRelationshipsDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default AddNutraceuticalDialog;
