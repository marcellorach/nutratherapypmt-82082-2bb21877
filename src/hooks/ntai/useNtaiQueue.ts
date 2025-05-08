
import { useState, useEffect } from 'react';
import { ProcessingItem, ProcessingStage } from '@/types/ntai';
import { useToast } from "@/hooks/use-toast";
import { AvailableStudy } from './types/processing';
import { supabase } from '@/integrations/supabase/client';

export const useNtaiQueue = () => {
  const [processQueue, setProcessQueue] = useState<ProcessingItem[]>([]);
  const [processingActive, setProcessingActive] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(-1);
  const { toast } = useToast();
  
  // Carregar estudos pendentes do banco ao inicializar
  useEffect(() => {
    const loadPendingStudies = async () => {
      try {
        const { data, error } = await supabase
          .from('processed_studies')
          .select('*')
          .eq('kanban_status', 'new')
          .is('analysis_data', null); // Estudos sem análise
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log('Estudos pendentes encontrados:', data.length);
          
          // Converter para formato de fila
          const queueItems: ProcessingItem[] = data.map(study => ({
            id: study.id,
            title: study.title || `Estudo ${study.study_id.substring(0, 8)}`,
            stage: 'idle' as ProcessingStage,
            progress: 0,
            sourceFile: study.original_filename || 'Desconhecido',
            originalFormat: study.original_filename?.split('.').pop()?.toUpperCase() || 'PDF'
          }));
          
          setProcessQueue(prev => {
            // Adicionar apenas os itens que ainda não estão na fila
            const existingIds = prev.map(item => item.id);
            return [
              ...prev, 
              ...queueItems.filter(item => !existingIds.includes(item.id))
            ];
          });
        }
      } catch (err) {
        console.error('Erro ao carregar estudos pendentes:', err);
      }
    };
    
    loadPendingStudies();
  }, []);

  const addToQueue = (estudos: AvailableStudy[], selectedIds: string[]) => {
    console.log('Função addToQueue chamada com:', { estudos, selectedIds });
    
    if (selectedIds.length === 0) {
      toast({
        title: "Nenhum estudo selecionado",
        description: "Selecione pelo menos um estudo para processar.",
        variant: "destructive",
      });
      return;
    }

    // Filtrar apenas os estudos que estão selecionados
    const estudosSelecionados = estudos.filter(estudo => selectedIds.includes(estudo.id));
    
    if (estudosSelecionados.length === 0) {
      toast({
        title: "Erro ao adicionar estudos",
        description: "Não foi possível encontrar os estudos selecionados.",
        variant: "destructive",
      });
      return;
    }

    // Antes de adicionar, vamos garantir que os IDs sejam UUIDs válidos
    // Se não forem, vamos gerar novos UUIDs para evitar erros
    const newItems: ProcessingItem[] = estudosSelecionados.map(estudo => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let studyId = estudo.id;
      
      // Se não for um UUID válido, vamos gerar um novo
      if (!uuidRegex.test(studyId)) {
        studyId = crypto.randomUUID();
        console.log(`ID inválido detectado. Gerado novo UUID: ${studyId} para estudo ${estudo.title}`);
      }
      
      return {
        id: studyId,
        title: estudo.title || `Estudo ${studyId.substring(0, 8)}`,
        stage: 'idle' as ProcessingStage,
        progress: 0,
        sourceFile: estudo.journal || 'Desconhecido',
        originalFormat: estudo.title?.split('.').pop()?.toUpperCase() || 'PDF'
      };
    });

    setProcessQueue(prev => [...prev, ...newItems]);
    
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
  
  // Função para atualizar estudos com análise concluída no banco
  const updateProcessedStudy = async (studyId: string, analysisData: any) => {
    try {
      // Verificar se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(studyId)) {
        console.error('ID de estudo inválido para atualização:', studyId);
        return false;
      }
      
      const { error } = await supabase
        .from('processed_studies')
        .update({ 
          analysis_data: analysisData,
          kanban_status: 'processed' 
        })
        .eq('id', studyId);
        
      if (error) throw error;
      
      console.log('Estudo atualizado com sucesso:', studyId);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar estudo processado:', err);
      return false;
    }
  };

  return {
    processQueue,
    processingActive,
    activeItemIndex,
    setProcessQueue,
    setProcessingActive,
    setActiveItemIndex,
    addToQueue,
    clearCompleted,
    retryFailed,
    updateProcessedStudy
  };
};
