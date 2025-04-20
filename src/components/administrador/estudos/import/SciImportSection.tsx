
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ImportFilePreview from './ImportFilePreview';
import SciSpaceLogo from './SciSpaceLogo';

const formatosAceitosUrl = "/lovable-uploads/cc140302-5c6e-4e97-8745-6843ede2a415.png";

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
            <CardTitle className="flex items-center">
              Importar Estudos Científicos
            </CardTitle>
            <CardDescription>
              Importe estudos do SCISPACE ou outras fontes científicas
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex gap-2 items-center px-3 py-1">
            <SciSpaceLogo className="h-6 w-auto mr-2 rounded-md" />
            SCISPACE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* BLoco de destaque Analise Integrativa */}
        <div className="border border-blue-200 rounded-md bg-blue-50 p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <SciSpaceLogo className="h-14 w-auto mb-3" />
            <span className="text-xs text-gray-400 italic">Exportação manual</span>
          </div>
          <div className="flex-1">
            <div className="text-blue-800 font-semibold text-base mb-1">
              Importação de <span className="underline underline-offset-2">Analise Integrativa</span> do SCISPACE
            </div>
            <div className="text-sm text-slate-700 mb-1">
              Para importar uma Análise Integrativa:
            </div>
            <ul className="text-sm mb-2 text-slate-700 list-disc list-inside space-y-1">
              <li>
                <strong>1. Exporte manualmente os arquivos da plataforma SCISPACE:</strong>
                <ul className="ml-5 mt-1 list-disc text-xs text-slate-600 space-y-1">
                  <li>
                    <span className="font-medium text-blue-800">Meta Sumário</span> <span className="text-gray-500">(arquivo de texto/Word contendo resumo, citações e hiperlinks nos dados extraídos)</span>
                  </li>
                  <li>
                    <span className="font-medium text-blue-800">Base de Estudos</span> <span className="text-gray-500">(arquivo Excel ou CSV padronizado com colunas de dados estruturadas, conforme extração da plataforma)</span>
                  </li>
                </ul>
              </li>
              <li>
                <strong>2. Faça o upload abaixo, anexando ambos os arquivos.</strong>
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <img 
                src={formatosAceitosUrl} 
                alt="Formatos Aceitos" 
                className="h-16 w-auto rounded-md border border-blue-200 bg-white shadow-sm"
              />
              <span className="text-xs text-gray-500">Exemplo de formatos aceitos</span>
            </div>
          </div>
        </div>

        {/* Tabs anteriores */}
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
                  <Upload className="h-4 w-4" />
                  <span>Selecionar Arquivos</span>
                  <input 
                    type="file" 
                    multiple 
                    accept=".bib,.csv,.json,.pdf,.doc,.docx,.xlsx" 
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                </label>
              </Button>
              <p className="text-sm text-gray-500">
                Formatos suportados: BibTeX (.bib), CSV, JSON, PDF, DOC, DOCX, XLSX
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
          
          <TabsContent value="scispace-api">
            <div className="text-center py-8 border border-dashed rounded-md flex flex-col items-center">
              <SciSpaceLogo className="h-14 w-auto mb-3 mx-auto" />
              <h3 className="mt-1 text-lg font-medium">Integração com API SCISPACE</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Ainda não disponível via API. <br />
                Faça exportação manual dos arquivos pela plataforma.
              </p>
              <Button className="mt-4" disabled>
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
