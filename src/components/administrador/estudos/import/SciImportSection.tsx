
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload, FileText, Download, FileInput } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const SciImportSection: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("file-upload");
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
            description: `${files.length} estudo(s) importado(s) com sucesso.`,
          });
        }, 500);
      }
    }, 500);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Importar Estudos Científicos</CardTitle>
            <CardDescription>Importe estudos do SCISPACE ou outras fontes científicas</CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">SCISPACE</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file-upload" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="file-upload">Upload de Arquivos</TabsTrigger>
            <TabsTrigger value="scispace-api">API SCISPACE</TabsTrigger>
            <TabsTrigger value="import-history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file-upload" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="gap-2" asChild>
                <label>
                  <FileUpload className="h-4 w-4" />
                  <span>Selecionar Arquivos</span>
                  <input 
                    type="file" 
                    multiple 
                    accept=".bib,.csv,.json,.pdf" 
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                </label>
              </Button>
              <p className="text-sm text-gray-500">
                Formatos suportados: BibTeX (.bib), CSV, JSON, PDF
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
                        <li key={index} className="flex justify-between items-center py-1 text-sm">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-blue-500 mr-2" />
                            <span>{file.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {file.type || file.name.split('.').pop()?.toUpperCase()}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Remover
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scispace-api">
            <div className="text-center py-8 border border-dashed rounded-md">
              <FileInput className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Integração com API SCISPACE</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Configure sua API key do SCISPACE para importar estudos diretamente da plataforma.
              </p>
              <Button className="mt-4">
                Configurar Integração
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import-history">
            <div className="text-center py-6">
              <h3 className="text-sm font-medium text-gray-500">Nenhuma importação anterior registrada</h3>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SciImportSection;
