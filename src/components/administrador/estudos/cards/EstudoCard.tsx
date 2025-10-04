
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowRight, ArrowLeft } from 'lucide-react';
import EvidenceTag from '../../tags/EvidenceTag';
import NutraceuticalTag from '../../tags/NutraceuticalTag';
import OutcomeTag from '../../tags/OutcomeTag';
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface EstudoCardProps {
  estudo: any;
  onView: (estudo: any) => void;
  buttonLabel?: string;
  getNutraceuticalScore: (name: string) => number;
}

const EstudoCard: React.FC<EstudoCardProps> = ({ 
  estudo, 
  onView, 
  buttonLabel,
  getNutraceuticalScore 
}) => {
  const { t } = useTranslation();
  // Dados de exemplo para as seções NTAI (em produção viriam do backend)
  const ntaiData = {
    nutraceuticos: estudo.nutraceuticals || [],
    condicoes: [
      { nome: "Artrite Canina", score: 4.5 },
      { nome: "Inflamação Articular", score: 3.8 }
    ],
    interacoesPositivas: [
      { nome: "Glucosamina", score: 4.0 },
      { nome: "MSM", score: 3.8 }
    ],
    interacoesNegativas: [
      { nome: "Anti-inflamatórios", score: 2.5 }
    ],
    efeitosColaterais: [
      { nome: "Sonolência Leve", score: 2.0 },
      { nome: "Alteração Apetite", score: 1.8 }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>{estudo.title}</CardTitle>
          <EvidenceTag score={estudo.qualityScore} showLabel={false} />
        </div>
        <CardDescription>{estudo.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-3 text-purple-700">{t('studies.card.ntaiAnalysis')}</h4>
          
          {/* Seção Nutraceuticos */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{t('studies.card.nutraceuticals')}</p>
            <div className="flex flex-wrap gap-1">
              {ntaiData.nutraceuticos.map((nutra: string, idx: number) => (
                <NutraceuticalTag 
                  key={idx} 
                  name={nutra} 
                  score={getNutraceuticalScore(nutra)} 
                />
              ))}
            </div>
          </div>

          {/* Seção Condições */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{t('studies.card.conditions')}</p>
            <div className="flex flex-wrap gap-1">
              {ntaiData.condicoes.map((condicao, idx) => (
                <OutcomeTag 
                  key={idx}
                  outcome={condicao.nome}
                  score={condicao.score}
                />
              ))}
            </div>
          </div>

          {/* Seção Interações */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{t('studies.card.interactions')}</p>
            <div className="flex flex-wrap gap-1">
              {ntaiData.interacoesPositivas.map((interacao, idx) => (
                <Badge 
                  key={`pos-${idx}`}
                  variant="outline" 
                  className="bg-green-50 text-green-700 border-green-200 flex items-center"
                >
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {interacao.nome} ({interacao.score.toFixed(1)})
                </Badge>
              ))}
              {ntaiData.interacoesNegativas.map((interacao, idx) => (
                <Badge 
                  key={`neg-${idx}`}
                  variant="outline" 
                  className="bg-red-50 text-red-700 border-red-200 flex items-center"
                >
                  <ArrowDown className="w-3 h-3 mr-1" />
                  {interacao.nome} ({interacao.score.toFixed(1)})
                </Badge>
              ))}
            </div>
          </div>

          {/* Seção Efeitos Colaterais */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{t('studies.card.sideEffects')}</p>
            <div className="flex flex-wrap gap-1">
              {ntaiData.efeitosColaterais.map((efeito, idx) => (
                <Badge 
                  key={idx}
                  variant="outline" 
                  className="bg-amber-50 text-amber-700 border-amber-200 flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  {efeito.nome} ({efeito.score.toFixed(1)})
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={() => onView(estudo)}
        >
          {buttonLabel || t('studies.kanban.viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstudoCard;
