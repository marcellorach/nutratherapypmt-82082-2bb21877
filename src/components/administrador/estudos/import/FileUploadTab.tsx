
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import ImportFilePreview from './ImportFilePreview';

const FileUploadTab: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleImport = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para importar.",
        variant: "destructive",
      });
      return;
    }
    setImporting(true);

    let currentProgress = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `scispace/manual-import/${Date.now()}-${file.name}`;
      
      try {
        // Upload do arquivo
        const { error: uploadError } = await supabase.storage
          .from("scispace")
          .upload(path, file);
          
        if (uploadError) throw uploadError;

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

        if (importError) throw importError;

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

        if (processError) throw processError;

        currentProgress = Math.round(((i + 1) / files.length) * 100);
        setProgress(currentProgress);
      } catch (error: any) {
        toast({
          title: `Erro ao importar ${file.name}`,
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
        title: "Importação concluída",
        description: `${files.length} estudo(s) importado(s) com sucesso. Eles já podem ser processados na Análise NTAI.`,
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
              <span className="inline-block align-middle">Selecionar Arquivos</span>
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
          Formatos suportados: BibTeX (.bib), CSV, JSON, PDF, DOC, DOCX, TXT, RTF
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-4 border rounded-md">
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Arquivos para importação ({files.length})</h3>
              {!importing && (
                <Button size="sm" onClick={handleImport}>
                  Importar Arquivos
                </Button>
              )}
            </div>
          </div>
          <div className="p-3">
            {importing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando arquivos...</span>
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
