import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProcessingStatus {
  phase: 'uploading' | 'gemini' | 'extracting' | 'saving' | 'complete' | 'error';
  progress: number;
  message: string;
}

export const UploadEstudoForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setStatus(null);
      setExtractedData(null);
    } else {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo PDF válido',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setStatus({ phase: 'uploading', progress: 10, message: 'Fazendo upload do PDF...' });

      // 1. Gerar ID único para o estudo
      const studyId = uuidv4();
      const fileName = `${studyId}_${selectedFile.name}`;

      // 2. Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study_pdfs')
        .upload(fileName, selectedFile, {
          contentType: 'application/pdf',
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const fileUrl = supabase.storage.from('study_pdfs').getPublicUrl(fileName).data.publicUrl;

      setStatus({ phase: 'uploading', progress: 30, message: 'PDF enviado para storage' });

      // 3. Criar registro inicial em processed_studies
      const { error: insertError } = await supabase
        .from('processed_studies')
        .insert({
          study_id: studyId,
          original_filename: selectedFile.name,
          storage_path: fileName,
          import_type: 'pdf_upload',
          kanban_status: 'processing',
        });

      if (insertError) {
        throw new Error(`Erro ao criar registro: ${insertError.message}`);
      }

      setStatus({ phase: 'gemini', progress: 40, message: 'Enviando para Gemini File API...' });

      // 4. Chamar edge function para processar com Gemini
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke(
        'gemini-file-search',
        {
          body: {
            fileUrl,
            studyId,
            fileName: selectedFile.name,
          },
        }
      );

      if (geminiError) {
        throw new Error(`Erro no processamento: ${geminiError.message}`);
      }

      setStatus({ phase: 'complete', progress: 100, message: 'Processamento concluído!' });
      setExtractedData(geminiData.extractedData);

      toast({
        title: 'Sucesso!',
        description: 'Estudo processado e dados extraídos com IA',
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      setStatus({
        phase: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="pdf-upload" className="text-base font-semibold">
              Upload de Estudo Científico (PDF)
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upload de um PDF e a IA extrairá automaticamente: título, autores, ano, journal,
              abstract, nutraceuticals e condições de saúde mencionadas.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={status?.phase === 'uploading' || status?.phase === 'gemini'}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || ['uploading', 'gemini', 'extracting'].includes(status?.phase || '')}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {status?.phase === 'uploading' || status?.phase === 'gemini' ? 'Processando...' : 'Processar'}
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name}</span>
              <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>
      </Card>

      {status && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {status.phase === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : status.phase === 'error' ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              )}
              <div className="flex-1">
                <p className="font-medium">{status.message}</p>
                <Progress value={status.progress} className="mt-2" />
              </div>
            </div>

            {status.phase === 'complete' && extractedData && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Dados Extraídos</h3>

                <div className="grid gap-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Título:</span>
                    <p className="text-sm mt-1">{extractedData.title}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Autores:</span>
                    <p className="text-sm mt-1">{extractedData.authors?.join(', ')}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Ano:</span>
                      <p className="text-sm mt-1">{extractedData.year || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Journal:</span>
                      <p className="text-sm mt-1">{extractedData.journal || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">DOI:</span>
                      <p className="text-sm mt-1">{extractedData.doi || 'N/A'}</p>
                    </div>
                  </div>

                  {extractedData.nutraceuticals?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Nutraceuticals encontrados ({extractedData.nutraceuticals.length}):
                      </span>
                      <div className="mt-2 space-y-2">
                        {extractedData.nutraceuticals.map((nut: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">{nut.name}</p>
                            {nut.dosage && (
                              <p className="text-xs text-muted-foreground">Dosagem: {nut.dosage}</p>
                            )}
                            <p className="text-xs mt-1">{nut.effects}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {extractedData.conditions?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Condições estudadas ({extractedData.conditions.length}):
                      </span>
                      <div className="mt-2 space-y-2">
                        {extractedData.conditions.map((cond: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">{cond.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              Tipo: {cond.relationship_type}
                            </p>
                            <p className="text-xs mt-1">{cond.efficacy_description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
