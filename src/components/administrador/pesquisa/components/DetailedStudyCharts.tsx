
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface DetailedStudyChartsProps {
  isComplete: boolean;
}

const DetailedStudyCharts: React.FC<DetailedStudyChartsProps> = ({ isComplete }) => {
  // Dados para o gráfico de sobrevivência
  const survivalData = [
    { age: 0, total: 100, stressed: 100, normal: 100 },
    { age: 5, total: 98, stressed: 95, normal: 99 },
    { age: 10, total: 85, stressed: 70, normal: 95 },
    { age: 15, total: 65, stressed: 40, normal: 85 },
    { age: 20, total: 40, stressed: 10, normal: 60 },
    { age: 25, total: 20, stressed: 0, normal: 35 },
    { age: 30, total: 0, stressed: 0, normal: 0 },
  ];

  // Dados para o gráfico de dispersão
  const scatterData = Array.from({ length: 50 }, (_, i) => ({
    age: 10 + Math.random() * 20,
    size: 1000 + Math.random() * 2000,
    type: Math.random() > 0.5 ? 'stressed' : 'normal'
  }));

  return (
    <div className="space-y-6">
      {/* Gráfico de Sobrevivência */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Sobrevivência por Tipo de Morte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={survivalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="age" 
                  label={{ value: 'Idade (dias)', position: 'bottom' }} 
                />
                <YAxis 
                  label={{ value: 'Sobrevivência (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#000000" 
                  name="Morte total"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="stressed" 
                  stroke="#ff0000" 
                  name="Morte estressada"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="normal" 
                  stroke="#0000ff" 
                  name="Morte sem estress"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Dispersão */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Mortes por Idade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="age" 
                  name="Idade" 
                  label={{ value: 'Idade na morte (dias)', position: 'bottom' }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="size" 
                  name="Tamanho" 
                  label={{ value: 'Tamanho na morte (μm²)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  name="Morte estressada" 
                  data={scatterData.filter(d => d.type === 'stressed')} 
                  fill="#ff0000" 
                />
                <Scatter 
                  name="Morte sem estress" 
                  data={scatterData.filter(d => d.type === 'normal')} 
                  fill="#0000ff" 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedStudyCharts;
