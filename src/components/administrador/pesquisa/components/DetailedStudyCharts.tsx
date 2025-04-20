
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPoint } from '../types/oraBiomedical';

interface DetailedStudyChartsProps {
  isComplete: boolean;
  interventionData?: {
    earlyIntervention: {
      survivalRate: DataPoint[];
      healthyRate: DataPoint[];
      stressResponseRate: DataPoint[];
    };
    midLifeIntervention: {
      survivalRate: DataPoint[];
      healthyRate: DataPoint[];
      stressResponseRate: DataPoint[];
    };
  };
}

const DetailedStudyCharts: React.FC<DetailedStudyChartsProps> = ({ isComplete, interventionData }) => {
  // Dados de exemplo caso não haja dados específicos
  const defaultSurvivalData = [
    { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
    { age: 5, control: 0.98, lowIntervention: 0.99, highIntervention: 1.0 },
    { age: 10, control: 0.85, lowIntervention: 0.92, highIntervention: 0.95 },
    { age: 15, control: 0.65, lowIntervention: 0.80, highIntervention: 0.88 },
    { age: 20, control: 0.40, lowIntervention: 0.60, highIntervention: 0.75 },
    { age: 25, control: 0.20, lowIntervention: 0.35, highIntervention: 0.50 },
    { age: 30, control: 0.05, lowIntervention: 0.15, highIntervention: 0.25 },
    { age: 35, control: 0.0, lowIntervention: 0.02, highIntervention: 0.08 },
  ];

  const defaultHealthyRateData = [
    { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
    { age: 5, control: 0.95, lowIntervention: 0.98, highIntervention: 1.0 },
    { age: 10, control: 0.80, lowIntervention: 0.90, highIntervention: 0.95 },
    { age: 15, control: 0.50, lowIntervention: 0.75, highIntervention: 0.85 },
    { age: 20, control: 0.20, lowIntervention: 0.50, highIntervention: 0.70 },
    { age: 25, control: 0.05, lowIntervention: 0.25, highIntervention: 0.40 },
    { age: 30, control: 0.0, lowIntervention: 0.10, highIntervention: 0.20 },
  ];

  const defaultStressResponseData = [
    { age: 0, control: 1.0, lowIntervention: 1.0, highIntervention: 1.0 },
    { age: 5, control: 0.97, lowIntervention: 0.99, highIntervention: 1.0 },
    { age: 10, control: 0.83, lowIntervention: 0.91, highIntervention: 0.94 },
    { age: 15, control: 0.60, lowIntervention: 0.78, highIntervention: 0.85 },
    { age: 17, control: 0.40, lowIntervention: 0.68, highIntervention: 0.80 }, // Estressor aplicado
    { age: 20, control: 0.20, lowIntervention: 0.45, highIntervention: 0.65 },
    { age: 25, control: 0.05, lowIntervention: 0.25, highIntervention: 0.40 },
    { age: 30, control: 0.0, lowIntervention: 0.08, highIntervention: 0.20 },
  ];

  const earlyData = interventionData?.earlyIntervention || {
    survivalRate: defaultSurvivalData,
    healthyRate: defaultHealthyRateData,
    stressResponseRate: defaultStressResponseData
  };
  
  const midLifeData = interventionData?.midLifeIntervention || {
    survivalRate: defaultSurvivalData.map(d => ({...d, lowIntervention: d.lowIntervention * 0.9, highIntervention: d.highIntervention * 0.85})),
    healthyRate: defaultHealthyRateData.map(d => ({...d, lowIntervention: d.lowIntervention * 0.85, highIntervention: d.highIntervention * 0.8})),
    stressResponseRate: defaultStressResponseData.map(d => ({...d, lowIntervention: d.lowIntervention * 0.8, highIntervention: d.highIntervention * 0.75}))
  };

  const renderGraph = (data: DataPoint[], title: string, subtitle?: string) => (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="age" 
                label={{ value: 'Idade (dias)', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                label={{ value: 'Taxa de Sobrevivência', angle: -90, position: 'insideLeft', offset: -5 }}
                domain={[0, 1]} 
                tickFormatter={(value) => `${Math.round(value * 100)}%`} 
              />
              <Tooltip 
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Line 
                type="monotone" 
                dataKey="control" 
                stroke="#000000" 
                name="Sem Intervenção"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="lowIntervention" 
                stroke="#22c55e" 
                name="Intervenção Baixa"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="highIntervention" 
                stroke="#ef4444" 
                name="Intervenção Alta"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Tabs defaultValue="early" className="w-full">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="early">Intervenção Precoce</TabsTrigger>
        <TabsTrigger value="midlife">Intervenção Meia-Vida</TabsTrigger>
      </TabsList>

      <TabsContent value="early" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderGraph(
            earlyData.survivalRate, 
            "Taxa de Sobrevivência Geral", 
            "Intervenção desde o início da vida adulta"
          )}
          {renderGraph(
            earlyData.healthyRate, 
            "Taxa de Manutenção de Saúde", 
            "Vermes com pelo menos 30% de saúde"
          )}
          {renderGraph(
            earlyData.stressResponseRate, 
            "Resposta ao Estresse", 
            "Estressor aplicado no dia 15"
          )}
        </div>
      </TabsContent>

      <TabsContent value="midlife" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderGraph(
            midLifeData.survivalRate, 
            "Taxa de Sobrevivência Geral", 
            "Intervenção iniciada na meia-vida"
          )}
          {renderGraph(
            midLifeData.healthyRate, 
            "Taxa de Manutenção de Saúde", 
            "Vermes com pelo menos 30% de saúde"
          )}
          {renderGraph(
            midLifeData.stressResponseRate, 
            "Resposta ao Estresse", 
            "Estressor aplicado no dia 15"
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DetailedStudyCharts;
