
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Sugestao } from '../types/sugestoes';
import { mockSugestoes, approvalStages } from '../data/sugestoesData';

export const useSugestoes = () => {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>(mockSugestoes);
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<Sugestao | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleApprove = (id: string) => {
    setSugestoes(sugestoes.map(s => {
      if (s.id === id) {
        // Iniciar a cadeia de aprovação
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        return { 
          ...s, 
          status: 'em_analise',
          approvalChain: approvalStages.map((stage, index) => ({
            stage: stage.id,
            approved: index === 0 ? true : null,
            date: index === 0 ? formattedDate : null
          }))
        };
      }
      return s;
    }));
    
    toast({
      title: "Sugestão enviada para análise",
      description: "A sugestão foi aprovada e enviada para a Supervisão Científica.",
    });
  };
  
  const handleReject = (id: string) => {
    setSugestoes(sugestoes.map(s => 
      s.id === id ? { ...s, status: 'rejeitada' } : s
    ));
    toast({
      title: "Sugestão rejeitada",
      description: "A sugestão foi arquivada.",
    });
  };
  
  const handleViewDetails = (sugestao: Sugestao) => {
    setSugestaoSelecionada(sugestao);
    setDialogOpen(true);
  };

  // Função para processar a próxima etapa da aprovação
  const handleAdvanceApproval = (id: string) => {
    setSugestoes(prevSugestoes => {
      const updatedSugestoes = prevSugestoes.map(s => {
        if (s.id === id) {
          const approvalChain = [...s.approvalChain];
          const currentStageIndex = approvalChain.findIndex(item => item.approved === null);
          
          if (currentStageIndex !== -1) {
            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            
            approvalChain[currentStageIndex].approved = true;
            approvalChain[currentStageIndex].date = formattedDate;
            
            // Se for a última etapa, atualizar o status para aprovada
            if (currentStageIndex === approvalChain.length - 1) {
              return { ...s, status: 'aprovada', approvalChain };
            }
            
            return { ...s, approvalChain };
          }
          return s;
        }
        return s;
      });

      // Encontrar a sugestão após a atualização
      const sugestao = updatedSugestoes.find(s => s.id === id);
      if (sugestao) {
        const currentStageIndex = sugestao.approvalChain.findIndex(item => item.approved === null);
        
        if (currentStageIndex !== -1) {
          const currentStage = currentStageIndex > 0 
            ? approvalStages[currentStageIndex - 1] 
            : approvalStages[0];
            
          toast({
            title: "Aprovação avançada",
            description: `A sugestão foi aprovada pelo ${currentStage.name} e avançou para a próxima etapa.`,
          });
        } else {
          toast({
            title: "Estudo aprovado!",
            description: "Todas as etapas de aprovação foram concluídas. O estudo está aprovado para início.",
          });
        }
      }
      
      return updatedSugestoes;
    });
    
    setDialogOpen(false);
  };

  return {
    sugestoes,
    sugestaoSelecionada,
    dialogOpen,
    setDialogOpen,
    setSugestaoSelecionada,
    handleApprove,
    handleReject,
    handleViewDetails,
    handleAdvanceApproval
  };
};
