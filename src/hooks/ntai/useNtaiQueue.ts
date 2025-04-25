
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

    // Filtrar apenas os estudos que estão selecionados
    const estudosSelecionados = estudos.filter(estudo => selectedItems.includes(estudo.id));
    
    if (estudosSelecionados.length === 0) {
      toast({
        title: "Erro ao adicionar estudos",
        description: "Não foi possível encontrar os estudos selecionados.",
        variant: "destructive",
      });
      return;
    }

    const newItems: ProcessingItem[] = estudosSelecionados.map(estudo => {
      return {
        id: estudo.id,
        title: estudo.title || `Estudo ${estudo.id.substring(0, 8)}`,
        stage: 'idle' as ProcessingStage,
        progress: 0,
        sourceFile: estudo.journal || estudo.meta_summary_filename || '',
        originalFormat: estudo.meta_summary_filename?.split('.').pop()?.toUpperCase() || 'PDF'
      };
    });

    setProcessQueue(prev => [...prev, ...newItems]);
    setSelectedItems([]);
    
    toast({
      title: "Estudos adicionados à fila",
      description: `${newItems.length} estudo(s) adicionado(s) para processamento NTAI.`,
      variant: "default",
    });
  };

  const clearCompleted = () => {
    setProcessQueue(prev => prev.filter(item => item.stage !== 'complete'));
    toast({
      title: "Itens completos removidos",
      description: "Os itens processados com sucesso foram removidos da fila.",
      variant: "default",
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
      variant: "default",
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
