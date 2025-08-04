import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TreatabilityData {
  condition: string;
  prevention: number;
  treatment: number;
  support: number;
  coverage: number;
}

interface TreatabilityMatrixProps {
  data: TreatabilityData[];
}

const TreatabilityMatrix: React.FC<TreatabilityMatrixProps> = ({ data }) => {
  // Pegar apenas os top 10 para melhor visualização
  const topConditions = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Tratabilidade por Condição</CardTitle>
        <CardDescription>
          Distribuição de nutracêuticos por tipo de intervenção e condição de saúde
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ChartContainer config={{
            prevention: { color: "#10b981" },
            treatment: { color: "#3b82f6" },
            support: { color: "#8b5cf6" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topConditions}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="condition" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'prevention' ? 'Prevenção' :
                    name === 'treatment' ? 'Tratamento' : 'Suporte'
                  ]}
                />
                <Legend 
                  formatter={(value) => 
                    value === 'prevention' ? 'Prevenção' :
                    value === 'treatment' ? 'Tratamento' : 'Suporte'
                  }
                />
                <Bar dataKey="prevention" stackId="a" fill="#10b981" />
                <Bar dataKey="treatment" stackId="a" fill="#3b82f6" />
                <Bar dataKey="support" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Maior Cobertura</div>
            <div className="text-lg font-bold">
              {data[0]?.condition || 'N/A'} ({data[0]?.coverage.toFixed(1)}%)
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Condições Cobertas</div>
            <div className="text-lg font-bold">
              {data.filter(d => d.coverage > 0).length}/{data.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatabilityMatrix;