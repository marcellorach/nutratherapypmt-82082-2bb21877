
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
    <ScrollArea className="h-full max-h-[70vh]">
      <div className="space-y-6 mb-6 p-1">
        <PopulationChart 
          baseEfficacyScore={baseEfficacyScore}
          condition={nutraceuticalCondition}
          ingredients={ingredients}
        />
        
        <div>
          <h4 className="font-medium mb-2">Comparação específica para raça: {currentRace}</h4>
          <p className="text-sm mb-3 bg-slate-50 p-3 rounded-md">
            A eficácia em {nutraceuticalCondition} para {currentRace}s é {raceSpecificData.melhoria}% maior que a média da população geral.
            Efeitos colaterais reportados são menos comuns ({raceSpecificData.racaEfeitosColaterais}% vs. {raceSpecificData.populacaoEfeitosColaterais}% na população geral).
          </p>
          
          {/* Adicionando o gráfico de comparação por raça */}
          <RaceComparisonChart 
            currentRace={currentRace} 
            condition={nutraceuticalCondition}
          />
        </div>
        
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
