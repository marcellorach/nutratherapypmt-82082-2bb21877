
import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNutraceuticals } from '@/hooks/nutraceuticals/useNutraceuticals';
import { useOutcomes } from '@/hooks/nutraceuticals/useOutcomes';

// Schema de validação
const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  outcome_id: z.string().optional(),
  dosage: z.string().optional(),
  source: z.string().optional(),
  chemical_compound: z.string().optional(),
  contraindications: z.string().optional(),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

interface AddNutraceuticalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddNutraceuticalDialog: React.FC<AddNutraceuticalDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const { createNutraceutical } = useNutraceuticals();
  const { outcomes, fetchOutcomes } = useOutcomes();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchOutcomes();
    }
  }, [open, fetchOutcomes]);
  
  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      outcome_id: undefined,
      dosage: '',
      source: '',
      chemical_compound: '',
      contraindications: '',
    }
  });
  
  const { isSubmitting } = form.formState;

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Processamento de contraindicações
      const contraindications = values.contraindications 
        ? values.contraindications.split(',').map(item => item.trim()) 
        : [];
        
      await createNutraceutical({
        name: values.name,
        description: values.description || undefined,
        outcome_id: values.outcome_id || undefined,
        dosage: values.dosage || undefined,
        source: values.source || undefined,
        chemical_compound: values.chemical_compound || undefined,
        contraindications: contraindications.length > 0 ? contraindications : undefined
      });
      
      form.reset();
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar nutracêutico:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Nutracêutico</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Nutracêutico</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Resveratrol, Ômega-3, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="outcome_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem outcome</SelectItem>
                      {outcomes.map((outcome) => (
                        <SelectItem key={outcome.id} value={outcome.id || "none"}>
                          {outcome.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descreva o nutracêutico e suas propriedades principais"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chemical_compound"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Composto Químico</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Fórmula ou nome químico" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte Natural</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Uva, Nozes, Peixes, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dosage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosagem Recomendada</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 500mg diários, 2-5g por dia, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contraindications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraindicações (separadas por vírgula)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Ex: Gravidez, Lactação, Uso de anticoagulantes, etc."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {(isSubmitting || loading) ? 'Salvando...' : 'Salvar Nutracêutico'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNutraceuticalDialog;
