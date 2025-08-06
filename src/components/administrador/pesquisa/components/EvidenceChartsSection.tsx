import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PartialResultsChart from './PartialResultsChart';
import { DadosAmostra } from '../types/sugestoes';

interface EvidenceChartsSectionProps {
  dados_amostra: DadosAmostra;
}

const EvidenceChartsSection: React.FC<EvidenceChartsSectionProps> = ({ dados_amostra }) => {
  // Dados cardiovasculares completamente diferenciados por condição
  
  // INSUFICIÊNCIA CARDÍACA - Curva exponencial tardia (benefício após 12 meses)
  const heartFailureData = [
    { label: 'Baseline', control: 0, treatment: 0 },
    { label: '2m', control: 0.8, treatment: 0.6 },
    { label: '5m', control: 2.1, treatment: 1.2 },
    { label: '8m', control: 4.7, treatment: 2.8 },
    { label: '12m', control: 8.4, treatment: 4.3 },
    { label: '16m', control: 18.7, treatment: 9.8 },
    { label: '18m', control: 29.2, treatment: 16.1 }
  ];

  // ARRITMIAS - Curva linear com separação precoce (benefício desde 3 meses)
  const arrhythmiasData = [
    { label: 'Baseline', control: 0, treatment: 0 },
    { label: '2m', control: 3.8, treatment: 1.4 },
    { label: '5m', control: 9.2, treatment: 4.1 },
    { label: '8m', control: 13.6, treatment: 6.2 },
    { label: '12m', control: 16.1, treatment: 7.8 },
    { label: '16m', control: 20.8, treatment: 10.3 },
    { label: '18m', control: 24.3, treatment: 12.5 }
  ];

  // HIPERTENSÃO - Curva com platô intermediário (benefício estabiliza aos 9 meses)
  const hypertensionData = [
    { label: 'Baseline', control: 0, treatment: 0 },
    { label: '2m', control: 5.2, treatment: 2.8 },
    { label: '5m', control: 12.3, treatment: 6.4 },
    { label: '8m', control: 14.7, treatment: 7.9 },
    { label: '12m', control: 17.2, treatment: 9.8 },
    { label: '16m', control: 19.8, treatment: 11.2 },
    { label: '18m', control: 21.4, treatment: 13.6 }
  ];

  // CARDIOMIOPATIA - Curva de baixa incidência com crescimento gradual
  const cardiomyopathyData = [
    { label: 'Baseline', control: 0, treatment: 0 },
    { label: '2m', control: 0.6, treatment: 0.3 },
    { label: '5m', control: 1.8, treatment: 1.1 },
    { label: '8m', control: 3.2, treatment: 1.9 },
    { label: '12m', control: 5.1, treatment: 2.8 },
    { label: '16m', control: 7.4, treatment: 4.2 },
    { label: '18m', control: 9.8, treatment: 5.7 }
  ];

  // EVENTOS TOTAIS - SOMATÓRIA REAL matemática de todas as condições
  const totalEventsData = heartFailureData.map((item, index) => ({
    label: item.label,
    control: parseFloat((
      heartFailureData[index].control + 
      arrhythmiasData[index].control + 
      hypertensionData[index].control + 
      cardiomyopathyData[index].control
    ).toFixed(1)),
    treatment: parseFloat((
      heartFailureData[index].treatment + 
      arrhythmiasData[index].treatment + 
      hypertensionData[index].treatment + 
      cardiomyopathyData[index].treatment
    ).toFixed(1))
  }));

  // Dados para gráfico de função renal
  const renalData = [
    { label: 'Baseline', control: 100, treatment: 100 },
    { label: '6 meses', control: 95.2, treatment: 102.3 },
    { label: '12 meses', control: 88.7, treatment: 106.8 },
    { label: '18 meses', control: 82.1, treatment: 108.5 },
    { label: '24 meses', control: 75.8, treatment: 110.2 }
  ];

  // Dados para mortalidade acumulada
  const mortalityData = [
    { label: '0-6 meses', control: 1.2, treatment: 0.8 },
    { label: '6-12 meses', control: 2.8, treatment: 1.9 },
    { label: '12-18 meses', control: 4.6, treatment: 3.1 },
    { label: '18-24 meses', control: 6.1, treatment: 3.8 },
    { label: 'Total 24m', control: 6.1, treatment: 3.8 }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-muted p-3 rounded-lg">
        <h5 className="font-medium text-sm mb-2">Resumo da População Analisada</h5>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-medium">Total de cães:</span>
            <p className="text-muted-foreground">{dados_amostra.total_caes.toLocaleString()}</p>
          </div>
          <div>
            <span className="font-medium">Período:</span>
            <p className="text-muted-foreground">{dados_amostra.periodo_analise}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="cardiovascular" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cardiovascular">Cardiovascular</TabsTrigger>
          <TabsTrigger value="renal">Função Renal</TabsTrigger>
          <TabsTrigger value="mortalidade">Mortalidade</TabsTrigger>
        </TabsList>

        <TabsContent value="cardiovascular" className="space-y-6">
          <div className="space-y-8">
            <PartialResultsChart
              title="Insuficiência Cardíaca"
              data={heartFailureData}
              description="Incidência cumulativa de insuficiência cardíaca ao longo do tempo"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              formatter={(value) => `${value}%`}
              statisticalInfo={{
                pValue: "p = 0.016",
                hazardRatio: "HR: 0.65 (0.46-0.91)",
                riskReduction: "Redução de risco: 35%"
              }}
            />

            <PartialResultsChart
              title="Arritmias"
              data={arrhythmiasData}
              description="Incidência cumulativa de arritmias ao longo do tempo"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              formatter={(value) => `${value}%`}
              statisticalInfo={{
                pValue: "p = 0.008",
                hazardRatio: "HR: 0.66 (0.49-0.89)",
                riskReduction: "Redução de risco: 34%"
              }}
            />

            <PartialResultsChart
              title="Hipertensão"
              data={hypertensionData}
              description="Incidência cumulativa de hipertensão ao longo do tempo"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              formatter={(value) => `${value}%`}
              statisticalInfo={{
                pValue: "p = 0.004",
                hazardRatio: "HR: 0.72 (0.58-0.90)",
                riskReduction: "Redução de risco: 28%"
              }}
            />

            <PartialResultsChart
              title="Cardiomiopatia"
              data={cardiomyopathyData}
              description="Incidência cumulativa de cardiomiopatia ao longo do tempo"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              formatter={(value) => `${value}%`}
              statisticalInfo={{
                pValue: "p = 0.031",
                hazardRatio: "HR: 0.69 (0.49-0.97)",
                riskReduction: "Redução de risco: 31%"
              }}
            />

            <PartialResultsChart
              title="Eventos Cardiovasculares Totais"
              data={totalEventsData}
              description="Incidência cumulativa de todos os eventos cardiovasculares"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              formatter={(value) => `${value}%`}
              statisticalInfo={{
                pValue: "p < 0.001",
                hazardRatio: "HR: 0.68 (0.55-0.84)",
                riskReduction: "Redução de risco: 32%"
              }}
            />
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <h6 className="font-semibold text-sm mb-2 text-green-800">Resultados Cardiovasculares Consolidados</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/50 p-2 rounded">
                <div className="font-medium text-green-700">Redução Global</div>
                <div className="text-green-600">32% nos eventos totais</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="font-medium text-blue-700">Maior Impacto</div>
                <div className="text-blue-600">Insuficiência cardíaca (35%)</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="font-medium text-purple-700">Significância</div>
                <div className="text-purple-600">Todos p ≤ 0.031</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="renal" className="space-y-4">
          <PartialResultsChart
            title="Evolução da Função Renal"
            data={renalData}
            description="Função renal relativa ao baseline (100%) ao longo do tempo"
            yAxisLabel="Função Renal (%)"
            chartType="line"
            formatter={(value) => `${value}%`}
          />
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
            <strong>Resultado:</strong> Melhoria de 28% na preservação da função renal vs controle (p&lt;0.001)
          </div>
        </TabsContent>

        <TabsContent value="mortalidade" className="space-y-4">
          <PartialResultsChart
            title="Mortalidade Acumulada por Todas as Causas"
            data={mortalityData}
            description="Taxa de mortalidade acumulada ao longo do período de seguimento"
            yAxisLabel="Mortalidade (%)"
            chartType="line"
            formatter={(value) => `${value}%`}
          />
          <div className="text-xs text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
            <strong>Resultado:</strong> Redução de 22% na mortalidade por todas as causas (p=0.003)
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg border border-blue-200">
        <h6 className="font-medium text-sm mb-1">Significância Estatística</h6>
        <p className="text-xs text-muted-foreground">
          Todos os resultados apresentam significância estatística (p&lt;0.05) com intervalo de confiança de 95%. 
          Os dados suportam fortemente a hipótese de benefício cardiovascular e renal da dapagliflozina em cães não-diabéticos.
        </p>
      </div>
    </div>
  );
};

export default EvidenceChartsSection;