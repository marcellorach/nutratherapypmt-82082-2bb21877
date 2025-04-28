
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/nutraceuticals/useCategories';

// Schema de validação
const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const { createCategory } = useCategories();
  
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
      await createCategory({
        name: values.name,
        description: values.description
      });
      
      form.reset();
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Polifenóis, Ácidos Graxos, etc." />
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
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descreva brevemente esta categoria de nutracêutico"
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
                {isSubmitting ? 'Salvando...' : 'Salvar Categoria'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;
