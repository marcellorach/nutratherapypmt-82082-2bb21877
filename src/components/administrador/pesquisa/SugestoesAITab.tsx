
import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Filter } from "lucide-react";
import { useSugestoes } from './hooks/useSugestoes';
import SugestaoCard from './components/SugestaoCard';
import SugestaoDetailsDialog from './components/SugestaoDetailsDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SugestoesAITab: React.FC = () => {
  const {
    sugestoes,
    sugestaoSelecionada,
    dialogOpen,
    setDialogOpen,
    setSugestaoSelecionada,
    handleApprove,
    handleReject,
    handleViewDetails,
    handleAdvanceApproval
  } = useSugestoes();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sugestões de Pesquisa</h2>
          <p className="text-muted-foreground">
            Avalie estudos científicos sugeridos com base em análise de dados e evidências.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline" className="flex items-center">
            <Sparkles className="mr-2 h-4 w-4" />
            Solicitar novas sugestões
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sugestoes.map(sugestao => (
          <SugestaoCard 
            key={sugestao.id} 
            sugestao={sugestao}
            onApprove={() => handleApprove(sugestao.id)}
            onReject={() => handleReject(sugestao.id)}
            onDetails={() => handleViewDetails(sugestao)}
          />
        ))}
      </div>
      
      <SugestaoDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sugestao={sugestaoSelecionada}
        onApprove={handleApprove}
        onReject={handleReject}
        onAdvanceApproval={handleAdvanceApproval}
      />
    </div>
  );
};

export default SugestoesAITab;
