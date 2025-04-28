
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConditions } from '@/hooks/nutraceuticals/useConditions';

// Schema de validação
const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ser mais detalhada'),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

interface AddConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddConditionDialog: React.FC<AddConditionDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const { createCondition } = useConditions();
  
  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });
  
  const { isSubmitting } = form.formState;

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    try {
      await createCondition({
        name: values.name,
        description: values.description
      });
      
      form.reset();
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar condição de saúde:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Condição de Saúde</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Condição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Artrite, Diabetes, Insuficiência Cardíaca, etc." />
                  </FormControl>
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
                      placeholder="Descreva esta condição de saúde e suas características principais"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Condição'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddConditionDialog;
