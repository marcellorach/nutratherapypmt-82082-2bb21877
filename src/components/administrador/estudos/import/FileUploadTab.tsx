
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

const FileUploadTab: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedCount, setUploadedCount] = useState(0);
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
        const storagePath = `studies/${studyId}_${fileName}`;

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
          
        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          throw uploadError;
        }
        
        console.log("Upload bem-sucedido:", data);

        // Extrair título do nome do arquivo
        const fileTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove extensão
        const formattedTitle = fileTitle
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        // Registrar na tabela scispace_imports
        const { data: importData, error: importError } = await supabase
          .from("scispace_imports")
          .insert([
            {
              meta_summary_filename: file.name,
              meta_summary_storage_path: path,
              base_studies_filename: file.name,
              base_studies_storage_path: path,
              import_type: 'manual',
              scispace_status: 'manual'
            }
          ])
          .select()
          .single();

        if (importError) {
          console.error("Erro ao registrar importação:", importError);
          throw importError;
        }
        
        console.log("Importação registrada:", importData);

        // Registrar na tabela processed_studies com informações aprimoradas
        const { error: processError } = await supabase
          .from("processed_studies")
          .insert([
            {
              study_id: path,
              source_import_id: importData.id,
              import_type: 'manual',
              original_filename: file.name,
              storage_path: path,
              kanban_status: 'new',
              processed_by: 'manual-import',
              title: formattedTitle,
              description: `Estudo importado manualmente: ${formattedTitle}`,
              journal: 'Importação Manual'
            }
          ]);

        if (processError) {
          console.error("Erro ao registrar estudo processado:", processError);
          throw processError;
        }

        currentProgress = Math.round(((i + 1) / files.length) * 100);
        setProgress(currentProgress);
      } catch (error: any) {
        console.error("Erro completo:", error);
        toast({
          title: t('studies.import.importError', { filename: file.name }),
          description: error.message,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }
    }

    setTimeout(() => {
      setImporting(false);
      setFiles([]);
      setProgress(0);
      toast({
        title: t('studies.import.importSuccess'),
        description: t('studies.import.importSuccessDesc', { count: files.length }),
      });
    }, 800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" className="gap-2" asChild>
          <label>
            <span>
              <span className="inline-block align-middle">
                <Upload className="h-4 w-4" />
              </span>
              <span className="inline-block align-middle">{t('studies.import.selectFiles')}</span>
            </span>
            <input
              type="file"
              multiple
              accept=".bib,.csv,.json,.pdf,.doc,.docx,.txt,.rtf"
              className="hidden"
              onChange={handleFileChange}
              disabled={importing}
            />
          </label>
        </Button>
        <p className="text-sm text-gray-500">
          {t('studies.import.supportedFormats')}
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-4 border rounded-md">
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{t('studies.import.filesForImport', { count: files.length })}</h3>
              {!importing && (
                <Button size="sm" onClick={handleImport}>
                  {t('studies.import.importFiles')}
                </Button>
              )}
            </div>
          </div>
          <div className="p-3">
            {importing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('studies.import.processing')}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <ImportFilePreview
                    key={file.name + index}
                    file={file}
                    index={index}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadTab;
