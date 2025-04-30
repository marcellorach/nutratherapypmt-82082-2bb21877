
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Check, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Componentes refatorados
import DropZoneArea from './DropZoneArea';
import FilePreview from './FilePreview';
import CsvPreview from './CsvPreview';
import ProcessingProgress from './ProcessingProgress';
import StudiesNotification from './StudiesNotification';
import ErrorAlert from './ErrorAlert';

interface SpreadsheetImportProps {
  onImportComplete: (result: any) => void;
  hasPdfFiles?: boolean;
}

const SpreadsheetImport: React.FC<SpreadsheetImportProps> = ({
  onImportComplete,
  hasPdfFiles = false
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      setError(null);
      
      // Exibir preview se for um CSV
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            const headers = lines[0].split(',').map(h => h.trim());
            
            const previewRows = lines.slice(1, Math.min(6, lines.length)).map(line => {
              const values = line.split(',').map(v => v.trim());
              return headers.reduce((obj: any, header, index) => {
                obj[header] = values[index];
                return obj;
              }, {});
            });
            
            setPreviewData(previewRows);
          } catch (err) {
            console.error('Erro ao processar CSV:', err);
            setError('Erro ao processar arquivo CSV');
          }
        };
        reader.readAsText(file);
      } else {
        // Para arquivos Excel, somente mostramos o nome
        setPreviewData(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const processFile = async () => {
    if (!file) return;
    
    setProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      console.log("Iniciando processamento do arquivo:", file.name);
      
      // Iniciar progressão simulada
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 300);
      
      // Upload para storage temporário
      const fileName = `temp_import/${Date.now()}_${file.name}`;
      console.log("Fazendo upload para:", fileName);
      
      const { data, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error("Erro de upload:", uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }
      
      console.log("Upload bem-sucedido:", data);
      
      // Obter URL pública para o arquivo
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      console.log("URL pública gerada:", publicUrl);
      
      // Processar via Edge Function
      console.log("Chamando Edge Function para processamento...");
      const { data: processedData, error: processError } = await supabase.functions.invoke('process-nutraceutical-spreadsheet', {
        body: { 
          fileUrl: publicUrl, 
          fileName: file.name,
          // Adicionar flag para indicar que há PDFs associados
          hasStudyFiles: hasPdfFiles
        }
      });
      
      if (processError) {
        console.error("Erro na Edge Function:", processError);
        throw new Error(`Erro ao processar: ${processError.message}`);
      }
      
      console.log("Dados processados:", processedData);
      
      clearInterval(interval);
      setProgress(100);
      
      toast({
        title: "Processamento concluído",
        description: `${processedData.nutraceuticalsCount || 0} nutracêuticos identificados com ${processedData.relationsCount || 0} relações e ${processedData.studiesCount || 0} estudos científicos.`,
      });
      
      // Callback com os resultados do processamento
      onImportComplete(processedData);
    } catch (err: any) {
      console.error("Erro completo:", err);
      setError(err.message || 'Erro ao processar arquivo');
      
      toast({
        title: "Erro no processamento",
        description: err.message || 'Ocorreu um erro ao processar o arquivo',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Importar Dados de Nutracêuticos
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <DropZoneArea
          onDrop={onDrop}
          isDragActive={isDragActive}
          getInputProps={getInputProps}
          getRootProps={getRootProps}
        />

        {file && (
          <div className="mt-4">
            <FilePreview file={file} />
            
            <CsvPreview previewData={previewData} />
            
            <StudiesNotification hasPdfFiles={hasPdfFiles} />
            
            <ErrorAlert error={error} />
            
            <ProcessingProgress progress={progress} processing={processing} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          className="mr-2"
          onClick={() => {
            setFile(null);
            setPreviewData(null);
            setError(null);
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={processFile}
          disabled={!file || processing}
          className="gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {file ? 'Processar' : 'Selecione um arquivo'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SpreadsheetImport;
