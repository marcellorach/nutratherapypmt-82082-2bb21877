import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  
  // Filtrar dados baseado nas condições selecionadas
  const filteredData = selectedConditions.length > 0 
    ? data.filter(item => selectedConditions.includes(item.condition))
    : data.slice(0, 10); // Top 10 se nenhuma selecionada
  
  // Encontrar a condição com maior cobertura
  const maxCoverage = filteredData.reduce((max, item) => 
    item.coverage > max.coverage ? item : max, 
    filteredData[0] || { condition: 'N/A', coverage: 0 }
  );

  const handleConditionSelect = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          Matriz de Tratabilidade por Condição
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </CardTitle>
        <CardDescription>
          Distribuição de nutracêuticos por tipo de intervenção e condição de saúde
        </CardDescription>
        
        {/* Seletor de Condições */}
        <div className="space-y-3 mt-4">
          <Select onValueChange={handleConditionSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione condições para análise comparativa" />
            </SelectTrigger>
            <SelectContent>
              {data.map(item => (
                <SelectItem key={item.condition} value={item.condition}>
                  {item.condition} ({item.coverage.toFixed(1)}% cobertura)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Tags das condições selecionadas */}
          {selectedConditions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedConditions.map(condition => (
                <Badge 
                  key={condition} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => handleConditionSelect(condition)}
                >
                  {condition} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
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
                data={filteredData}
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
              {maxCoverage.condition} ({maxCoverage.coverage.toFixed(1)}%)
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">
              Condições Cobertas: {filteredData.length}/{data.length}
              {selectedConditions.length > 0 && (
                <span className="ml-2 text-blue-600">(filtrado)</span>
              )}
            </div>
            <div className="text-lg font-bold">
              {filteredData.filter(d => d.coverage > 0).length} ativas
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatabilityMatrix;