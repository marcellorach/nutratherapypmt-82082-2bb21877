
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  
  // Gerar número aleatório de casos entre 1800 e 42000
  const totalCases = Math.floor(Math.random() * (42000 - 1800 + 1) + 1800);
  
  // Novo: gerar condições de saúde relacionadas ao tratamento principal
  const generateHealthConditions = () => {
    const mainCondition = condition;
    const relatedConditions = {
      "Dermatite atópica": ["Ressecamento da pele", "Alergia sazonal", "Prurido"],
      "Problemas articulares": ["Artrite", "Displasia", "Dor crônica"],
      "Sistema imunológico": ["Infecções recorrentes", "Alergias", "Baixa imunidade"],
      "Problemas cardíacos": ["Arritmia", "Hipertensão", "Fadiga"],
      "Problemas cognitivos": ["Desorientação", "Perda de memória", "Ansiedade"],
      "Suporte hepático": ["Enzimas alteradas", "Metabolismo lento", "Toxicidade"]
    };
    
    // Encontrar a categoria mais próxima
    let category = Object.keys(relatedConditions).find(c => 
      mainCondition.toLowerCase().includes(c.toLowerCase())
    ) || Object.keys(relatedConditions)[0];
    
    return [
      mainCondition,
      ...relatedConditions[category as keyof typeof relatedConditions].slice(0, 2)
    ];
  };
  
  const healthConditions = generateHealthConditions();
  
  // Dados de eficácia por condição de saúde
  const data = healthConditions.map(cond => {
    // Variação da eficácia para diferentes condições
    const variationFactor = cond === condition ? 1 : 0.7 + Math.random() * 0.4;
    
    return {
      name: cond,
      estudos: Math.round(calculatedEfficacyScore * 15 * variationFactor),
      petlove: Math.min(95, Math.round(calculatedEfficacyScore * 18 * variationFactor * (1 + Math.random() * 0.2))),
    };
  });

  // Gerar taxas de sucesso estratificadas por categorias de eficácia
  const efficacyRate = Math.min(100, Math.round(calculatedEfficacyScore * 20));
  const successRates = {
    // Taxa para estudos científicos
    estudos: {
      eficaz: Math.round(efficacyRate * 0.9),
      baixaEficacia: Math.min(100 - Math.round(efficacyRate * 0.9), Math.round((100 - Math.round(efficacyRate * 0.9)) * 0.7)),
      ineficaz: Math.max(0, 100 - Math.round(efficacyRate * 0.9) - Math.min(100 - Math.round(efficacyRate * 0.9), Math.round((100 - Math.round(efficacyRate * 0.9)) * 0.7))),
    },
    // Taxa para população PetLove
    petlove: {
      eficaz: efficacyRate,
      baixaEficacia: Math.min(100 - efficacyRate, Math.round((100 - efficacyRate) * 0.8)),
      ineficaz: Math.max(0, 100 - efficacyRate - Math.min(100 - efficacyRate, Math.round((100 - efficacyRate) * 0.8))),
    },
    // Tempo médio de resposta
    tempoMedio: Math.max(5, Math.round(25 - calculatedEfficacyScore * 2)),
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm max-w-[200px]">
          <p className="text-sm font-medium truncate">{label}</p>
          <div className="space-y-1 mt-1">
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 inline-block bg-[#9b87f5] mr-1 rounded-sm"></span> 
              <span>Estudos científicos: </span>
              <span className="font-medium ml-1">{`${payload[0].value}%`}</span>
            </p>
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 inline-block bg-[#33C3F0] mr-1 rounded-sm"></span>
              <span>População PetLove: </span>
              <span className="font-medium ml-1">{`${payload[1].value}%`}</span>
            </p>
          </div>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium mb-2">Estatísticas relevantes em relação aos pacientes segurados</h3>
        <p className="text-xs text-gray-500 mb-2">Baseado em {totalCases.toLocaleString()} casos analisados</p>
      </div>
      
      <div className="w-full h-64">
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm font-medium">Eficácia por condição de saúde</span>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block bg-[#9b87f5] mr-1 rounded-sm"></span>
              <span>Estudos científicos</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 inline-block bg-[#33C3F0] mr-1 rounded-sm"></span>
              <span>População PetLove</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 30,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="estudos" name="estudos" fill="#9b87f5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="petlove" name="petlove" fill="#33C3F0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-xs text-gray-500">Taxa de sucesso - Estudos</p>
          <p className="text-xl font-bold text-green-600">{successRates.estudos.eficaz}%</p>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <TrendingUp size={14} className="text-green-600 mr-1" /> Eficaz:
              </span>
              <span className="font-medium text-green-600">{successRates.estudos.eficaz}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <Minus size={14} className="text-amber-600 mr-1" /> Baixa eficácia:
              </span>
              <span className="font-medium text-amber-600">{successRates.estudos.baixaEficacia}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <TrendingDown size={14} className="text-red-600 mr-1" /> Ineficaz:
              </span>
              <span className="font-medium text-red-600">{successRates.estudos.ineficaz}%</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-xs text-gray-500">Taxa de sucesso - PetLove</p>
          <p className="text-xl font-bold text-green-600">{successRates.petlove.eficaz}%</p>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <TrendingUp size={14} className="text-green-600 mr-1" /> Eficaz:
              </span>
              <span className="font-medium text-green-600">{successRates.petlove.eficaz}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <Minus size={14} className="text-amber-600 mr-1" /> Baixa eficácia:
              </span>
              <span className="font-medium text-amber-600">{successRates.petlove.baixaEficacia}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center">
                <TrendingDown size={14} className="text-red-600 mr-1" /> Ineficaz:
              </span>
              <span className="font-medium text-red-600">{successRates.petlove.ineficaz}%</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-xs text-gray-500">Tempo médio até resposta</p>
          <p className="text-xl font-bold">{successRates.tempoMedio} dias</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Reação inicial</span>
              <span>Resposta completa</span>
            </div>
            <div className="progress-bar bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full" 
                style={{ width: `${Math.min(100, 100 - successRates.tempoMedio * 2)}%` }}
              ></div>
            </div>
            <p className="text-xs text-center mt-2 text-gray-600">
              Média da população: {Math.round(successRates.tempoMedio * 1.5)} dias
            </p>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-2">
        Eficácia comparativa para {condition} - Pontuação atual: {calculatedEfficacyScore.toFixed(1)}/5
      </p>
    </div>
  );
};

export default PopulationChart;
