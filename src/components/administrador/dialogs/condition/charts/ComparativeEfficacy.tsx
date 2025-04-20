
import React from 'react';
import { ChartContainer, ChartLegend } from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { generateComparativeEfficacyData } from '../utils';
import { NutraceuticalCondition, Nutraceutical } from "@/types";

interface ComparativeEfficacyProps {
  selectedCondition: NutraceuticalCondition;
  nutraceutical: Nutraceutical;
}

const ComparativeEfficacy: React.FC<ComparativeEfficacyProps> = ({ 
  selectedCondition,
  nutraceutical
}) => {
  const comparativeEfficacyData = generateComparativeEfficacyData(selectedCondition.efficacyScore, nutraceutical.name);

  return (
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
  );
};

export default ComparativeEfficacy;
