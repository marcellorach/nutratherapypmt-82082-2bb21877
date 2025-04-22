
import { useState } from 'react';
import { ProcessingItem, ProcessingStage } from '@/types/ntai';
import { useToast } from "@/hooks/use-toast";

export const useNtaiQueue = () => {
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const { toast } = useToast();

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

  return {
    processQueue,
    selectedItems,
    processingActive,
    activeItemIndex,
    setProcessQueue,
    setSelectedItems,
    setProcessingActive,
    setActiveItemIndex,
    addToQueue,
    clearCompleted,
    retryFailed,
  };
};
