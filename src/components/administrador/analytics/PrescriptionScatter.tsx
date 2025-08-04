import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PrescriptionData {
  nutraceutical: string;
  efficacy: number;
  sustainability: number;
  conditionsCount: number;
  studiesCount: number;
}

interface PrescriptionScatterProps {
  data: PrescriptionData[];
}

const PrescriptionScatter: React.FC<PrescriptionScatterProps> = ({ data }) => {
  const scatterData = data.map(item => ({
    x: item.sustainability,
    y: item.efficacy,
    z: item.conditionsCount + item.studiesCount, // Tamanho do ponto baseado em evidências
    name: item.nutraceutical,
    conditions: item.conditionsCount,
    studies: item.studiesCount
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Eficácia: {data.y}/5
          </p>
          <p className="text-sm text-muted-foreground">
            Sustentabilidade: {data.x}/5
          </p>
          <p className="text-sm text-muted-foreground">
            Condições: {data.conditions}
          </p>
          <p className="text-sm text-muted-foreground">
            Estudos: {data.studies}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inteligência de Prescrição</CardTitle>
        <CardDescription>
          Matriz Sustentabilidade vs Eficácia (tamanho = evidências científicas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ChartContainer config={{
            scatter: { color: "#9b87f5" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                data={scatterData}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Sustentabilidade"
                  domain={[0, 5]}
                  label={{ value: 'Sustentabilidade', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Eficácia"
                  domain={[0, 5]}
                  label={{ value: 'Eficácia', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter 
                  name="Nutracêuticos" 
                  data={scatterData} 
                  fill="#9b87f5"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="p-2 bg-green-50 rounded text-center">
            <div className="text-xs font-medium text-green-700">Alto Valor</div>
            <div className="text-xs text-green-600">Alta Efic. + Alta Sust.</div>
          </div>
          <div className="p-2 bg-blue-50 rounded text-center">
            <div className="text-xs font-medium text-blue-700">Alta Performance</div>
            <div className="text-xs text-blue-600">Alta Efic. + Baixa Sust.</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded text-center">
            <div className="text-xs font-medium text-yellow-700">Sustentável</div>
            <div className="text-xs text-yellow-600">Baixa Efic. + Alta Sust.</div>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <div className="text-xs font-medium text-red-700">Reavaliar</div>
            <div className="text-xs text-red-600">Baixa Efic. + Baixa Sust.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionScatter;