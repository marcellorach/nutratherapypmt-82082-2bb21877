
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AIProcessingVisualization from '../visualizations/AIProcessingVisualization';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface AdicionarEstudoDialogProps {
  open: boolean;
  onClose: () => void;
  onEstudoAdicionado: () => void;
}

const formSchema = z.object({
  title: z.string().min(1),
  journal: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  description: z.string().min(10),
  abstract: z.string().min(50),
  url: z.string().url().optional().or(z.literal('')),
  file: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AdicionarEstudoDialog: React.FC<AdicionarEstudoDialogProps> = ({ open, onClose, onEstudoAdicionado }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'processing'>('form');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', journal: '', year: new Date().getFullYear().toString(), description: '', abstract: '', url: '' },
  });

  const simulateAIProcessing = async () => {
    const stages = [
      { key: 'extractingText', end: 25, delay: 80 },
      { key: 'analyzingContent', end: 60, delay: 60 },
      { key: 'identifyingNutraceuticals', end: 75, delay: 70 },
      { key: 'correlatingConditions', end: 90, delay: 70 },
      { key: 'preparingCard', end: 100, delay: 50 },
    ];

    let current = 0;
    for (const stage of stages) {
      setProcessingStage(t(`adicionarEstudoDialog.stages.${stage.key}`));
      for (let i = current; i <= stage.end; i++) {
        setProcessingProgress(i);
        await new Promise(r => setTimeout(r, stage.delay));
      }
      current = stage.end + 1;
    }

    setProcessingStage(t('adicionarEstudoDialog.stages.completed'));
    await new Promise(r => setTimeout(r, 1000));
    onEstudoAdicionado();
  };

  const onSubmit = async () => {
    setStep('processing');
    try {
      await simulateAIProcessing();
      toast({ title: t('adicionarEstudoDialog.toasts.successTitle'), description: t('adicionarEstudoDialog.toasts.successDesc') });
    } catch (error) {
      console.error("Error processing study:", error);
      toast({ title: t('adicionarEstudoDialog.toasts.errorTitle'), description: t('adicionarEstudoDialog.toasts.errorDesc'), variant: "destructive" });
    }
  };

  const logEntries = [
    { threshold: 10, key: 'startProcessing' },
    { threshold: 25, key: 'textExtractionComplete' },
    { threshold: 40, key: 'analyzingWithAI' },
    { threshold: 60, key: 'analysisComplete' },
    { threshold: 70, key: 'identifiedNutraceuticals' },
    { threshold: 80, key: 'correlating' },
    { threshold: 90, key: 'generatingTags' },
    { threshold: 100, key: 'processingComplete' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 'form' ? t('adicionarEstudoDialog.titleForm') : t('adicionarEstudoDialog.titleProcessing')}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'form' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('adicionarEstudoDialog.studyTitle')}</FormLabel>
                    <FormControl><Input placeholder={t('adicionarEstudoDialog.studyTitlePlaceholder')} {...field} /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="journal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('adicionarEstudoDialog.journal')}</FormLabel>
                      <FormControl><Input placeholder={t('adicionarEstudoDialog.journalPlaceholder')} {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('adicionarEstudoDialog.year')}</FormLabel>
                      <FormControl><Input placeholder={t('adicionarEstudoDialog.yearPlaceholder')} {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adicionarEstudoDialog.shortDescription')}</FormLabel>
                  <FormControl><Input placeholder={t('adicionarEstudoDialog.shortDescriptionPlaceholder')} {...field} /></FormControl>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="abstract" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adicionarEstudoDialog.abstract')}</FormLabel>
                  <FormControl><Textarea placeholder={t('adicionarEstudoDialog.abstractPlaceholder')} className="min-h-[120px]" {...field} /></FormControl>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adicionarEstudoDialog.studyUrl')}</FormLabel>
                  <FormControl><Input placeholder={t('adicionarEstudoDialog.studyUrlPlaceholder')} {...field} /></FormControl>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="file" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adicionarEstudoDialog.pdfUpload')}</FormLabel>
                  <FormControl><Input type="file" accept=".pdf" onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl>
                </FormItem>
              )} />

              <Button type="button" className="w-full mt-4" onClick={form.handleSubmit(onSubmit)}>
                {t('adicionarEstudoDialog.submitToAI')}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="py-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">{processingStage}</h3>
              <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${processingProgress}%` }}></div>
              </div>
              <div className="text-right text-sm text-muted-foreground">{processingProgress}%</div>
            </div>
            
            <AIProcessingVisualization progress={processingProgress} stage={processingStage} />
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-2">{t('adicionarEstudoDialog.processingLog')}</h4>
              <div className="bg-muted/50 p-4 rounded text-xs font-mono h-24 overflow-y-auto">
                {logEntries.map(entry => 
                  processingProgress >= entry.threshold && (
                    <div key={entry.key}>[{new Date().toLocaleTimeString()}] {t(`adicionarEstudoDialog.log.${entry.key}`)}</div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarEstudoDialog;
