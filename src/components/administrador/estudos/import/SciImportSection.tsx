import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ImportFilePreview from './ImportFilePreview';
import SciSpace2StepImport from './SciSpace2StepImport';
import SciImportHistoryRow from './SciImportHistoryRow';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const SCISPACE_LOGO_URL = "/lovable-uploads/8eed700f-39e7-4208-aeb1-664f3660af90.png";

interface ImportHistoryRow {
  id: string;
  imported_at: string | null;
  meta_summary_filename: string;
  meta_summary_storage_path: string;
  base_studies_filename: string;
  base_studies_storage_path: string;
  scispace_status: string | null;
  consenso_name?: string;
  consenso_comments?: string;
}

// Mock de estudos brutos para demonstração
const ESTUDOS_BRUTOS_MOCK = [
  {
    id: "1",
    titulo: "Efeitos do Ômega 3 em Cães",
    autores: "Silva, J.; Pereira, M.",
    publicacao: "Journal of Canine Health",
    ano: 2022,
    status: "importado",
    tags: ["ômega 3", "saúde cardiovascular"]
  },
  {
    id: "2",
    titulo: "Benefícios da Curcumina em Gatos Idosos",
    autores: "Santos, F.; Oliveira, R.",
    publicacao: "Feline Medicine Today",
    ano: 2023,
    status: "analisado",
    tags: ["curcumina", "envelhecimento"]
  },
  {
    id: "3",
    titulo: "Sulforafano e Doenças Crônicas em Pets",
    autores: "Martins, C.; Costa, A.",
    publicacao: "Veterinary Nutrition Journal",
    ano: 2023,
    status: "novo",
    tags: ["sulforafano", "doenças crônicas"]
  }
];

const SciImportSection: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("file-upload");
  const [importHistory, setImportHistory] = useState<ImportHistoryRow[] | null>(null);
  const [estudosBrutos, setEstudosBrutos] = useState<any[]>(ESTUDOS_BRUTOS_MOCK);
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

  const handleSubmitNTAI = (item: any) => {
    // Atualizar a lista após processamento simulado
    setTimeout(() => {
      refreshHistory();
    }, 2000);
  };

  useEffect(() => {
    if (activeTab === "import-history" || activeTab === "estudos-brutos") {
      setHistoryLoading(true);
      // Busca os registros mais recentes primeiro
      supabase
        .from("scispace_imports")
        .select("id, imported_at, meta_summary_filename, meta_summary_storage_path, base_studies_filename, base_studies_storage_path, scispace_status, consenso_name, consenso_comments")
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
            setImportHistory(data as ImportHistoryRow[] || []);
          }
          setHistoryLoading(false);
        });
    }
  }, [activeTab]);

  const refreshHistory = () => {
    setHistoryLoading(true);
    supabase
      .from("scispace_imports")
      .select("id, imported_at, meta_summary_filename, meta_summary_storage_path, base_studies_filename, base_studies_storage_path, scispace_status, consenso_name, consenso_comments")
      .order("imported_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) {
          setImportHistory(data as ImportHistoryRow[] || []);
        }
        setHistoryLoading(false);
      });
  };

  const getTagBadge = (tag: string) => {
    return (
      <Badge key={tag} variant="outline" className="mr-1 bg-slate-100 text-slate-700">
        {tag}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'analisado':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Analisado</span>;
      case 'novo':
        return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Novo</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">{status}</span>;
    }
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
            <TabsTrigger value="import-history">Histórico de Importações</TabsTrigger>
            <TabsTrigger value="estudos-brutos">Base de Estudos Brutos</TabsTrigger>
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

          <TabsContent value="scispace-api">
            <SciSpace2StepImport />
          </TabsContent>
          
          <TabsContent value="import-history">
            <div className="py-2">
              {historyLoading ? (
                <div className="text-center p-6 text-gray-400">Carregando histórico...</div>
              ) : (
                <>
                <Button variant="outline" size="sm" className="mb-2" onClick={refreshHistory}>
                  Atualizar lista
                </Button>
                {importHistory && importHistory.length > 0 ? (
                  <div className="overflow-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 py-1">Data / Hora</th>
                          <th className="px-2 py-1">Meta Sumário</th>
                          <th className="px-2 py-1">Base Estudos</th>
                          <th className="px-2 py-1">Consenso</th>
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
                            onSubmitNTAI={handleSubmitNTAI}
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

          <TabsContent value="estudos-brutos">
            <div className="py-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Base de Estudos Científicos Brutos</h3>
                <Button variant="outline" size="sm">Atualizar Base</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autores</TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudosBrutos.map((estudo) => (
                    <TableRow key={estudo.id}>
                      <TableCell className="font-medium">{estudo.titulo}</TableCell>
                      <TableCell>{estudo.autores}</TableCell>
                      <TableCell>{estudo.publicacao}</TableCell>
                      <TableCell>{estudo.ano}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {estudo.tags.map((tag: string) => getTagBadge(tag))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(estudo.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto"
                          >
                            Visualizar
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto"
                          >
                            Analisar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SciImportSection;
