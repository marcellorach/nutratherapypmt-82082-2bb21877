import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { createSafeStoragePath, sanitizeFileName } from '@/utils/fileNameSanitizer';

const FileUploadTab: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedCount, setUploadedCount] = useState(0);
  const [importedStudyIds, setImportedStudyIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<{ count: number; studyIds: string[] } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length < acceptedFiles.length) {
      toast({
        title: 'Arquivos inválidos',
        description: 'Apenas arquivos PDF são aceitos',
        variant: "destructive"
      });
    }
    
    setSelectedFiles(prev => [...prev, ...pdfFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione pelo menos um arquivo para importar',
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setUploadProgress({});
    setUploadedCount(0);
    const newImportedIds: string[] = [];

    try {
      let successCount = 0;

      // Criar registro de importação no banco
      const { data: importData, error: importError } = await supabase
        .from('scispace_imports')
        .insert({
          import_type: 'manual',
          scispace_status: 'completed'
        })
        .select()
        .single();

      if (importError) throw importError;

      // Upload paralelo com progresso individual
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileName = file.name;
        const studyId = uuidv4();
        const storagePath = createSafeStoragePath(studyId, fileName);

        try {
          // Simular progresso de upload
          const uploadInterval = setInterval(() => {
            setUploadProgress(prev => {
              const current = prev[fileName] || 0;
              if (current >= 90) {
                clearInterval(uploadInterval);
                return prev;
              }
              return { ...prev, [fileName]: Math.min(current + 10, 90) };
            });
          }, 200);

          // Upload para Storage
          const { error: storageError } = await supabase.storage
            .from('study_pdfs')
            .upload(storagePath, file);

          clearInterval(uploadInterval);
          
          if (storageError) throw storageError;

          // Finalizar progresso
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));

          // Criar registro em processed_studies
          const { error: dbError } = await supabase
            .from('processed_studies')
            .insert({
              study_id: studyId,
              title: fileName.replace('.pdf', ''),
              original_filename: fileName,
              storage_path: storagePath,
              import_type: 'manual',
              kanban_status: 'new',
              source_import_id: importData.id,
              description: 'Aguardando processamento',
              journal: 'Importação Manual'
            });

          if (dbError) throw dbError;

          newImportedIds.push(studyId);
          successCount++;
          setUploadedCount(successCount);
          
          return { success: true, fileName };
        } catch (fileError) {
          console.error(`Erro ao importar ${fileName}:`, fileError);
          setUploadProgress(prev => ({ ...prev, [fileName]: -1 }));
          return { success: false, fileName, error: fileError };
        }
      });

      await Promise.all(uploadPromises);

      setImportedStudyIds(newImportedIds);

      // Emit custom event for other components to listen
      const event = new CustomEvent('studyImported', { 
        detail: { studyIds: newImportedIds, count: successCount } 
      });
      window.dispatchEvent(event);

      // Show inline success message
      setSuccessMessage({
        count: successCount,
        studyIds: newImportedIds
      });

      // Aguardar 2s para mostrar progresso completo antes de limpar
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        setUploadedCount(0);
      }, 2000);

      // Auto-dismiss success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);

    } catch (error) {
      console.error('Erro durante importação:', error);
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {t('studies.import.successInline', { count: successMessage.count })}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('studies.import.successInlineDesc')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('step', 'processamento-ia');
                window.history.pushState({}, '', url);
                window.location.reload();
              }}
              className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
            >
              {t('studies.import.viewImported')}
            </Button>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">
            Solte os arquivos aqui
          </p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Arraste PDFs aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Formatos suportados: PDF (máx. 20MB por arquivo)
            </p>
            <Button variant="outline" type="button">
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Arquivos
            </Button>
          </>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
            </p>
            {importing && (
              <p className="text-sm text-muted-foreground">
                {uploadedCount} / {selectedFiles.length} concluídos
              </p>
            )}
          </div>
          
          {selectedFiles.map((file, index) => {
            const progress = uploadProgress[file.name] || 0;
            const hasError = progress === -1;
            
            return (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      {sanitizeFileName(file.name) !== file.name && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="h-3 w-3" />
                          {t('studies.import.fileNameSanitized')}: {sanitizeFileName(file.name)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {!importing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {importing && progress === 100 && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  
                  {hasError && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                
                {importing && !hasError && (
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      {progress === 100 ? 'Concluído' : `Enviando... ${progress}%`}
                    </p>
                  </div>
                )}
                
                {hasError && (
                  <p className="text-xs text-destructive">
                    Erro ao fazer upload. Tente novamente.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleImport}
          disabled={selectedFiles.length === 0 || importing}
          className="min-w-[200px]"
        >
          {importing ? (
            <>Importando {uploadedCount}/{selectedFiles.length}...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importar {selectedFiles.length > 0 ? `${selectedFiles.length} arquivo(s)` : 'Arquivos'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FileUploadTab;
