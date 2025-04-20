
import React from 'react';
import { ChartContainer, ChartLegend } from "@/components/ui/chart";
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Bar } from 'recharts';
import { NutraceuticalCondition, Nutraceutical } from "@/types";

interface EfficacyTabProps {
  selectedCondition: NutraceuticalCondition;
  nutraceutical: Nutraceutical;
}

const EfficacyTab: React.FC<EfficacyTabProps> = ({ selectedCondition, nutraceutical }) => {
  const efficacyOverTimeData = [
    { month: 'Mês 1', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.7)).toFixed(1) },
    { month: 'Mês 2', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.85)).toFixed(1) },
    { month: 'Mês 3', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.95)).toFixed(1) },
    { month: 'Mês 4', eficácia: selectedCondition.efficacyScore.toFixed(1) },
    { month: 'Mês 5', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 1.05)).toFixed(1) },
    { month: 'Mês 6', eficácia: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 1.1)).toFixed(1) },
  ];

  const comparativeEfficacyData = [
    { 
      categoria: 'Filhotes', 
      [`${nutraceutical.name}`]: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 0.9)).toFixed(1), 
      'Média outras opções': '2.8' 
    },
    { 
      categoria: 'Adultos', 
      [`${nutraceutical.name}`]: selectedCondition.efficacyScore.toFixed(1), 
      'Média outras opções': '3.2' 
    },
    { 
      categoria: 'Sênior', 
      [`${nutraceutical.name}`]: Math.min(5, Math.max(1, selectedCondition.efficacyScore * 1.1)).toFixed(1), 
      'Média outras opções': '2.9' 
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Eficácia ao Longo do Tempo</h4>
        <p className="text-xs text-gray-500 mb-2">
          Progressão da eficácia de {nutraceutical.name} para {selectedCondition.name}
        </p>
        <div className="h-64 w-full">
          <ChartContainer config={{
            eficácia: { color: "#9b87f5" }
          }}>
            <LineChart
              data={efficacyOverTimeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="eficácia" 
                stroke="#9b87f5" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Comparação por Estágio de Vida</h4>
        <p className="text-xs text-gray-500 mb-2">
          Eficácia comparativa de {nutraceutical.name} vs. média de outros nutracêuticos
        </p>
        <div className="h-64 w-full">
          <ChartContainer config={{
            [nutraceutical.name]: { color: "#9b87f5" },
            'Média outras opções': { color: "#C8C8C9" }
          }}>
            <BarChart
              data={comparativeEfficacyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <ChartLegend />
              <Bar dataKey={nutraceutical.name} fill="#9b87f5" />
              <Bar dataKey="Média outras opções" fill="#C8C8C9" />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

export default EfficacyTab;
