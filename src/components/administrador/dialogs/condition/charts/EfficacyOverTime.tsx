
import React from 'react';
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { generateEfficacyOverTimeData } from '../utils';
import { NutraceuticalCondition } from "@/types";

interface EfficacyOverTimeProps {
  selectedCondition: NutraceuticalCondition;
}

const EfficacyOverTime: React.FC<EfficacyOverTimeProps> = ({ selectedCondition }) => {
  const efficacyOverTimeData = generateEfficacyOverTimeData(selectedCondition.efficacyScore);

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Eficácia ao Longo do Tempo</h4>
      <p className="text-xs text-gray-500 mb-2">
        Progressão da eficácia para {selectedCondition.name}
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
  );
};

export default EfficacyOverTime;
