
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
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando dados de analytics...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Inteligente</h2>
          <p className="text-muted-foreground">
            Análise detalhada de tratabilidade, performance e inteligência de prescrição
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Executivos */}
      <KPIGrid metrics={metrics} />

      {/* Dashboard Principal em Grid 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eficácia Comparativa - Melhorada */}
        <Card>
          <CardHeader>
            <CardTitle>Eficácia Comparativa Global</CardTitle>
            <CardDescription>
              Performance de nutracêuticos vs contraindicações com benchmarking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NutraceuticalEfficacy data={efficacyData} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Maior Eficácia</div>
                <div className="text-lg font-bold">
                  {efficacyData.reduce((max, item) => item.score > max.score ? item : max).name}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Menor Risco</div>
                <div className="text-lg font-bold">
                  {efficacyData.reduce((min, item) => item.contraindications < min.contraindications ? item : min).name}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Análise de Tratabilidade */}
        <TreatabilityMatrix data={treatabilityData} />

        {/* Inteligência de Prescrição */}
        <PrescriptionScatter data={prescriptionIntelligence} />

        {/* Performance e Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Volume de Prescrições</CardTitle>
            <CardDescription>
              Evolução temporal e distribuição por categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {prescriptionIntelligence.reduce((sum, item) => sum + item.conditionsCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total de Relações Terapêuticas
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {treatabilityData.reduce((sum, item) => sum + item.prevention, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Prevenção</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {treatabilityData.reduce((sum, item) => sum + item.treatment, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Tratamento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {treatabilityData.reduce((sum, item) => sum + item.support, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Suporte</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Tendências - Full Width */}
      <PerformanceTrends efficacyData={efficacyData} />
    </div>
  );
};

export default AnalyticsTab;
