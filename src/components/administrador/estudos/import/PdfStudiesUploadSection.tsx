
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  PlusCircle, 
  FileText, 
  Trash2, 
  Loader2, 
  Check, 
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingItem } from '@/types/ntai';
import { Input } from '@/components/ui/input';

interface StudyPdfFile extends File {
  preview?: string;
  uploadProgress?: number;
  processingState?: 'waiting' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  studyId?: string;
  nutraceuticalAssociation?: string;
  conditionAssociation?: string;
}

const PdfStudiesUploadSection: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<StudyPdfFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadProgress: 0,
          processingState: 'waiting' as const,
          studyId: `pdf-${Date.now()}-${file.name}`,
          nutraceuticalAssociation: '',
          conditionAssociation: ''
        })
      );
      
      setPdfFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  });
  
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

  const handleProcessFiles = async () => {
    if (pdfFiles.length === 0) return;
    
    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    
    // Processar cada arquivo em sequência para não sobrecarregar
    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      
      try {
        // Atualizar estado para "uploading"
        setPdfFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, processingState: 'uploading' } : f
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
          
        // Atualizar progresso
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
        
        // Finalizar com sucesso
        setPdfFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, uploadProgress: 100, processingState: 'success' } : f
        ));
        
        successCount++;
        
      } catch (error: any) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error);
        
        // Atualizar estado para erro
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
  
  const filteredFiles = pdfFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.nutraceuticalAssociation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.conditionAssociation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Upload de Estudos Científicos em PDF
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
            isSubmitting ? 'bg-gray-100 pointer-events-none' : 'hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} disabled={isSubmitting} />
          <PlusCircle className="h-10 w-10 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Arraste e solte arquivos PDF de estudos científicos, ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Você pode associar cada estudo a um nutracêutico e condição específicos
          </p>
        </div>
        
        {pdfFiles.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">{pdfFiles.length} arquivos</h3>
              
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Filtrar arquivos..."
                  className="h-8 w-60"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  disabled={isSubmitting}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setPdfFiles([])}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Limpar todos os arquivos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <div className="divide-y">
                {filteredFiles.map((file, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium truncate max-w-xs">{file.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1">
                        {file.processingState === 'waiting' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                        
                        {file.processingState === 'error' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{file.error || 'Erro no processamento'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {file.processingState === 'success' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Check className="h-5 w-5 text-green-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Processado com sucesso</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Input 
                        placeholder="Nutracêutico relacionado" 
                        size="sm"
                        value={file.nutraceuticalAssociation}
                        onChange={(e) => handleNutraceuticalAssociation(index, e.target.value)}
                        disabled={file.processingState !== 'waiting' || isSubmitting}
                      />
                      <Input 
                        placeholder="Condição de saúde" 
                        size="sm"
                        value={file.conditionAssociation}
                        onChange={(e) => handleConditionAssociation(index, e.target.value)}
                        disabled={file.processingState !== 'waiting' || isSubmitting}
                      />
                    </div>
                    
                    {(file.processingState === 'uploading' || file.processingState === 'processing') && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{file.processingState === 'uploading' ? 'Enviando...' : 'Processando...'}</span>
                          <span>{file.uploadProgress || 0}%</span>
                        </div>
                        <Progress value={file.uploadProgress || 0} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          {filteredFiles.length} de {pdfFiles.length} arquivos exibidos
        </p>
        <Button 
          onClick={handleProcessFiles}
          disabled={pdfFiles.length === 0 || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              Processar Arquivos
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PdfStudiesUploadSection;
