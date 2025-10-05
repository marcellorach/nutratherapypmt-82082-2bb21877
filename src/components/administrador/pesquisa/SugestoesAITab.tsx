import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Filter } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useSugestoes } from './hooks/useSugestoes';
import SugestaoCard from './components/SugestaoCard';
import SugestaoDetailsDialog from './components/SugestaoDetailsDialog';

const SugestoesAITab: React.FC = () => {
  const { t } = useTranslation();
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
          <h2 className="text-2xl font-bold tracking-tight">{t('studyProposals.title')}</h2>
          <p className="text-muted-foreground">
            {t('studyProposals.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('studyProposals.filter')}
          </Button>
          <Button variant="outline" className="flex items-center">
            <Sparkles className="mr-2 h-4 w-4" />
            {t('studyProposals.requestNew')}
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