
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ImportFilePreview from './ImportFilePreview';

const SCISPACE_LOGO_URL = "/lovable-uploads/8eed700f-39e7-4208-aeb1-664f3660af90.png";
const SCISPACE_FORMATS_URL = "/lovable-uploads/d0b8670e-c0fc-4068-b3b2-2a859ea82023.png";

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
            description: `${files.length} estudo(s) importado(s) com sucesso. Se algum for originado do SciSpace, receberá status especial.`,
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
            <CardDescription>Importe estudos do SCISPACE, "análises integrativas" ou outras fontes</CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
            <img src={SCISPACE_LOGO_URL} alt="SciSpace Logo" className="h-6 w-6 mr-1 inline-block" style={{ background: 'white', borderRadius: 4, objectFit: 'contain' }} />
            SCISPACE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file-upload" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="file-upload">Upload de Arquivos</TabsTrigger>
            <TabsTrigger value="scispace-api">Importar Integrativa (SCISPACE)</TabsTrigger>
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

          {/* NOVA ABA PARA SCISPACE/INTEGRATIVA */}
          <TabsContent value="scispace-api">
            <div className="rounded-lg border bg-gray-50/90 p-6 mb-3 flex flex-col items-center mx-auto max-w-[540px] shadow">
              <img src={SCISPACE_LOGO_URL} alt="SciSpace Logo" className="h-12 mb-3" style={{ objectFit: "contain", background: "#fff", borderRadius: "8px" }} />
              <h3 className="text-lg font-medium mb-1 text-gray-800">Importação Manual da Análise Integrativa</h3>
              <p className="text-gray-600 text-center mb-3 max-w-[420px]">
                Exporte no SciSpace o <b>meta sumário (texto .pdf ou .doc)</b> e a <b>base de estudos (.csv, .bib, .json, .xls)</b>.<br/>
                Os arquivos dessas análises receberão <span className="inline-block px-2 py-1 rounded text-white bg-purple-400 ml-1 mr-1">status especial</span> após a importação.
              </p>
              <img src={SCISPACE_FORMATS_URL} alt="Formatos aceitos" className="rounded-md border object-contain mb-4 max-h-56 bg-white" style={{boxShadow:'0 4px 12px #0001'}} />
              <ul className="mb-4 mt-2 text-gray-700 text-left text-sm bg-purple-50 rounded p-3 w-full">
                <li className="mb-1">
                  <b>Meta sumário:</b> Utilize o arquivo exportado do SciSpace de tipo <span className="font-mono text-purple-700">.pdf</span> ou <span className="font-mono text-purple-700">.doc</span>. Este arquivo geralmente contém hiperlinks, citações e uma visão integrativa do nutracêutico.
                </li>
                <li className="mb-1">
                  <b>Base de estudos:</b> Exporte pelo botão <b>Export as...</b> do SciSpace, escolhendo o formato <span className="font-mono text-green-700">.csv</span>, <span className="font-mono text-sky-700">.bib</span>, <span className="font-mono text-yellow-700">.xls</span> ou <span className="font-mono text-blue-700">.json</span>. Contém colunas padronizadas extraídas pela própria plataforma.
                </li>
                <li>
                  Ambos devem ser importados juntos sempre que possível para garantir uniformidade dos dados.
                </li>
              </ul>

              <div className="text-xs text-gray-500 text-center w-full mb-2">
                <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-purple-700 font-semibold">
                  Obs: Não há integração API ainda. A importação é manual!
                </span>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2 cursor-not-allowed" disabled>
                <Download className="h-4 w-4" />
                Importação automática em breve
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

