
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Download, Database, Import, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ImportFilePreview from './ImportFilePreview';
import SciSpace2StepImport from './SciSpace2StepImport';
import SciImportHistoryRow from './SciImportHistoryRow';

const SCISPACE_LOGO_URL = "/lovable-uploads/1abbfa4b-69b7-42ab-8e69-bf156f88568a.png";

interface ImportHistoryRow {
  id: string;
  imported_at: string | null;
  meta_summary_filename: string;
  meta_summary_storage_path: string;
  base_studies_filename: string;
  base_studies_storage_path: string;
  scispace_status: string | null;
}

const SciImportSection: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("file-upload");
  const [importHistory, setImportHistory] = useState<ImportHistoryRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }
  };

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
    
    // Simulação do processo de importação
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setImporting(false);
          setFiles([]);
          toast({
            title: "Importação concluída",
            description: `${files.length} estudo(s) importado(s) com sucesso. Se algum for originado do SciSpace, receberá status especial.`,
          });
        }, 500);
      }
    }, 500);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Função para navegar para processamento NTAI
  const handleProcessWithAI = () => {
    // Rolar para a seção de processamento NTAI
    const ntaiSection = document.getElementById('ntai-processing-section');
    if (ntaiSection) {
      ntaiSection.scrollIntoView({ behavior: 'smooth' });
      
      // Piscar o elemento para chamar atenção
      ntaiSection.classList.add('highlight-section');
      setTimeout(() => {
        ntaiSection.classList.remove('highlight-section');
      }, 2000);
      
      // Exibe toast com instruções
      toast({
        title: "Selecione os estudos para processamento",
        description: "Selecione os estudos importados e adicione-os à fila de processamento NTAI."
      });
    }
  };

  useEffect(() => {
    if (activeTab === "import-history") {
      setHistoryLoading(true);
      // Busca os registros mais recentes primeiro
      supabase
        .from("scispace_imports")
        .select("id, imported_at, meta_summary_filename, meta_summary_storage_path, base_studies_filename, base_studies_storage_path, scispace_status")
        .order("imported_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            toast({
              title: "Erro ao buscar histórico",
              description: error.message,
              variant: "destructive"
            });
            setImportHistory([]);
          } else {
            setImportHistory(data || []);
          }
          setHistoryLoading(false);
        });
    }
  }, [activeTab]);

  const refreshHistory = () => {
    setHistoryLoading(true);
    supabase
      .from("scispace_imports")
      .select("id, imported_at, meta_summary_filename, meta_summary_storage_path, base_studies_filename, base_studies_storage_path, scispace_status")
      .order("imported_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setImportHistory(data || []);
        setHistoryLoading(false);
      });
  };

  return (
    <Card>
      <Tabs defaultValue="file-upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="p-6 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">Importar Estudos Científicos</h2>
            <p className="text-muted-foreground">
              Importe estudos do SCISPACE, "análises integrativas" ou outras fontes
            </p>
          </div>
          {activeTab === 'scispace-api' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
              <img 
                src={SCISPACE_LOGO_URL} 
                alt="SciSpace Logo" 
                className="h-8 w-auto mr-1 inline-block" 
              />
            </Badge>
          )}
        </div>
        
        <div className="px-6 pt-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="file-upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              <span>Upload de Arquivos</span>
            </TabsTrigger>
            <TabsTrigger value="scispace-api" className="flex items-center gap-1">
              <Import className="h-4 w-4" />
              <span>Importar Integrativa (SCISPACE)</span>
            </TabsTrigger>
            <TabsTrigger value="import-history" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent>
          <TabsContent value="file-upload" className="space-y-4 mt-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="gap-2" asChild>
                <label>
                  <Upload className="h-4 w-4" />
                  <span>Selecionar Arquivos</span>
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
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleImport}>
                          Importar Arquivos
                        </Button>
                      </div>
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
                          key={index}
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
          </TabsContent>

          <TabsContent value="scispace-api" className="mt-4">
            <SciSpace2StepImport />
          </TabsContent>
          
          <TabsContent value="import-history" className="mt-4">
            <div className="py-2">
              {historyLoading ? (
                <div className="text-center p-6 text-gray-400">Carregando histórico...</div>
              ) : (
                <>
                <div className="flex justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={refreshHistory}>
                    Atualizar lista
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleProcessWithAI}
                  >
                    <Brain className="mr-1 h-4 w-4" />
                    Processar com IA
                  </Button>
                </div>
                {importHistory && importHistory.length > 0 ? (
                  <div className="overflow-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1">Data / Hora</th>
                          <th className="px-2 py-1">Meta Sumário</th>
                          <th className="px-2 py-1">Base Estudos</th>
                          <th className="px-2 py-1">Status</th>
                          <th className="px-2 py-1">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importHistory.map((item) => (
                          <SciImportHistoryRow
                            key={item.id}
                            item={item}
                            onDeleted={refreshHistory}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma importação anterior registrada.
                  </div>
                )}
                </>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default SciImportSection;
