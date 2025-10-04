import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTranslation } from 'react-i18next';

interface PerformanceTrendsProps {
  efficacyData: Array<{
    name: string;
    score: number;
    contraindications: number;
  }>;
}

const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ efficacyData }) => {
  const { t } = useTranslation();
  
  // Gerar dados temporais simulados baseados na eficácia atual
  const generateTrendData = () => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun'];
    const months = monthKeys.map(key => t(`analytics.trends.months.${key}`));
    const avgEfficacy = efficacyData.reduce((sum, item) => sum + item.score, 0) / efficacyData.length;
    
    return months.map((month, index) => {
      const variance = (Math.random() - 0.5) * 0.5;
      const trend = index * 0.1; // Tendência crescente
      
      return {
        month,
        eficacia: Math.max(1, Math.min(5, avgEfficacy + variance + trend)),
        sustentabilidade: Math.max(1, Math.min(5, avgEfficacy * 0.9 + variance + trend * 0.8)),
        prescricoes: Math.floor(50 + index * 10 + Math.random() * 20),
        satisfacao: Math.max(1, Math.min(5, avgEfficacy * 0.95 + variance + trend * 0.6))
      };
    });
  };

  const trendData = generateTrendData();

  // Dados de benchmark
  const benchmarkData = efficacyData.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    atual: item.score,
    media: 3.2,
    melhorClasse: 4.1
  })).slice(0, 8); // Top 8 para visualização

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.trends.performance.title')}</CardTitle>
        <CardDescription>
          {t('analytics.trends.performance.description')}
        </CardDescription>
      </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ChartContainer config={{
              eficacia: { color: "#3b82f6" },
              sustentabilidade: { color: "#10b981" },
              satisfacao: { color: "#f59e0b" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend 
                    formatter={(value) => {
                      const labels: { [key: string]: string } = {
                        eficacia: t('analytics.trends.metrics.efficacy'),
                        sustentabilidade: t('analytics.trends.metrics.sustainability'),
                        satisfacao: t('analytics.trends.metrics.satisfaction')
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="eficacia" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sustentabilidade" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="satisfacao" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.trends.benchmark.title')}</CardTitle>
          <CardDescription>
            {t('analytics.trends.benchmark.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ChartContainer config={{
              atual: { color: "#9b87f5" },
              media: { color: "#64748b" },
              melhorClasse: { color: "#22c55e" }
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend 
                    formatter={(value) => {
                      const labels: { [key: string]: string } = {
                        melhorClasse: t('analytics.trends.metrics.bestInClass'),
                        media: t('analytics.trends.metrics.average'),
                        atual: t('analytics.trends.metrics.current')
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="melhorClasse"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="media"
                    stackId="2"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="atual" 
                    stroke="#9b87f5" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">{t('analytics.trends.comparison.aboveAverage')}</div>
              <div className="text-lg font-bold">
                {benchmarkData.filter(d => d.atual > d.media).length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-blue-600">{t('analytics.trends.comparison.average')}</div>
              <div className="text-lg font-bold">
                {benchmarkData.filter(d => Math.abs(d.atual - d.media) <= 0.3).length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-red-600">{t('analytics.trends.comparison.belowAverage')}</div>
              <div className="text-lg font-bold">
                {benchmarkData.filter(d => d.atual < d.media - 0.3).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTrends;