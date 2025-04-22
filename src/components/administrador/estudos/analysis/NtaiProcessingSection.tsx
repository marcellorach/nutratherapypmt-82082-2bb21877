import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Database, 
  FileCode,
  Microscope,
  BookOpen,
  Search,
  Tags,
  Scale
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import NtaiProcessCard from './NtaiProcessCard';
import NtaiProcessingLog from './NtaiProcessingLog';
import { ProcessingItem, NtaiAnalysisStage, NtaiAnalysisResult, ProcessingStage } from '@/types/ntai';
import NtaiProcessingPhases from './NtaiProcessingPhases';
import NtaiAnalysisResults from './NtaiAnalysisResults';
import ntaiService from '@/services/ntai-service';

interface NtaiProcessingSectionProps {
  estudos: any[];
}

const NtaiProcessingSection: React.FC<NtaiProcessingSectionProps> = ({ estudos }) => {
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const [processingStages, setProcessingStages] = useState<NtaiAnalysisStage[]>([
    {
      name: "Extração de Texto",
      description: "Extraindo texto e metadados do documento científico",
      icon: FileText,
      completed: false,
      progress: 0
    },
    {
      name: "Análise Inicial",
      description: "Analisando conteúdo e estrutura do estudo",
      icon: Brain,
      completed: false,
      progress: 0
    },
    {
      name: "Análise de Relevância",
      description: "Avaliando qualidade e relevância do estudo",
      icon: Scale,
      completed: false,
      progress: 0
    },
    {
      name: "Extração de Conhecimento",
      description: "Extraindo nutracêuticos, condições e efeitos",
      icon: Tags,
      completed: false,
      progress: 0
    },
    {
      name: "Comparação com Base de Conhecimento",
      description: "Comparando dados com biblioteca de conhecimento existente",
      icon: BookOpen,
      completed: false,
      progress: 0
    },
    {
      name: "Padronização",
      description: "Convertendo para formato padrão do sistema",
      icon: Database,
      completed: false,
      progress: 0
    }
  ]);
  const [currentStage, setCurrentStage] = useState<string>("");
  
  const { toast } = useToast();
  
  const toggleLogVisibility = () => {
    setLogVisible(!logVisible);
  };
  
  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedItems.length === estudos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(estudos.map(estudo => estudo.id));
    }
  };
  
  const addToQueue = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum estudo selecionado",
        description: "Selecione pelo menos um estudo para processar.",
        variant: "destructive",
      });
      return;
    }
    
    const newItems: ProcessingItem[] = selectedItems.map(id => {
      const estudo = estudos.find(e => e.id === id);
      return {
        id,
        title: estudo?.title || `Estudo ${id}`,
        stage: 'idle' as ProcessingStage,
        progress: 0,
        sourceFile: estudo?.title || '',
        originalFormat: 'PDF'
      };
    });
    
    setProcessQueue([...processQueue, ...newItems]);
    setSelectedItems([]);
    
    toast({
      title: "Estudos adicionados à fila",
      description: `${newItems.length} estudos adicionados para processamento NTAI.`,
    });
  };
  
  const updateStageProgress = (stageName: string, progress: number, completed: boolean = false) => {
    setProcessingStages(prev => prev.map(stage => {
      if (stage.name === stageName) {
        return {
          ...stage,
          progress,
          completed,
          ...(progress > 0 && !stage.startTime ? { startTime: new Date() } : {}),
          ...(completed ? { endTime: new Date() } : {})
        };
      }
      return stage;
    }));
  };
  
  const resetStages = () => {
    setProcessingStages(prev => prev.map(stage => ({
      ...stage,
      progress: 0,
      completed: false,
      startTime: undefined,
      endTime: undefined
    })));
  };
  
  const startProcessing = async () => {
    if (processQueue.length === 0 || processingActive) return;
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    
    // Reinicia estado de análise
    setAnalysisResult(null);
    
    // Processa o próximo item na fila
    const processNextItem = async (index: number) => {
      if (index >= updatedQueue.length) {
        setProcessingActive(false);
        setActiveItemIndex(-1);
        setCurrentStage("");
        return;
      }
      
      setActiveItemIndex(index);
      const item = updatedQueue[index];
      
      if (item.stage === 'complete' || item.stage === 'error') {
        processNextItem(index + 1);
        return;
      }
      
      // Reiniciar estágios
      resetStages();
      
      try {
        // 1. Estágio de Extração
        setCurrentStage("Extração de Texto");
        addLogEntry(`Iniciando extração para: ${item.title}`);
        
        updatedQueue[index] = { ...item, stage: 'extracting' as ProcessingStage, progress: 10 };
        setProcessQueue([...updatedQueue]);
        
        // Simulação de extração
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateStageProgress("Extração de Texto", i, i === 100);
        }
        
        addLogEntry(`Extração de texto concluída para: ${item.title}`);
        
        // 2. Estágio de Análise
        setCurrentStage("Análise Inicial");
        addLogEntry(`Iniciando análise NTAI para: ${item.title}`);
        
        updatedQueue[index] = { ...updatedQueue[index], stage: 'analyzing' as ProcessingStage, progress: 30 };
        setProcessQueue([...updatedQueue]);
        
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateStageProgress("Análise Inicial", i, i === 100);
        }
        
        // 3. Estágio de Análise de Relevância
        setCurrentStage("Análise de Relevância");
        addLogEntry(`Analisando relevância e qualidade de: ${item.title}`);
        
        updatedQueue[index] = { ...updatedQueue[index], progress: 50 };
        setProcessQueue([...updatedQueue]);
        
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateStageProgress("Análise de Relevância", i, i === 100);
        }
        
        // 4. Estágio de Extração de Conhecimento
        setCurrentStage("Extração de Conhecimento");
        addLogEntry(`Extraindo entidades e relações de: ${item.title}`);
        
        updatedQueue[index] = { ...updatedQueue[index], progress: 65 };
        setProcessQueue([...updatedQueue]);
        
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateStageProgress("Extração de Conhecimento", i, i === 100);
        }
        
        // 5. Estágio de Comparação com Base de Conhecimento
        setCurrentStage("Comparação com Base de Conhecimento");
        addLogEntry(`Comparando estudo com base existente: ${item.title}`);
        
        updatedQueue[index] = { ...updatedQueue[index], progress: 80 };
        setProcessQueue([...updatedQueue]);
        
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateStageProgress("Comparação com Base de Conhecimento", i, i === 100);
        }
        
        // 6. Estágio de Padronização
        setCurrentStage("Padronização");
        addLogEntry(`Padronizando dados de: ${item.title}`);
        
        updatedQueue[index] = { ...updatedQueue[index], stage: 'standardizing' as ProcessingStage, progress: 90 };
        setProcessQueue([...updatedQueue]);
        
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateStageProgress("Padronização", i, i === 100);
        }
        
        // Verifica se há erro (probabilidade de 10%)
        const hasError = Math.random() < 0.1;
        
        if (hasError) {
          addLogEntry(`[ERRO] Falha na padronização para: ${item.title} - Formato incompatível`);
          updatedQueue[index] = { 
            ...updatedQueue[index], 
            stage: 'error' as ProcessingStage, 
            progress: 85,
            error: 'Formato incompatível de dados na padronização'
          };
          setProcessQueue([...updatedQueue]);
        } else {
          // Se não houver erro, marca como completo
          addLogEntry(`Processamento NTAI concluído para: ${item.title}`);
          updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as ProcessingStage, progress: 100 };
          setProcessQueue([...updatedQueue]);
          
          // Gera um resultado de análise simulado
          const simulatedResult = await ntaiService.analyzeStudy(item.id, `Texto simulado de ${item.title}`);
          setAnalysisResult(simulatedResult);
        }
        
        // Processa o próximo item após um breve atraso
        setTimeout(() => {
          processNextItem(index + 1);
        }, 1000);
        
      } catch (error) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as ProcessingStage, 
          progress: 50,
          error: `Erro desconhecido: ${error}`
        };
        setProcessQueue([...updatedQueue]);
        
        // Continua com o próximo item após um erro
        setTimeout(() => {
          processNextItem(index + 1);
        }, 1000);
      }
    };
    
    processNextItem(0);
  };
  
  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogEntries(prev => [...prev, `[${timestamp}] ${message}`]);
  };
  
  const clearCompleted = () => {
    setProcessQueue(processQueue.filter(item => item.stage !== 'complete'));
    toast({
      title: "Itens completos removidos",
      description: "Os itens processados com sucesso foram removidos da fila.",
    });
  };
  
  const retryFailed = () => {
    const updatedQueue = processQueue.map(item => 
      item.stage === 'error' ? { ...item, stage: 'idle' as ProcessingStage, progress: 0, error: undefined } : item
    );
    
    setProcessQueue(updatedQueue);
    toast({
      title: "Itens com falha reiniciados",
      description: "Os itens com erro foram reiniciados para novo processamento.",
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-medium">Processamento NTAI</h3>
              <Badge className="ml-2 bg-purple-100 text-purple-800" variant="outline">
                GPT-4.5
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={toggleLogVisibility}>
              {logVisible ? "Ocultar Log" : "Exibir Log"}
            </Button>
          </div>
          
          {logVisible && (
            <NtaiProcessingLog entries={logEntries} />
          )}
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Estudos Disponíveis para Processamento
            </h4>
            
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input 
                        type="checkbox"
                        checked={selectedItems.length === estudos.length && estudos.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Estudo</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudos.length > 0 ? (
                    estudos.map((estudo) => (
                      <TableRow key={estudo.id} className="hover:bg-gray-50">
                        <TableCell>
                          <input 
                            type="checkbox"
                            checked={selectedItems.includes(estudo.id)}
                            onChange={() => toggleItemSelection(estudo.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{estudo.title}</TableCell>
                        <TableCell>{estudo.journal}</TableCell>
                        <TableCell>
                          <Badge variant={estudo.status === "new" ? "default" : "outline"}>
                            {estudo.status === "new" ? "Novo" : "Em Curadoria"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhum estudo disponível para processamento
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {estudos.length > 0 && (
                <div className="p-2 bg-gray-50 border-t flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={addToQueue}
                    disabled={selectedItems.length === 0}
                  >
                    Adicionar à Fila NTAI
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Fila de Processamento
                {processQueue.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {processQueue.length} item(s)
                  </Badge>
                )}
              </h4>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCompleted}
                  disabled={!processQueue.some(item => item.stage === 'complete')}
                >
                  Limpar Completos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={retryFailed}
                  disabled={!processQueue.some(item => item.stage === 'error')}
                >
                  Repetir Falhas
                </Button>
                <Button 
                  size="sm" 
                  onClick={startProcessing}
                  disabled={processingActive || processQueue.length === 0 || !processQueue.some(item => item.stage === 'idle')}
                >
                  Iniciar Processamento
                </Button>
              </div>
            </div>
            
            {processQueue.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processQueue.map((item, index) => (
                  <NtaiProcessCard 
                    key={`${item.id}-${index}`} 
                    item={item} 
                    isActive={index === activeItemIndex}
                  />
                ))}
              </div>
            ) : (
              <div className="border rounded-md p-8 text-center text-gray-500">
                Nenhum item na fila de processamento
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {activeItemIndex !== -1 && processQueue[activeItemIndex] && (
        <NtaiProcessingPhases 
          stages={processingStages}
          currentStage={currentStage}
        />
      )}
      
      {analysisResult && (
        <NtaiAnalysisResults result={analysisResult} />
      )}
    </div>
  );
};

export default NtaiProcessingSection;
