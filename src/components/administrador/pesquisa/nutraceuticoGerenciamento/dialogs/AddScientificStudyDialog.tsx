
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useStudies } from '@/hooks/nutraceuticals/useStudies';
import { Loader2, FileText } from 'lucide-react';
import PdfUploadZone from '@/components/administrador/estudos/import/PdfUploadZone';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Schema de validação
const currentYear = new Date().getFullYear();

const formSchema = z.object({
  title: z.string().min(5, 'O título deve ter no mínimo 5 caracteres'),
  link: z.string().url('Deve ser uma URL válida').optional().or(z.literal('')),
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
  nutraceuticalId?: string;
}

const AddScientificStudyDialog: React.FC<AddScientificStudyDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess,
  nutraceuticalId
}) => {
  const { createStudy } = useStudies();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [pdfFiles, setPdfFiles] = useState<StudyPdfFile[]>([]);
  const { toast } = useToast();
  
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

  // Reset do estado quando o diálogo é fechado
  useEffect(() => {
    if (!open) {
      setPdfFiles([]);
      form.reset();
    }
  }, [open, form]);

  // Manipulador para alterações nos arquivos PDF
  const handlePdfFilesChange = (files: StudyPdfFile[]) => {
    setPdfFiles(files);
  };

  // Função para atualizar o status de upload de um arquivo
  const updateFileStatus = (fileId: string, status: 'queued' | 'uploading' | 'error' | 'complete', progress?: number) => {
    setPdfFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, status, uploadProgress: progress !== undefined ? progress : file.uploadProgress } 
          : file
      )
    );
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);
      console.log('Enviando dados do formulário:', values);
      
      // Processamento de autores
      const authors = values.authors 
        ? values.authors.split(',').map(author => author.trim()) 
        : [];
      
      // Se temos um arquivo, atualizar seu status
      if (pdfFiles.length > 0) {
        updateFileStatus(pdfFiles[0].id, 'uploading', 10);
        
        // Simular progresso de upload
        let progress = 10;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 90) {
            updateFileStatus(pdfFiles[0].id, 'uploading', progress);
          } else {
            clearInterval(interval);
          }
        }, 300);
      }
      
      const studyData = {
        title: values.title,
        link: values.link || undefined,
        year: values.year,
        journal: values.journal || undefined,
        abstract: values.abstract || undefined,
        authors: authors.length > 0 ? authors : undefined,
        file: pdfFiles.length > 0 ? pdfFiles[0].file : undefined,
        nutraceuticalId: nutraceuticalId
      };
      
      console.log('Dados do estudo formatados:', studyData);
      
      const result = await createStudy(studyData);
      console.log('Estudo criado com sucesso:', result);
      
      // Atualizar status para completo
      if (pdfFiles.length > 0) {
        updateFileStatus(pdfFiles[0].id, 'complete', 100);
      }
      
      toast({
        title: "Sucesso!",
        description: "Estudo científico adicionado com sucesso.",
      });
      
      // Pequeno atraso antes de fechar o modal para mostrar o status de sucesso
      setTimeout(() => {
        form.reset();
        setPdfFiles([]);
        
        if (onSuccess) {
          onSuccess();
        } else {
          onOpenChange(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao criar estudo científico:', error);
      
      // Atualizar status para erro
      if (pdfFiles.length > 0) {
        updateFileStatus(pdfFiles[0].id, 'error');
      }
      
      toast({
        title: "Erro!",
        description: "Não foi possível adicionar o estudo científico.",
        variant: "destructive"
      });
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Estudo Científico</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="info">Informações do Estudo</TabsTrigger>
            <TabsTrigger value="file">Arquivo do Estudo</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
              <TabsContent value="info" className="space-y-4">
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
                        <FormLabel>Link para o Estudo (opcional)</FormLabel>
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
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div>
                  <FormLabel className="text-base">Arquivo do Estudo</FormLabel>
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça upload do arquivo PDF completo do estudo científico.
                    Este arquivo será armazenado e associado ao estudo.
                  </p>
                  
                  <PdfUploadZone 
                    files={pdfFiles}
                    onFilesChange={handlePdfFilesChange}
                    maxFiles={1}
                    acceptedFileTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                  />
                  
                  {pdfFiles.length > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium">Arquivo selecionado: {pdfFiles[0].name}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <Separator className="my-4" />
              
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddScientificStudyDialog;
