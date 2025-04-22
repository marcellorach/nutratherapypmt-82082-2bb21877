
import { useState } from 'react';
import { ProcessingItem, NtaiAnalysisStage, NtaiAnalysisResult, ProcessingStage } from '@/types/ntai';
import { useToast } from "@/hooks/use-toast";
import ntaiService from '@/services/ntai-service';

export const useNtaiProcessing = () => {
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const [analysisResult, setAnalysisResult] = useState<NtaiAnalysisResult | null>(null);
  const { toast } = useToast();

  const addLogEntry = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogEntries(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (estudos: any[]) => {
    setSelectedItems(prev => 
      prev.length === estudos.length ? [] : estudos.map(estudo => estudo.id)
    );
  };

  const addToQueue = (estudos: any[]) => {
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

    setProcessQueue(prev => [...prev, ...newItems]);
    setSelectedItems([]);
    
    toast({
      title: "Estudos adicionados à fila",
      description: `${newItems.length} estudos adicionados para processamento NTAI.`,
    });
  };

  const clearCompleted = () => {
    setProcessQueue(prev => prev.filter(item => item.stage !== 'complete'));
    toast({
      title: "Itens completos removidos",
      description: "Os itens processados com sucesso foram removidos da fila.",
    });
  };

  const retryFailed = () => {
    setProcessQueue(prev => prev.map(item => 
      item.stage === 'error' 
        ? { ...item, stage: 'idle' as ProcessingStage, progress: 0, error: undefined }
        : item
    ));
    
    toast({
      title: "Itens com falha reiniciados",
      description: "Os itens com erro foram reiniciados para novo processamento.",
    });
  };

  const startProcessing = async () => {
    if (processQueue.length === 0 || processingActive) return;
    
    setProcessingActive(true);
    const updatedQueue = [...processQueue];
    setAnalysisResult(null);
    
    const processNextItem = async (index: number) => {
      if (index >= updatedQueue.length) {
        setProcessingActive(false);
        setActiveItemIndex(-1);
        return;
      }
      
      setActiveItemIndex(index);
      const item = updatedQueue[index];
      
      if (item.stage === 'complete' || item.stage === 'error') {
        processNextItem(index + 1);
        return;
      }

      try {
        // Simular processamento
        for (const stage of ['extracting', 'analyzing', 'standardizing'] as ProcessingStage[]) {
          updatedQueue[index] = { ...item, stage, progress: getProgressForStage(stage) };
          setProcessQueue([...updatedQueue]);
          await simulateStageProcessing(stage, item.title, addLogEntry);
        }

        // Gera resultado simulado
        const simulatedResult = await ntaiService.analyzeStudy(item.id, `Texto simulado de ${item.title}`);
        setAnalysisResult(simulatedResult);

        // Marca como completo
        updatedQueue[index] = { ...updatedQueue[index], stage: 'complete' as ProcessingStage, progress: 100 };
        setProcessQueue([...updatedQueue]);
        addLogEntry(`Processamento NTAI concluído para: ${item.title}`);

      } catch (error) {
        addLogEntry(`[ERRO] Falha no processamento para: ${item.title} - ${error}`);
        updatedQueue[index] = { 
          ...updatedQueue[index], 
          stage: 'error' as ProcessingStage, 
          progress: 50,
          error: `Erro desconhecido: ${error}`
        };
        setProcessQueue([...updatedQueue]);
      }

      // Processa próximo item após um breve delay
      setTimeout(() => processNextItem(index + 1), 1000);
    };
    
    processNextItem(0);
  };

  return {
    processQueue,
    selectedItems,
    processingActive,
    logEntries,
    activeItemIndex,
    analysisResult,
    toggleItemSelection,
    handleSelectAll,
    addToQueue,
    clearCompleted,
    retryFailed,
    startProcessing,
    setLogEntries,
  };
};

// Funções auxiliares
const getProgressForStage = (stage: ProcessingStage): number => {
  switch (stage) {
    case 'extracting':
      return 30;
    case 'analyzing':
      return 60;
    case 'standardizing':
      return 90;
    default:
      return 0;
  }
};

const simulateStageProcessing = async (
  stage: ProcessingStage, 
  itemTitle: string, 
  logCallback: (message: string) => void
) => {
  const delay = Math.random() * 2000 + 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  logCallback(`${getStageMessage(stage)} para: ${itemTitle}`);
};

const getStageMessage = (stage: ProcessingStage): string => {
  switch (stage) {
    case 'extracting':
      return 'Extraindo texto';
    case 'analyzing':
      return 'Analisando conteúdo';
    case 'standardizing':
      return 'Padronizando dados';
    default:
      return 'Processando';
  }
};

