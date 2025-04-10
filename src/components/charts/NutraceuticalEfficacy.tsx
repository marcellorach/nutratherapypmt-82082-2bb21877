
import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface Efficacy {
  name: string;
  score: number;
  contraindications: number;
}

interface NutraceuticalEfficacyProps {
  data: Efficacy[];
}

const NutraceuticalEfficacy: React.FC<NutraceuticalEfficacyProps> = ({ data }) => {
  const chartConfig = {
    efficacy: { color: "#9b87f5" },
    contraindications: { color: "#ff6b6b" },
  };

  return (
    <div className="h-80 w-full">
      <ChartContainer
        config={chartConfig}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70}
            />
            <YAxis />
            <ChartTooltip 
              content={<ChartTooltipContent />} 
            />
            <Bar 
              dataKey="score" 
              name="Eficácia" 
              fill={chartConfig.efficacy.color} 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="contraindications" 
              name="Contraindicações" 
              fill={chartConfig.contraindications.color} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default NutraceuticalEfficacy;
