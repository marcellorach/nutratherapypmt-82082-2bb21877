
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AIProcessingVisualization from '../visualizations/AIProcessingVisualization';
import { useToast } from "@/hooks/use-toast";

interface AdicionarEstudoDialogProps {
  open: boolean;
  onClose: () => void;
  onEstudoAdicionado: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  journal: z.string().min(1, "Nome do journal é obrigatório"),
  year: z.string().regex(/^\d{4}$/, "Ano deve ter 4 dígitos"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  abstract: z.string().min(50, "Resumo deve ter pelo menos 50 caracteres"),
  url: z.string().url("URL inválida").optional().or(z.literal('')),
  file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AdicionarEstudoDialog: React.FC<AdicionarEstudoDialogProps> = ({ open, onClose, onEstudoAdicionado }) => {
  const [step, setStep] = useState<'form' | 'processing'>('form');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      journal: '',
      year: new Date().getFullYear().toString(),
      description: '',
      abstract: '',
      url: '',
    },
  });

  const simulateAIProcessing = async () => {
    // Estágio 1: Extração de texto
    setProcessingStage('Extraindo texto do documento');
    
    for (let i = 0; i <= 25; i++) {
      setProcessingProgress(i);
      await new Promise(r => setTimeout(r, 80));
    }
    
    // Estágio 2: Análise de conteúdo
    setProcessingStage('Analisando conteúdo com IA');
    
    for (let i = 26; i <= 60; i++) {
      setProcessingProgress(i);
      await new Promise(r => setTimeout(r, 60));
    }
    
    // Estágio 3: Identificando nutracêuticos
    setProcessingStage('Identificando nutracêuticos e compostos');
    
    for (let i = 61; i <= 75; i++) {
      setProcessingProgress(i);
      await new Promise(r => setTimeout(r, 70));
    }
    
    // Estágio 4: Correlacionando com condições médicas
    setProcessingStage('Correlacionando com condições médicas');
    
    for (let i = 76; i <= 90; i++) {
      setProcessingProgress(i);
      await new Promise(r => setTimeout(r, 70));
    }
    
    // Estágio 5: Finalizando e preparando card
    setProcessingStage('Preparando card para o kanban');
    
    for (let i = 91; i <= 100; i++) {
      setProcessingProgress(i);
      await new Promise(r => setTimeout(r, 50));
    }
    
    // Finalização
    setProcessingStage('Processamento concluído!');
    
    // Simular tempo de conclusão visual
    await new Promise(r => setTimeout(r, 1000));
    
    // Notificar conclusão
    onEstudoAdicionado();
  };

  const onSubmit = async (data: FormValues) => {
    // Inicia o processamento da IA
    setStep('processing');
    
    try {
      // Simulação do processamento da IA
      await simulateAIProcessing();
      
      toast({
        title: "Estudo processado com sucesso",
        description: "O estudo foi analisado pela IA e adicionado ao kanban.",
      });
    } catch (error) {
      console.error("Erro ao processar o estudo:", error);
      toast({
        title: "Erro ao processar estudo",
        description: "Ocorreu um erro durante o processamento do estudo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 'form' ? 'Adicionar Novo Estudo Científico' : 'Processando Estudo com IA'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'form' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Estudo</FormLabel>
                      <FormControl>
                        <Input placeholder="Título completo do estudo" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="journal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Journal</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do journal" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input placeholder="YYYY" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Breve</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição curta do estudo" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="abstract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resumo (Abstract)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cole aqui o resumo completo do estudo científico..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Estudo (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload do PDF (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button 
                type="button" 
                className="w-full mt-4"
                onClick={form.handleSubmit(onSubmit)}
              >
                Enviar para Análise da IA
              </Button>
            </form>
          </Form>
        ) : (
          <div className="py-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">{processingStage}</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-500">{processingProgress}%</div>
            </div>
            
            <AIProcessingVisualization 
              progress={processingProgress}
              stage={processingStage}
            />
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-2">Log de Processamento:</h4>
              <div className="bg-gray-50 p-4 rounded text-xs font-mono h-24 overflow-y-auto">
                {processingProgress >= 10 && <div>[{new Date().toLocaleTimeString()}] Iniciando processamento do documento...</div>}
                {processingProgress >= 25 && <div>[{new Date().toLocaleTimeString()}] Extração de texto concluída com sucesso.</div>}
                {processingProgress >= 40 && <div>[{new Date().toLocaleTimeString()}] Analisando conteúdo com modelo de IA...</div>}
                {processingProgress >= 60 && <div>[{new Date().toLocaleTimeString()}] Análise de conteúdo concluída.</div>}
                {processingProgress >= 70 && <div>[{new Date().toLocaleTimeString()}] Identificados 3 nutracêuticos principais.</div>}
                {processingProgress >= 80 && <div>[{new Date().toLocaleTimeString()}] Correlacionando com 2 condições médicas...</div>}
                {processingProgress >= 90 && <div>[{new Date().toLocaleTimeString()}] Gerando tags e metadados para o card.</div>}
                {processingProgress >= 100 && <div>[{new Date().toLocaleTimeString()}] Processamento concluído. Card adicionado ao kanban.</div>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarEstudoDialog;
