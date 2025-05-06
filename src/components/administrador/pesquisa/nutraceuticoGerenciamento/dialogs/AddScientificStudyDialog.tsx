
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { Loader2 } from 'lucide-react';

// Schema de validação
const currentYear = new Date().getFullYear();

const formSchema = z.object({
  title: z.string().min(5, 'O título deve ter no mínimo 5 caracteres'),
  link: z.string().url('Deve ser uma URL válida'),
  year: z.coerce
    .number()
    .int('O ano deve ser um número inteiro')
    .min(1900, 'O ano deve ser posterior a 1900')
    .max(currentYear, `O ano não pode ser posterior a ${currentYear}`),
  journal: z.string().optional(),
  abstract: z.string().optional(),
  authors: z.string().optional(),
});

// Tipagem para os dados do formulário
type FormData = z.infer<typeof formSchema>;

interface AddScientificStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddScientificStudyDialog: React.FC<AddScientificStudyDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const { createStudy } = useStudies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inicialização do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      link: '',
      year: currentYear,
      journal: '',
      abstract: '',
      authors: '',
    }
  });

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      console.log('Enviando dados do formulário:', values);
      
      // Processamento de autores
      const authors = values.authors 
        ? values.authors.split(',').map(author => author.trim()) 
        : [];
      
      const studyData = {
        title: values.title,
        link: values.link,
        year: values.year,
        journal: values.journal || undefined,
        abstract: values.abstract || undefined,
        authors: authors.length > 0 ? authors : undefined
      };
      
      console.log('Dados do estudo formatados:', studyData);
      
      await createStudy(studyData);
      console.log('Estudo criado com sucesso');
      
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao criar estudo científico:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isSubmitting) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Estudo Científico</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Estudo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Título completo do estudo científico" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link para o Estudo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Publicação</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder={currentYear.toString()} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="journal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revista ou Publicação (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome da revista ou jornal científico" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="authors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autores (opcional, separados por vírgula)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: Silva, J., Pereira, A., Santos, M."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Resumo ou abstract do estudo científico"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => !isSubmitting && onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Estudo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddScientificStudyDialog;
