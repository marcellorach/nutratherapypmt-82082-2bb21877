
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import EvidenceTag from '../../tags/EvidenceTag';
import NutraceuticalTag from '../../tags/NutraceuticalTag';
import OutcomeTag from '../../tags/OutcomeTag';
import { Badge } from "@/components/ui/badge";

interface EstudoCardProps {
  estudo: any;
  onView: (estudo: any) => void;
  buttonLabel?: string;
  getNutraceuticalScore: (name: string) => number;
}

const EstudoCard: React.FC<EstudoCardProps> = ({ 
  estudo, 
  onView, 
  buttonLabel = "Ver Detalhes",
  getNutraceuticalScore 
}) => {
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
    ],
    estudoSimulado: estudo.isSimulated || false
  };

  // Verificar se o estudo tem análise NTAI
  const hasNtaiAnalysis = estudo.analysis_data || estudo.ntaiAnalysis;
  const ntaiAnalysis = estudo.analysis_data || estudo.ntaiAnalysis;
  
  // Identificar se os dados são simulados
  const isDataSimulated = ntaiAnalysis?.isSimulated || ntaiData.estudoSimulado;

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
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold mb-3 text-purple-700">Análise NTAI</h4>
            
            {isDataSimulated && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Parcialmente Simulado
              </Badge>
            )}
          </div>
          
          {/* Exibir resumo do estudo se disponível */}
          {ntaiAnalysis?.summary && (
            <div className="mb-3 text-sm border-l-2 border-purple-300 pl-2">
              <p className="text-gray-700">{ntaiAnalysis.summary}</p>
            </div>
          )}
          
          {/* Seção Nutraceuticos */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Nutraceuticos</p>
            <div className="flex flex-wrap gap-1">
              {(ntaiAnalysis?.extractedNutraceuticals || ntaiData.nutraceuticos).map((nutra: any, idx: number) => (
                <NutraceuticalTag 
                  key={idx} 
                  name={nutra.name || nutra}
                  score={nutra.confidence ? (nutra.confidence * 5) : getNutraceuticalScore(nutra.name || nutra)} 
                  isSimulated={nutra.isSimulated}
                />
              ))}
            </div>
          </div>

          {/* Seção Condições */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Condições</p>
            <div className="flex flex-wrap gap-1">
              {(ntaiAnalysis?.extractedConditions || ntaiData.condicoes).map((condicao: any, idx: number) => (
                <OutcomeTag 
                  key={idx}
                  condition={condicao.name || condicao.nome}
                  score={condicao.efficacyScore || condicao.score}
                  isSimulated={condicao.isSimulated}
                />
              ))}
            </div>
          </div>

          {/* Seção Interações */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Interações</p>
            <div className="flex flex-wrap gap-1">
              {/* Interações positivas */}
              {(ntaiAnalysis?.extractedInteractions?.filter((i: any) => i.type === 'positive') || ntaiData.interacoesPositivas).map((interacao: any, idx: number) => (
                <Badge 
                  key={`pos-${idx}`}
                  variant="outline" 
                  className="bg-green-50 text-green-700 border-green-200 flex items-center"
                >
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {interacao.name || interacao.nome} ({(interacao.score || 0).toFixed(1)})
                  {interacao.isSimulated && (
                    <AlertTriangle className="w-3 h-3 ml-1 text-amber-500" />
                  )}
                </Badge>
              ))}
              
              {/* Interações negativas */}
              {(ntaiAnalysis?.extractedInteractions?.filter((i: any) => i.type === 'negative') || ntaiData.interacoesNegativas).map((interacao: any, idx: number) => (
                <Badge 
                  key={`neg-${idx}`}
                  variant="outline" 
                  className="bg-red-50 text-red-700 border-red-200 flex items-center"
                >
                  <ArrowDown className="w-3 h-3 mr-1" />
                  {interacao.name || interacao.nome} ({(interacao.score || 0).toFixed(1)})
                  {interacao.isSimulated && (
                    <AlertTriangle className="w-3 h-3 ml-1 text-amber-500" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Informações adicionais */}
          {ntaiAnalysis?.studyPopulation && (
            <div className="mb-3 text-xs">
              <p className="text-gray-500 mb-1">População Estudada</p>
              <div className="bg-gray-50 p-2 rounded-md">
                {ntaiAnalysis.studyPopulation.type === 'human' ? 'Humanos' :
                 ntaiAnalysis.studyPopulation.type === 'canine' ? 'Cães' :
                 ntaiAnalysis.studyPopulation.type === 'feline' ? 'Gatos' :
                 ntaiAnalysis.studyPopulation.type === 'rodent' ? 'Roedores' : 'Outros'} 
                ({ntaiAnalysis.studyPopulation.count || 'N/A'})
                {ntaiAnalysis.studyPopulation.isSimulated && (
                  <span className="ml-1 text-amber-500">(simulado)</span>
                )}
              </div>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={() => onView(estudo)}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EstudoCard;
