
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowRight, Edit, Sparkles, Database, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DesignConventionsTab = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editingSection, setEditingSection] = useState('');
  const [isAIAssistanceActive, setIsAIAssistanceActive] = useState(false);
  const { toast } = useToast();

  const handleEditClick = (section: string) => {
    setEditingSection(section);
    setEditText(`Ajude-me a ajustar as convenções de design para ${section}: [descreva suas alterações]`);
    setIsEditDialogOpen(true);
  };

  const handleAIAssistance = async () => {
    setIsAIAssistanceActive(true);
    try {
      toast({
        title: "Assistente de IA Ativado",
        description: "O assistente de IA está pronto para ajudar com as convenções de design.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro na Assistência de IA",
        description: "Não foi possível iniciar a assistência de IA.",
        variant: "destructive"
      });
      setIsAIAssistanceActive(false);
    }
  };

  const handleSave = async () => {
    try {
      toast({
        title: "Convenções atualizadas",
        description: "As novas convenções foram salvas com sucesso.",
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitToNTAI = (importId: string) => {
    toast({
      title: "Enviado para processamento NTAI",
      description: "O arquivo foi enviado para processamento pela NTAI Engine.",
    });
  };

  // Exemplo de dados de histórico de importação
  const importHistory = [
    {
      id: "imp-001",
      date: "2025-04-15",
      name: "Meta-análise Canina 2025",
      status: "completed",
      size: "4.2MB"
    },
    {
      id: "imp-002",
      date: "2025-04-10",
      name: "Estudos Felinos Q1",
      status: "completed",
      size: "2.8MB"
    },
    {
      id: "imp-003",
      date: "2025-03-28",
      name: "Compilação Cardio-Pet",
      status: "failed",
      size: "5.1MB"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Engines & Convenções</h2>
        <p className="text-gray-600">Engines de processamento e padrões visuais do sistema</p>
      </div>

      <Tabs defaultValue="design">
        <TabsList className="mb-4">
          <TabsTrigger value="design">Convenções de Design</TabsTrigger>
          <TabsTrigger value="engines">Engines & Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sistema de Tags e Ícones</CardTitle>
                <CardDescription>
                  Padrões de visualização para tags, badges e indicadores visuais
                </CardDescription>
              </div>
              <Button onClick={() => handleEditClick('Sistema de Tags e Ícones')} variant="ghost" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Assistente de Alterações
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Direcionais e Indicadores</h3>
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Positivo/Melhora
                    </Badge>
                    <span className="text-sm text-gray-600">Usado para interações positivas e melhorias</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      Negativo/Piora
                    </Badge>
                    <span className="text-sm text-gray-600">Usado para interações negativas e contraindicações</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Efeito/Resultado
                    </Badge>
                    <span className="text-sm text-gray-600">Usado para efeitos colaterais e resultados neutros</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Paleta de Cores</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Interações Positivas:</span>
                    <span className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded">bg-green-50</span>
                    <span className="ml-2 px-2 py-1 text-green-700">text-green-700</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Interações Negativas:</span>
                    <span className="ml-2 px-2 py-1 bg-red-50 text-red-700 rounded">bg-red-50</span>
                    <span className="ml-2 px-2 py-1 text-red-700">text-red-700</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Efeitos e Alertas:</span>
                    <span className="ml-2 px-2 py-1 bg-amber-50 text-amber-700 rounded">bg-amber-50</span>
                    <span className="ml-2 px-2 py-1 text-amber-700">text-amber-700</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engines">
          <Card>
            <CardHeader>
              <CardTitle>NTAI Engine</CardTitle>
              <CardDescription>
                Engine de processamento e transformação de dados científicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Configuração de Prompt</h3>
                <Textarea 
                  className="min-h-[150px] font-mono text-sm"
                  value={`# NTAI Transformation Prompt

Analise o conjunto de dados científicos veterinários fornecido e:

1. Extraia os nutraceuticos mencionados e suas aplicações
2. Identifique correlações entre nutraceuticos e condições de saúde
3. Determine a força da evidência científica (1-5)
4. Classifique os resultados por eficácia comprovada
5. Extraia métricas quantitativas quando disponíveis

Formate a saída como uma estrutura JSON contendo:
- nutraceuticos: array de objetos com propriedades {nome, composicao, eficacia}
- aplicacoes: array de objetos com {condicao, tratamentos, prevencao}
- contraIndicacoes: array de condicoes onde o uso é desaconselhado
- evidenciaCientifica: objeto com {pontuacaoGlobal, estudosAnalisados, limitacoesIdentificadas}

Os resultados devem ser estruturados para integração direta com o banco de dados.`}
                  readOnly
                />
                <Button className="mt-2" variant="outline">Editar Prompt</Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Histórico de Importações</h3>
                <div className="border rounded-lg divide-y">
                  {importHistory.map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                          <span>{item.date}</span>
                          <span>{item.size}</span>
                          <span className={`${
                            item.status === "completed" ? "text-green-600" : "text-red-600"
                          }`}>
                            {item.status === "completed" ? "Concluído" : "Falhou"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSubmitToNTAI(item.id)}
                          className="flex items-center gap-1"
                        >
                          <Cpu className="w-4 h-4" />
                          Submeter NTAI
                        </Button>
                        <Button size="sm" variant="ghost">Ver</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar {editingSection}</DialogTitle>
            <DialogDescription>
              Use o assistente de IA para ajudar nas alterações de design
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[200px]"
              placeholder="Descreva as alterações desejadas..."
            />
            
            <div className="flex justify-between items-center">
              <Button 
                onClick={handleAIAssistance} 
                variant="ghost" 
                className="flex items-center gap-2"
                disabled={isAIAssistanceActive}
              >
                <Sparkles className="w-4 h-4" />
                Assistente de IA
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignConventionsTab;
