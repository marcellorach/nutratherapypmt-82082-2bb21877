
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown,
  Briefcase,
  Lightbulb,
  Users,
  User
} from "lucide-react";
import { Sugestao } from '../types/sugestoes';
import { approvalStages } from '../data/sugestoesData';

interface SugestaoCardProps {
  sugestao: Sugestao;
  onApprove: () => void;
  onReject: () => void;
  onDetails: () => void;
}

const SugestaoCard: React.FC<SugestaoCardProps> = ({ 
  sugestao, 
  onApprove, 
  onReject, 
  onDetails 
}) => {
  const { t } = useTranslation();
  
  const getStatusBadge = () => {
    switch (sugestao.status) {
      case 'nova':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{t('studyProposals.status.new')}</Badge>;
      case 'aprovada':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{t('studyProposals.status.approved')}</Badge>;
      case 'rejeitada':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{t('studyProposals.status.rejected')}</Badge>;
      case 'em_analise':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">{t('studyProposals.status.inAnalysis')}</Badge>;
      default:
        return null;
    }
  };

  // Ícone e texto baseado na origem da sugestão
  const getOrigemInfo = () => {
    switch (sugestao.origem) {
      case 'ia':
        return {
          icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
          text: t('studyProposals.origin.ai')
        };
      case 'comite_cientifico':
        return {
          icon: <Users className="h-5 w-5 text-indigo-500" />,
          text: t('studyProposals.origin.scientificCommittee')
        };
      case 'externa':
        return {
          icon: <User className="h-5 w-5 text-emerald-500" />,
          text: t('studyProposals.origin.external')
        };
      default:
        return {
          icon: <Lightbulb className="h-5 w-5 text-gray-500" />,
          text: t('studyProposals.origin.unknown')
        };
    }
  };

  const origemInfo = getOrigemInfo();

  return (
    <Card className="shadow-md hover:shadow-lg transition-all border-t-4 border-t-slate-200">
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex items-start gap-2">
            {origemInfo.icon}
            <div>
              <Badge variant="outline" className="mb-2 font-normal">
                {origemInfo.text}
              </Badge>
              <CardTitle className="text-lg leading-tight">{sugestao.titulo}</CardTitle>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {t('studyProposals.card.confidence')}: <span className="font-medium">{sugestao.confianca}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Raciocínio sempre visível */}
        <div>
          <h4 className="text-sm font-medium mb-1">{t('studyProposals.card.reasoning')}</h4>
          <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border">{sugestao.raciocinio}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium">{t('studyProposals.card.suggestedPopulation')}</h4>
          <p className="text-sm text-muted-foreground">{sugestao.populacao_sugerida}</p>
        </div>
        
        {/* Metodologia sempre visível */}
        <div>
          <h4 className="text-sm font-medium">{t('studyProposals.card.suggestedMethodology')}</h4>
          <p className="text-sm text-muted-foreground">{sugestao.metodologia}</p>
        </div>
        
        {/* Baseado em - sempre visível */}
        <div>
          <h4 className="text-sm font-medium">{t('studyProposals.card.basedOn')}:</h4>
          <ul className="text-sm text-muted-foreground list-disc ml-5">
            {sugestao.baseado_em.map((base, index) => (
              <li key={index}>{base}</li>
            ))}
          </ul>
        </div>
        
        {/* Marcadores sugeridos - sempre visíveis */}
        <div>
          <h4 className="text-sm font-medium">{t('studyProposals.card.suggestedMarkers')}:</h4>
          <ul className="text-sm text-muted-foreground list-disc ml-5">
            {sugestao.marcadores_sugeridos.map((marcador, index) => (
              <li key={index}>{marcador}</li>
            ))}
          </ul>
        </div>
        
        {/* Mostrar a primeira etapa da aprovação que está pendente ou em análise */}
        {sugestao.approvalChain && sugestao.approvalChain.length > 0 && (
          <div className="mt-2">
            {(() => {
              const currentStageIndex = sugestao.approvalChain.findIndex(item => item.approved === null);
              if (currentStageIndex !== -1) {
                const currentStageId = sugestao.approvalChain[currentStageIndex].stage;
                const stage = approvalStages.find(s => s.id === currentStageId);
                if (stage) {
                  const StageIcon = stage.icon;
                  return (
                    <div className="flex items-center text-amber-600 bg-amber-50 p-2 rounded-md">
                      <StageIcon className="h-4 w-4 mr-2" />
                      <span className="text-xs font-medium">{t('studyProposals.card.inAnalysisBy')}: {t(`studyProposals.approvalChain.stages.${stage.id.replace(/_/g, '')}` as any)}</span>
                    </div>
                  );
                }
              } else if (sugestao.status === 'aprovada') {
                return (
                  <div className="flex items-center text-green-600 bg-green-50 p-2 rounded-md">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">{t('studyProposals.card.approvedByAll')}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" onClick={onDetails}>
          {t('studyProposals.card.viewDetails')}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {sugestao.status === 'nova' && (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onReject}
            >
              <ThumbsDown className="mr-1 h-4 w-4" />
              {t('studyProposals.card.reject')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-500 hover:text-green-700 hover:bg-green-50"
              onClick={onApprove}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              {t('studyProposals.card.approve')}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SugestaoCard;
