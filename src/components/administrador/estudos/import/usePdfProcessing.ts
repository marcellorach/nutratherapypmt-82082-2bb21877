
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StudyPdfFile } from './types';

export const usePdfProcessing = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<StudyPdfFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const addFiles = (newFiles: StudyPdfFile[]) => {
    setPdfFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setPdfFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const clearAllFiles = () => {
    // Liberar URLs de objetos
    pdfFiles.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
    setPdfFiles([]);
  };

  const handleNutraceuticalAssociation = (index: number, value: string) => {
    setPdfFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, nutraceuticalAssociation: value } : file
    ));
  };
  
  const handleConditionAssociation = (index: number, value: string) => {
    setPdfFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, conditionAssociation: value } : file
    ));
  };

  const processFiles = async () => {
    if (pdfFiles.length === 0) return;
    
    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    
    // Processar cada arquivo em sequência para não sobrecarregar
    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      
      if (file.processingState === 'success') {
        // Pular arquivos já processados
        successCount++;
        continue;
      }
      
      try {
        // Atualizar estado para "uploading"
        setPdfFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, processingState: 'uploading', uploadProgress: 0 } : f
        ));
        
        // Upload para o Supabase Storage
        const filePath = `scientific-studies/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('scispace')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
        
        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('scispace')
          .getPublicUrl(filePath);
          
        // Atualizar progresso para 50%
        setPdfFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploadProgress: 50, processingState: 'processing' } : f
        ));
        
        // Enviar para processamento na Edge Function
        const { data, error } = await supabase.functions.invoke('process-study-pdf', {
          body: { 
            fileUrl: publicUrl,
            fileName: file.name,
            studyId: file.studyId,
            nutraceutical: file.nutraceuticalAssociation,
            condition: file.conditionAssociation
          }
        });
        
        if (error) throw new Error(`Erro no processamento: ${error.message}`);
        
        // Registrar na tabela processed_studies
        const { error: dbError } = await supabase
          .from('processed_studies')
          .insert({
            study_id: file.studyId,
            original_filename: file.name,
            storage_path: filePath,
            title: data.title || file.name,
            description: data.summary || `Estudo sobre ${file.nutraceuticalAssociation || 'nutracêuticos'}`,
            journal: data.journal || 'PDF Importado',
            kanban_status: 'new',
            processed_by: 'pdf-import',
            analysis_data: data,
            import_type: 'manual'
          });
          
        if (dbError) throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
        
        // Finalizar com sucesso (100%)
        setPdfFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploadProgress: 100, processingState: 'success' } : f
        ));
        
        successCount++;
        
      } catch (error: any) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error);
        
        // Atualizar estado para erro, garantindo uploadProgress como número
        setPdfFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            uploadProgress: 0, 
            processingState: 'error',
            error: error.message
          } : f
        ));
        
        errorCount++;
      }
    }
    
    setIsSubmitting(false);
    
    toast({
      title: `Processamento finalizado`,
      description: `${successCount} arquivos processados com sucesso. ${errorCount} erros.`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });
  };

  return {
    pdfFiles,
    searchTerm,
    isSubmitting,
    addFiles,
    removeFile,
    clearAllFiles,
    setSearchTerm,
    handleNutraceuticalAssociation,
    handleConditionAssociation,
    processFiles,
  };
};
