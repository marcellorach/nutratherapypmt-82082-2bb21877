
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface TreatabilityBarChartProps {
  conditions: Array<{
    id: string;
    name: string;
    treatabilityScore: number;
    preventionScore: number;
    roi: number;
  }>;
  isLoading: boolean;
}

const TreatabilityBarChart: React.FC<TreatabilityBarChartProps> = ({ conditions, isLoading }) => {
  const { t } = useTranslation();
  
  // Preparar dados para o gráfico (top 10 condições)
  const chartData = conditions
    .sort((a, b) => b.treatabilityScore - a.treatabilityScore)
    .slice(0, 10)
    .map(condition => ({
      name: condition.name,
      tratabilidade: condition.treatabilityScore,
      prevenção: condition.preventionScore,
      roi: condition.roi
    }));
    
  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }} 
          interval={0}
          tickMargin={10}
          height={60}
          angle={-45}
          textAnchor="end"
        />
        <YAxis domain={[0, 100]} />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'roi') {
              return [`${value}`, 'ROI'];
            }
            return [`${value}%`, name === 'tratabilidade' ? t('visualization.conditions.chart.treatability') : t('visualization.conditions.chart.prevention')];
          }}
          labelFormatter={(label) => `${t('visualization.conditions.chart.condition')}: ${label}`}
        />
        <Legend />
        <Bar 
          name={t('visualization.conditions.chart.treatabilityIndex')}
          dataKey="tratabilidade" 
          fill="#10b981" 
        />
        <Bar 
          name={t('visualization.conditions.chart.preventionIndex')}
          dataKey="prevenção" 
          fill="#8b5cf6" 
        />
        <ReferenceLine y={45} stroke="#10b981" strokeDasharray="3 3" />
        <ReferenceLine y={65} stroke="#8b5cf6" strokeDasharray="3 3" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TreatabilityBarChart;
