
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SpreadsheetImportProps {
  onImportComplete: (result: any) => void;
}

const SpreadsheetImport: React.FC<SpreadsheetImportProps> = ({ onImportComplete }) => {
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
      
      // Ler o conteúdo do arquivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload para storage temporário
      const fileName = `temp_import/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);
      
      if (uploadError) {
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }
      
      // Obter URL pública para o arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
      // Processar via Edge Function
      const { data, error: processError } = await supabase.functions.invoke('process-nutraceutical-spreadsheet', {
        body: { fileUrl: publicUrl, fileName: file.name }
      });
      
      if (processError) {
        throw new Error(`Erro ao processar: ${processError.message}`);
      }
      
      clearInterval(interval);
      setProgress(100);
      
      toast({
        title: "Processamento concluído",
        description: `${data.nutraceuticalsCount || 0} nutracêuticos identificados com ${data.relationsCount || 0} relações.`,
      });
      
      // Callback com os resultados do processamento
      onImportComplete(data);
    } catch (err: any) {
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
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Solte o arquivo aqui..."
              : "Arraste e solte uma planilha Excel ou CSV, ou clique para selecionar"
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos suportados: .xlsx, .xls, .csv
          </p>
        </div>

        {file && (
          <div className="mt-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <Badge variant="outline">{file.type || 'Planilha'}</Badge>
            </div>
            
            {previewData && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Pré-visualização:</h3>
                <div className="bg-gray-50 p-2 rounded-md overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {Object.keys(previewData[0] || {}).map(header => (
                          <th key={header} className="p-2 text-left border-b border-gray-200">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-2 border-b border-gray-200">
                              {val as React.ReactNode}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mostrando {previewData.length} de {previewData.length} linhas
                </p>
              </div>
            )}
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {processing && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Processando via IA...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}
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
