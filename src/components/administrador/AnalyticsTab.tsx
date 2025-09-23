
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import NutraceuticalEfficacy from '@/components/charts/NutraceuticalEfficacy';
import KPIGrid from './analytics/KPIGrid';
import TreatabilityMatrix from './analytics/TreatabilityMatrix';
import PrescriptionScatter from './analytics/PrescriptionScatter';
import PerformanceTrends from './analytics/PerformanceTrends';
import { useAnalyticsData } from '@/hooks/analytics/useAnalyticsData';
import { nutraceuticals } from '@/data';

const AnalyticsTab: React.FC = () => {
  const { metrics, treatabilityData, prescriptionIntelligence, isLoading } = useAnalyticsData();
  
  // Dados para o gráfico de eficácia (mantendo compatibilidade)
  const efficacyData = nutraceuticals.map(item => ({
    name: item.name,
    score: item.scientificEvidence.efficacyScore,
    contraindications: item.contraindications.length
  }));

  const handleExportReport = () => {
    // Placeholder para exportar relatório
    console.log('Exportando relatório de analytics...');
  };

  const handleRefreshData = () => {
    // Placeholder para atualizar dados
    console.log('Atualizando dados de analytics...');
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse w-64" />
          <div className="h-5 bg-muted rounded animate-pulse w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Inteligente</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Análise detalhada de tratabilidade, performance e inteligência de prescrição do seu ecossistema nutracêutico
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefreshData} size="sm" className="shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportReport} size="sm" className="shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Executivos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Visão Executiva</h2>
          <div className="h-px bg-border flex-1" />
        </div>
        <KPIGrid metrics={metrics} />
      </div>

      {/* Seção Principal de Análises */}
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Análises Detalhadas</h2>
          <div className="h-px bg-border flex-1" />
        </div>
        
        {/* Grid Principal 2x2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Eficácia Comparativa */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                Eficácia Comparativa Global
                <div className="h-2 w-2 bg-green-500 rounded-full" />
              </CardTitle>
              <CardDescription>
                Performance de nutracêuticos vs contraindicações com insights de mercado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <NutraceuticalEfficacy data={efficacyData} />
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <div className="text-sm font-medium text-green-700">Maior Eficácia</div>
                  <div className="text-lg font-bold text-green-800 truncate">
                    {efficacyData.reduce((max, item) => item.score > max.score ? item : max, efficacyData[0])?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-green-600">
                    {efficacyData.reduce((max, item) => item.score > max.score ? item : max, efficacyData[0])?.score.toFixed(1)}/5
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <div className="text-sm font-medium text-blue-700">Menor Risco</div>
                  <div className="text-lg font-bold text-blue-800 truncate">
                    {efficacyData.reduce((min, item) => item.contraindications < min.contraindications ? item : min, efficacyData[0])?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {efficacyData.reduce((min, item) => item.contraindications < min.contraindications ? item : min, efficacyData[0])?.contraindications || 0} contraindicações
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise de Tratabilidade */}
          <TreatabilityMatrix data={treatabilityData} />

          {/* Inteligência de Prescrição */}
          <PrescriptionScatter data={prescriptionIntelligence} />

          {/* Pipeline de Descoberta */}
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                Pipeline de Descoberta
                <div className="h-2 w-2 bg-purple-500 rounded-full" />
              </CardTitle>
              <CardDescription>
                Funil de desenvolvimento e validação de relações terapêuticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Funil de descoberta */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium text-blue-700">Hipóteses em Teste</div>
                        <div className="text-xs text-blue-600">Relações em validação científica</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">12</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium text-amber-700">Em Desenvolvimento</div>
                        <div className="text-xs text-amber-600">Formulações sendo otimizadas</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-amber-600">8</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium text-green-700">Validadas</div>
                        <div className="text-xs text-green-600">Prontas para prescrição</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {prescriptionIntelligence.reduce((sum, item) => sum + item.conditionsCount, 0)}
                    </div>
                  </div>
                </div>

                {/* Métricas de eficiência */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Taxa de Validação</span>
                    <span className="font-semibold text-green-600">78.5%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tempo Médio de Validação</span>
                    <span className="font-semibold">4.2 meses</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Próximas Validações</span>
                    <span className="font-semibold text-blue-600">3 em jan/2025</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Tendências - Full Width */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Performance & Tendências</h2>
          <div className="h-px bg-border flex-1" />
        </div>
        <PerformanceTrends efficacyData={efficacyData} />
      </div>
    </div>
  );
};

export default AnalyticsTab;
