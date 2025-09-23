import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
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
        <CardTitle>{t('analytics.charts.prescriptionIntelligence')}</CardTitle>
        <CardDescription>
          {t('analytics.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ChartContainer config={{
            scatter: { color: "#9b87f5" }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 40, right: 40, bottom: 60, left: 60 }}
                data={scatterData}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Sustentabilidade"
                  domain={[0, 5]}
                  label={{ 
                    value: 'Sustentabilidade', 
                    position: 'insideBottom', 
                    offset: -20,
                    style: { textAnchor: 'middle', fontSize: '12px' }
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Eficácia"
                  domain={[0, 5]}
                  label={{ 
                    value: 'Eficácia', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px' }
                  }}
                  tick={{ fontSize: 11 }}
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
        
        {/* Dados populados para demonstração */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">{t('analytics.insights.positioning')}</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium">{t('analytics.insights.topPerformers')}:</span>
              <div className="mt-1 space-y-1">
                {scatterData
                  .filter(d => d.x >= 3.5 && d.y >= 3.5)
                  .slice(0, 3)
                  .map(item => (
                    <div key={item.name} className="text-green-600">
                      • {item.name}
                    </div>
                  ))
                }
              </div>
            </div>
            <div>
              <span className="font-medium">{t('analytics.insights.opportunities')}:</span>
              <div className="mt-1 space-y-1">
                {scatterData
                  .filter(d => d.x < 3 || d.y < 3)
                  .slice(0, 3)
                  .map(item => (
                    <div key={item.name} className="text-amber-600">
                      • {item.name}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="p-2 bg-green-50 rounded text-center">
            <div className="text-xs font-medium text-green-700">{t('analytics.insights.highValue')}</div>
            <div className="text-xs text-green-600">Alta Efic. + Alta Sust.</div>
          </div>
          <div className="p-2 bg-blue-50 rounded text-center">
            <div className="text-xs font-medium text-blue-700">{t('analytics.insights.highPerformance')}</div>
            <div className="text-xs text-blue-600">Alta Efic. + Baixa Sust.</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded text-center">
            <div className="text-xs font-medium text-yellow-700">{t('analytics.insights.sustainable')}</div>
            <div className="text-xs text-yellow-600">Baixa Efic. + Alta Sust.</div>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <div className="text-xs font-medium text-red-700">{t('analytics.insights.reevaluate')}</div>
            <div className="text-xs text-red-600">Baixa Efic. + Baixa Sust.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionScatter;