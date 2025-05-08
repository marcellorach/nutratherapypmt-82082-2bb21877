
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface PackageEfficiencyMetricsProps {
  packageStats: {
    averageEfficacy: number;
    averageEfficacyByCondition: Array<{
      condition: string;
      treatmentEfficacy: number;
      preventionEfficacy: number;
    }>;
    efficacyTrend: Array<{
      month: string;
      treatmentEfficacy: number;
      preventionEfficacy: number;
    }>;
  };
  isLoading: boolean;
}

const PackageEfficiencyMetrics: React.FC<PackageEfficiencyMetricsProps> = ({
  packageStats,
  isLoading
}) => {
  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Eficácia Média de Tratamento
          </h4>
          <p className="text-2xl font-bold">{packageStats.averageEfficacy}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            Média de todos os pacotes de tratamento
          </p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Eficácia Média de Prevenção
          </h4>
          <p className="text-2xl font-bold">78.4%</p>
          <p className="text-xs text-muted-foreground mt-1">
            Média de todos os pacotes preventivos
          </p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Condição Mais Eficiente
          </h4>
          <p className="text-2xl font-bold">Artrite</p>
          <p className="text-xs text-muted-foreground mt-1">
            Eficácia de tratamento: 88.7%
          </p>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-4">Tendência de Eficácia ao Longo do Tempo</h4>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={packageStats.efficacyTrend}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => [`${value}%`, '']}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="treatmentEfficacy" 
              name="Eficácia do Tratamento"
              stroke="#8b5cf6" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="preventionEfficacy" 
              name="Eficácia da Prevenção"
              stroke="#10b981" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PackageEfficiencyMetrics;
