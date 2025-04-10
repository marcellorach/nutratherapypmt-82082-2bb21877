
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

interface PopulationChartProps {
  baseEfficacyScore: number;
  condition: string;
  ingredients?: Array<{
    name: string;
    efficacy: number;
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
      setCalculatedEfficacyScore(baseEfficacyScore * 0.5); // Reduz a eficácia pela metade se todos os ingredientes foram removidos
      return;
    }
    
    // Calcular média de eficácia dos ingredientes ativos
    const ingredientEfficacyAvg = activeIngredients.reduce((sum, ing) => sum + ing.efficacy, 0) / activeIngredients.length;
    
    // Eficácia final é uma mistura da eficácia base e a média dos ingredientes
    const finalEfficacy = (baseEfficacyScore * 0.6) + (ingredientEfficacyAvg * 0.4 * 5);
    
    // Limitar entre 1 e 5
    setCalculatedEfficacyScore(Math.min(5, Math.max(1, finalEfficacy)));
  }, [baseEfficacyScore, ingredients]);
  
  // Gerar número aleatório de casos entre 1800 e 42000
  const totalCases = Math.floor(Math.random() * (42000 - 1800 + 1) + 1800);
  
  // Dados simulados para comparação
  const data = [
    {
      name: 'Alta eficácia (>80%)',
      estudos: calculatedEfficacyScore >= 4 ? Math.round((calculatedEfficacyScore * 20)) : Math.round((calculatedEfficacyScore * 15)),
      petlove: Math.min(95, Math.round((calculatedEfficacyScore * 20) * (1 + Math.random() * 0.3))),
    },
    {
      name: 'Média eficácia (60-80%)',
      estudos: calculatedEfficacyScore >= 3 ? Math.round((calculatedEfficacyScore * 15)) : Math.round((calculatedEfficacyScore * 10)),
      petlove: Math.min(85, Math.round((calculatedEfficacyScore * 18) * (1 + Math.random() * 0.2))),
    },
    {
      name: 'Baixa eficácia (<60%)',
      estudos: Math.round((5 - calculatedEfficacyScore) * 10),
      petlove: Math.round((5 - calculatedEfficacyScore) * 8),
    },
  ];

  // Gerar taxas de sucesso estratificadas
  const successRates = {
    alta: Math.min(100, Math.round(70 + calculatedEfficacyScore * 5)),
    media: Math.min(90, Math.round(55 + calculatedEfficacyScore * 5)),
    baixa: Math.min(70, Math.round(40 + calculatedEfficacyScore * 4)),
    tempoMedio: Math.round(25 - calculatedEfficacyScore * 2),
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="text-sm font-medium">{label}</p>
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
            <Legend 
              iconType="square" 
              iconSize={10} 
              formatter={(value) => {
                return value === "estudos" ? "Estudos científicos" : "População tratada PetLove";
              }}
            />
            <Bar dataKey="estudos" name="estudos" fill="#9b87f5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="petlove" name="petlove" fill="#33C3F0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-xs text-gray-500">Taxa de sucesso</p>
          <p className="text-xl font-bold text-green-600">{successRates.alta}%</p>
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <span>Alta eficácia:</span>
              <span className="font-medium">{successRates.alta}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Média eficácia:</span>
              <span className="font-medium">{successRates.media}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Baixa eficácia:</span>
              <span className="font-medium">{successRates.baixa}%</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-xs text-gray-500">Tempo médio até resposta</p>
          <p className="text-xl font-bold">{successRates.tempoMedio} dias</p>
          <div className="progress-bar mt-3 bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full" 
              style={{ width: `${Math.min(100, 100 - successRates.tempoMedio * 2)}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-2">
        Eficácia comparativa para {condition}
      </p>
    </div>
  );
};

export default PopulationChart;
