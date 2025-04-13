
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

  const onSubmit = (data: FormValues) => {
    // Inicia o processamento da IA
    setStep('processing');
    
    // Simulação do tempo de processamento
    setTimeout(() => {
      onEstudoAdicionado();
    }, 8000);
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
          <AIProcessingVisualization />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarEstudoDialog;
