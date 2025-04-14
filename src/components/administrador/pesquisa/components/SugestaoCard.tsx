
import React from 'react';
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
import { 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown,
  Briefcase
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
  const getStatusBadge = () => {
    switch (sugestao.status) {
      case 'nova':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Nova</Badge>;
      case 'aprovada':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovada</Badge>;
      case 'rejeitada':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejeitada</Badge>;
      case 'em_analise':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Em análise</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-md">{sugestao.titulo}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Confiança da IA: <span className="font-medium">{sugestao.confianca}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">População Sugerida</h4>
          <p className="text-sm text-muted-foreground">{sugestao.populacao_sugerida}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Baseado em:</h4>
          <ul className="text-sm text-muted-foreground list-disc ml-5">
            {sugestao.baseado_em.slice(0, 2).map((base, index) => (
              <li key={index}>{base}</li>
            ))}
            {sugestao.baseado_em.length > 2 && (
              <li>+ {sugestao.baseado_em.length - 2} outras fontes</li>
            )}
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
                      <span className="text-xs font-medium">Em análise: {stage.name}</span>
                    </div>
                  );
                }
              } else if (sugestao.status === 'aprovada') {
                return (
                  <div className="flex items-center text-green-600 bg-green-50 p-2 rounded-md">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="text-xs font-medium">Aprovada por todos os comitês</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onDetails}>
          Ver detalhes
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
              Rejeitar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-500 hover:text-green-700 hover:bg-green-50"
              onClick={onApprove}
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              Aprovar
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SugestaoCard;
