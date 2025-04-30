
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpreadsheetImport from './SpreadsheetImport';
import ImportResultsView from './ImportResultsView';
import { useToast } from '@/hooks/use-toast';
import PdfUploadZone from '@/components/administrador/estudos/import/PdfUploadZone';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';
import { supabase } from '@/integrations/supabase/client';

interface NutraceuticalImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const NutraceuticalImportDialog: React.FC<NutraceuticalImportDialogProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [importResults, setImportResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('spreadsheet');
  const [pdfFiles, setPdfFiles] = useState<StudyPdfFile[]>([]);
  const { toast } = useToast();

  // Reset do diálogo quando é fechado
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetDialog();
      }, 300); // Pequeno delay para evitar visualização do reset durante a animação de fechamento
    }
  }, [open]);

  const handleProcessingComplete = async (results: any) => {
    // Se temos arquivos PDF de estudos para processar
    if (pdfFiles.length > 0) {
      try {
        // Fazer upload dos PDFs para o storage
        const uploadedFiles = await Promise.all(pdfFiles.map(async (pdfFile) => {
          const fileName = `studies/${Date.now()}_${pdfFile.name}`;
          
          // Upload para o Storage do Supabase
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('scispace')
            .upload(fileName, pdfFile.file);
            
          if (uploadError) {
            throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
          }
          
          // Obter URL pública para o arquivo
          const { data: { publicUrl } } = supabase.storage
            .from('scispace')
            .getPublicUrl(fileName);
            
          // Criar registro do estudo processado para associação futura
          const { data: studyRecord, error: studyError } = await supabase
            .from('processed_studies')
            .insert({
              study_id: fileName,
              original_filename: pdfFile.name,
              storage_path: fileName,
              title: pdfFile.name.replace(/\.[^/.]+$/, ""),
              description: `Estudo PDF associado à importação de nutracêuticos: ${pdfFile.name}`,
              journal: 'Importação de Nutracêuticos',
              kanban_status: 'new',
              processed_by: 'import',
              import_type: 'manual'
            })
            .select()
            .single();
            
          if (studyError) {
            console.error('Erro ao registrar estudo:', studyError);
          }
            
          return {
            id: studyRecord?.id || pdfFile.id,
            name: pdfFile.name,
            path: fileName,
            url: publicUrl,
            nutraceuticalId: pdfFile.nutraceuticalId || null,
            conditionId: pdfFile.conditionId || null
          };
        }));
        
        // Adicionar informações dos PDFs ao resultado
        results.studyFiles = uploadedFiles;
      } catch (error) {
        console.error('Erro ao processar PDFs:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar arquivos de estudos científicos",
          variant: "destructive"
        });
      }
    }
    
    setImportResults(results);
    setStep('review');
  };

  const handleImportConfirm = () => {
    toast({
      title: "Importação concluída",
      description: "Dados importados com sucesso no banco de nutracêuticos.",
    });
    
    if (onImportComplete) {
      onImportComplete();
    }
    
    // Aguardar um momento para garantir que o toast seja exibido antes de fechar
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  };

  const resetDialog = () => {
    setStep('upload');
    setImportResults(null);
    setPdfFiles([]);
    setActiveTab('spreadsheet');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };
  
  // Manipulador para alterações nos arquivos PDF
  const handlePdfFilesChange = (files: StudyPdfFile[]) => {
    setPdfFiles(files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' ? 'Importar Nutracêuticos e Estudos' : 'Revisar Dados Importados'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' 
              ? 'Importe planilhas de dados de nutracêuticos e PDFs de estudos científicos para processamento via IA.'
              : 'Revise os dados extraídos pela IA antes de confirmar a importação.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' && (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="spreadsheet">Planilha de Nutracêuticos</TabsTrigger>
                <TabsTrigger value="studies">Estudos Científicos (PDF)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="spreadsheet" className="py-4">
                <SpreadsheetImport 
                  onImportComplete={handleProcessingComplete} 
                  hasPdfFiles={pdfFiles.length > 0}
                />
              </TabsContent>
              
              <TabsContent value="studies" className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium mb-2">Estudos Científicos em PDF</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Faça o upload dos PDFs dos estudos científicos citados na planilha de nutracêuticos.
                      Estes estudos serão importados para processamento NTAI e associados automaticamente aos nutracêuticos.
                    </p>
                  </div>
                  
                  <PdfUploadZone
                    files={pdfFiles}
                    onFilesChange={handlePdfFilesChange}
                    maxFiles={20}
                    acceptedFileTypes={['application/pdf']}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          {step === 'review' && importResults && (
            <ImportResultsView 
              results={importResults} 
              onImport={handleImportConfirm}
              onCancel={() => setStep('upload')} 
              studyFiles={pdfFiles}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NutraceuticalImportDialog;
