
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PopulationChart from '../PopulationChart';
import RaceComparisonChart from '../RaceComparisonChart';
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActiveIngredientType {
  name: string;
  quantity: string;
  removed?: boolean;
  efficacy: number;
}

interface ComparisonViewerProps {
  nutraceuticalName: string;
  nutraceuticalCondition: string;
  baseEfficacyScore: number;
  ingredients: ActiveIngredientType[];
  onClose: () => void;
}

const ComparisonViewer: React.FC<ComparisonViewerProps> = ({ 
  nutraceuticalName,
  nutraceuticalCondition,
  baseEfficacyScore,
  ingredients,
  onClose
}) => {
  const { toast } = useToast();
  
  // Função para determinar raça atual com base nos dados
  const getCurrentRace = () => {
    // Aqui poderíamos buscar a raça real do pet em questão, mas usaremos um exemplo
    const races = ["Golden Retriever", "Bulldog Francês", "Beagle", "Pastor Alemão", "Poodle"];
    return races[Math.floor(Math.random() * races.length)];
  };
  
  const currentRace = getCurrentRace();
  
  // Comparação específica para raça
  const raceSpecificData = {
    populacao: {
      tempoMedio: 6.3,
      taxaResposta: 76
    },
    atual: {
      tempoMedio: 4.2,
      taxaResposta: 89
    },
    reducaoEfeitosColaterais: Math.floor(Math.random() * 10) + 3,
    populacaoEfeitosColaterais: Math.floor(Math.random() * 10) + 10,
    racaEfeitosColaterais: Math.floor(Math.random() * 8),
    melhoria: Math.floor(Math.random() * 15) + 15
  };

  return (
    <ScrollArea className="max-h-[80vh]">
      <div className="space-y-6 mb-6 p-1">
        <PopulationChart 
          baseEfficacyScore={baseEfficacyScore}
          condition={nutraceuticalCondition}
          ingredients={ingredients}
        />
        
        <div>
          <h4 className="font-medium mb-2">Comparação específica para raça: {currentRace}</h4>
          <div className="bg-slate-50 p-3 rounded-md">
            <p className="text-sm">
              A eficácia em {nutraceuticalCondition} para {currentRace}s é {raceSpecificData.melhoria}% maior que a média da população geral.
              Efeitos colaterais reportados são menos comuns ({raceSpecificData.racaEfeitosColaterais}% vs. {raceSpecificData.populacaoEfeitosColaterais}% na população geral).
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 p-2 rounded border border-green-100">
                <p className="font-medium mb-1 text-green-800">Tempo médio para resultado</p>
                <p>{raceSpecificData.atual.tempoMedio} semanas (população: {raceSpecificData.populacao.tempoMedio} semanas)</p>
              </div>
              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                <p className="font-medium mb-1 text-blue-800">Resposta positiva</p>
                <p>{raceSpecificData.atual.taxaResposta}% (população: {raceSpecificData.populacao.taxaResposta}%)</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Adicionando o novo gráfico de comparação por raça */}
        <RaceComparisonChart 
          currentRace={currentRace} 
          condition={nutraceuticalCondition}
        />
        
        <div>
          <h4 className="font-medium mb-2">Ajuste de dosagem recomendado</h4>
          <div className="bg-slate-50 p-3 rounded-md">
            <p className="text-sm mb-2">
              Baseado nos dados comparativos, uma pequena redução na dosagem ainda manteria a eficácia para esta raça específica.
            </p>
            <Button 
              variant="outline" 
              className="w-full text-sm border-primary text-primary hover:bg-primary/5"
              onClick={() => {
                toast({
                  title: "Dosagem otimizada",
                  description: `As recomendações de dosagem foram ajustadas com base nos dados comparativos para ${currentRace}.`,
                });
                onClose();
              }}
            >
              Otimizar dosagem para {currentRace}
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ComparisonViewer;
