
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PopulationChart from '../PopulationChart';

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

  return (
    <div className="space-y-6 mb-6">
      <PopulationChart 
        baseEfficacyScore={baseEfficacyScore}
        condition={nutraceuticalCondition}
        ingredients={ingredients}
      />
      
      <div>
        <h4 className="font-medium mb-2">Comparação específica para raça</h4>
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-sm">
            A eficácia em {nutraceuticalCondition} para esta raça é 23% maior que a média da população geral.
            Efeitos colaterais reportados são menos comuns (8% vs. 12% na população geral).
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-50 p-2 rounded border border-green-100">
              <p className="font-medium mb-1 text-green-800">Tempo médio para resultado</p>
              <p>4,2 semanas (população: 6,3 semanas)</p>
            </div>
            <div className="bg-blue-50 p-2 rounded border border-blue-100">
              <p className="font-medium mb-1 text-blue-800">Resposta positiva</p>
              <p>89% (população: 76%)</p>
            </div>
          </div>
        </div>
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
                description: "As recomendações de dosagem foram ajustadas com base nos dados comparativos.",
              });
              onClose();
            }}
          >
            Otimizar dosagem para raça
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonViewer;
