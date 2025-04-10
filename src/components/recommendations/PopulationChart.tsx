
import React, { useEffect, useState } from 'react';
import StatisticsHeader from './charts/StatisticsHeader';
import HealthConditionsChart from './charts/HealthConditionsChart';
import SuccessRateCards from './charts/SuccessRateCards';
import { 
  generateHealthConditions, 
  calculateSuccessRates, 
  generateHealthConditionData,
  generateTotalCases
} from './charts/utils';

interface PopulationChartProps {
  baseEfficacyScore: number;
  condition: string;
  ingredients?: Array<{
    name: string;
    efficacy: number;
    quantity?: string;
    removed?: boolean;
  }>;
}

const PopulationChart: React.FC<PopulationChartProps> = ({ 
  baseEfficacyScore, 
  condition,
  ingredients = []
}) => {
  const [calculatedEfficacyScore, setCalculatedEfficacyScore] = useState(baseEfficacyScore);
  
  // Calcular a eficácia com base nos ingredientes
  useEffect(() => {
    if (!ingredients || ingredients.length === 0) {
      setCalculatedEfficacyScore(baseEfficacyScore);
      return;
    }

    const activeIngredients = ingredients.filter(i => !i.removed);
    
    if (activeIngredients.length === 0) {
      setCalculatedEfficacyScore(baseEfficacyScore * 0.5);
      return;
    }
    
    const ingredientEfficacyAvg = activeIngredients.reduce((sum, ing) => sum + ing.efficacy, 0) / activeIngredients.length;
    
    const quantityAvg = activeIngredients.reduce((sum, ing) => {
      if (!ing.quantity) return sum + 1;
      const match = ing.quantity.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) / 10 : 1);
    }, 0) / activeIngredients.length;
    
    const finalEfficacy = (baseEfficacyScore * 0.4) + 
                         (ingredientEfficacyAvg * 0.4 * 5) + 
                         (quantityAvg * 0.2 * 2);
    
    setCalculatedEfficacyScore(Math.min(5, Math.max(1, finalEfficacy)));
  }, [baseEfficacyScore, ingredients]);
  
  // Gerar número aleatório de casos
  const totalCases = generateTotalCases();
  
  // Gerar condições de saúde relacionadas ao tratamento principal
  const healthConditions = generateHealthConditions(condition);
  
  // Dados de eficácia por condição de saúde
  const data = generateHealthConditionData(healthConditions, calculatedEfficacyScore);

  // Gerar taxas de sucesso estratificadas por categorias de eficácia
  const successRates = calculateSuccessRates(calculatedEfficacyScore);

  return (
    <div className="space-y-4">
      <StatisticsHeader totalCases={totalCases} />
      <HealthConditionsChart data={data} />
      <SuccessRateCards successRates={successRates} />
      
      <p className="text-xs text-center text-gray-500 mt-2">
        Eficácia comparativa para {condition} - Pontuação atual: {calculatedEfficacyScore.toFixed(1)}/5
      </p>
    </div>
  );
};

export default PopulationChart;
