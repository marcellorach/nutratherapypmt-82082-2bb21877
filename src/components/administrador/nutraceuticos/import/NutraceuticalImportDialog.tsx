
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SpreadsheetImport from './SpreadsheetImport';
import ImportResultsView from './ImportResultsView';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleProcessingComplete = (results: any) => {
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
    
    onOpenChange(false);
  };

  const resetDialog = () => {
    setStep('upload');
    setImportResults(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' ? 'Importar Nutracêuticos via Planilha' : 'Revisar Dados Importados'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' 
              ? 'Arraste e solte uma planilha contendo dados de nutracêuticos para processamento via IA.'
              : 'Revise os dados extraídos pela IA antes de confirmar a importação.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' && (
            <SpreadsheetImport onImportComplete={handleProcessingComplete} />
          )}
          
          {step === 'review' && importResults && (
            <ImportResultsView 
              results={importResults} 
              onImport={handleImportConfirm}
              onCancel={() => setStep('upload')} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NutraceuticalImportDialog;
