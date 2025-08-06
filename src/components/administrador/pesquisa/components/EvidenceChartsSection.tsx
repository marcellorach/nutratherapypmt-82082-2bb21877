import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PartialResultsChart from './PartialResultsChart';
import { DadosAmostra } from '../types/sugestoes';

interface EvidenceChartsSectionProps {
  dados_amostra: DadosAmostra;
}

const EvidenceChartsSection: React.FC<EvidenceChartsSectionProps> = ({ dados_amostra }) => {
  // Tamanhos amostrais para cada grupo
  const tamanhoControle = 1247;
  const tamanhoDapa = 1198;
  const totalAnimais = tamanhoControle + tamanhoDapa;

  // Função para calcular números absolutos baseados nos percentuais
  const calcularAbsolutos = (percentual: number, grupo: 'controle' | 'dapa') => {
    const tamanho = grupo === 'controle' ? tamanhoControle : tamanhoDapa;
    return Math.round((percentual / 100) * tamanho);
  };

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
    { label: '18 meses', control: 82.1, treatment: 108.5 }
  ];

  // Dados para mortalidade (sobrevida)
  const mortalityData = [
    { label: 'Baseline', control: 100, treatment: 100 },
    { label: '6m', control: 98.8, treatment: 99.2 },
    { label: '12m', control: 97.2, treatment: 98.1 },
    { label: '18m', control: 95.4, treatment: 96.2 }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-primary">Evidências Científicas do Estudo DECLARE-CANINE</h2>
        <p className="text-muted-foreground text-lg">
          Análise longitudinal de 18 meses em {totalAnimais.toLocaleString()} cães não-diabéticos
        </p>
      </div>

      {/* Informações Amostrais Destacadas */}
      <div className="bg-accent/50 border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-center">População do Estudo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">{totalAnimais.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total de Cães</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">{tamanhoControle.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Grupo Controle (51%)</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">{tamanhoDapa.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Grupo Dapa (49%)</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-purple-600">18</div>
            <div className="text-sm text-muted-foreground">Meses Seguimento</div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          ✓ Randomização equilibrada • ✓ Taxa de acompanhamento {'>'}95% • ✓ Grupos comparáveis no baseline
        </div>
      </div>

      <Tabs defaultValue="cardiovascular" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cardiovascular">Cardiovascular</TabsTrigger>
          <TabsTrigger value="renal">Função Renal</TabsTrigger>
          <TabsTrigger value="mortalidade">Mortalidade</TabsTrigger>
        </TabsList>

        <TabsContent value="cardiovascular" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PartialResultsChart
              title="Insuficiência Cardíaca"
              data={heartFailureData}
              description="Novos casos de insuficiência cardíaca diagnosticada"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              statisticalInfo={{
                pValue: "p < 0.001",
                hazardRatio: "HR: 0.66 (IC95%: 0.51-0.85)",
                riskReduction: "34% redução do risco"
              }}
              formatter={(value) => `${value}%`}
            />

            <PartialResultsChart
              title="Arritmias"
              data={arrhythmiasData}
              description="Episódios de arritmias clinicamente significativas"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              statisticalInfo={{
                pValue: "p = 0.002",
                hazardRatio: "HR: 0.72 (IC95%: 0.58-0.89)",
                riskReduction: "28% redução do risco"
              }}
              formatter={(value) => `${value}%`}
            />

            <PartialResultsChart
              title="Hipertensão"
              data={hypertensionData}
              description="Diagnósticos de hipertensão arterial"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              statisticalInfo={{
                pValue: "p = 0.008",
                hazardRatio: "HR: 0.78 (IC95%: 0.64-0.94)",
                riskReduction: "22% redução do risco"
              }}
              formatter={(value) => `${value}%`}
            />

            <PartialResultsChart
              title="Cardiomiopatia"
              data={cardiomyopathyData}
              description="Casos de cardiomiopatia dilatada e hipertrófica"
              yAxisLabel="Incidência Cumulativa (%)"
              chartType="line"
              statisticalInfo={{
                pValue: "p = 0.045",
                hazardRatio: "HR: 0.81 (IC95%: 0.66-0.99)",
                riskReduction: "19% redução do risco"
              }}
              formatter={(value) => `${value}%`}
            />
          </div>

          <PartialResultsChart
            title="Total de Eventos Cardiovasculares"
            data={totalEventsData}
            description="Somatória de todos os eventos cardiovasculares maiores"
            yAxisLabel="Incidência Cumulativa (%)"
            chartType="line"
            statisticalInfo={{
              pValue: "p < 0.001",
              hazardRatio: "HR: 0.69 (IC95%: 0.61-0.78)",
              riskReduction: "31% redução do risco"
            }}
            formatter={(value) => `${value}%`}
          />

          {/* Números em Risco - Cardiovascular */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Números em Risco (Eventos Cardiovasculares aos 18 meses)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="text-center">
                <div className="font-medium text-blue-600">Controle (n={tamanhoControle.toLocaleString()})</div>
                <div>{calcularAbsolutos(totalEventsData[totalEventsData.length-1].control, 'controle')} eventos ({totalEventsData[totalEventsData.length-1].control}%)</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">Dapa (n={tamanhoDapa.toLocaleString()})</div>
                <div>{calcularAbsolutos(totalEventsData[totalEventsData.length-1].treatment, 'dapa')} eventos ({totalEventsData[totalEventsData.length-1].treatment}%)</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">Eventos Prevenidos</div>
                <div>{calcularAbsolutos(totalEventsData[totalEventsData.length-1].control, 'controle') - calcularAbsolutos(totalEventsData[totalEventsData.length-1].treatment, 'dapa')} eventos</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">NNT</div>
                <div>8 cães</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg border">
            <h4 className="font-semibold text-lg mb-4 text-center">Resumo dos Resultados Cardiovasculares</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Benefícios Observados:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>34% redução em insuficiência cardíaca</li>
                  <li>28% redução em arritmias</li>
                  <li>22% redução em hipertensão</li>
                  <li>19% redução em cardiomiopatia</li>
                </ul>
              </div>
              <div>
                <strong>Significância Estatística:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Todos os endpoints primários: p ≤ 0.045</li>
                  <li>NNT (Number Needed to Treat): 8-12 cães</li>
                  <li>Tempo mediano para benefício: 8-12 meses</li>
                  <li>Consistência entre subgrupos</li>
                </ul>
              </div>
              <div>
                <strong>Números Absolutos:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Controle (n={tamanhoControle.toLocaleString()}): {calcularAbsolutos(totalEventsData[totalEventsData.length-1].control, 'controle')} eventos</li>
                  <li>Dapa (n={tamanhoDapa.toLocaleString()}): {calcularAbsolutos(totalEventsData[totalEventsData.length-1].treatment, 'dapa')} eventos</li>
                  <li>Diferença absoluta: {calcularAbsolutos(totalEventsData[totalEventsData.length-1].control, 'controle') - calcularAbsolutos(totalEventsData[totalEventsData.length-1].treatment, 'dapa')} eventos prevenidos</li>
                  <li>Redução de risco absoluto: {(totalEventsData[totalEventsData.length-1].control - totalEventsData[totalEventsData.length-1].treatment).toFixed(1)}%</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="renal" className="space-y-6">
          <PartialResultsChart
            title="Função Renal"
            data={renalData}
            description="Preservação da função renal (eGFR > 60 ml/min/1.73m²)"
            yAxisLabel="Função Renal Preservada (%)"
            chartType="line"
            formatter={(value) => `${value}%`}
            statisticalInfo={{
              pValue: "p < 0.001",
              hazardRatio: "HR: 0.72 (IC95%: 0.64-0.81)",
              riskReduction: "28% redução do risco"
            }}
          />
          
          {/* Números em Risco - Renal */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Números em Risco (Função Renal aos 18 meses)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-center">
              <div>
                <div className="font-medium text-blue-600">Controle</div>
                <div>{calcularAbsolutos(renalData[renalData.length-1].control, 'controle')} cães com função preservada</div>
              </div>
              <div>
                <div className="font-medium text-green-600">Dapa</div>
                <div>{calcularAbsolutos(renalData[renalData.length-1].treatment, 'dapa')} cães com função preservada</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">Benefício Adicional</div>
                <div>{calcularAbsolutos(renalData[renalData.length-1].treatment, 'dapa') - calcularAbsolutos(renalData[renalData.length-1].control, 'controle')} cães</div>
              </div>
              <div>
                <div className="font-medium text-orange-600">NNT Renal</div>
                <div>12 cães</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mortalidade" className="space-y-6">
          <PartialResultsChart
            title="Mortalidade por Todas as Causas"
            data={mortalityData}
            description="Sobrevida durante o período de seguimento"
            yAxisLabel="Sobrevida (%)"
            chartType="line"
            formatter={(value) => `${value}%`}
            statisticalInfo={{
              pValue: "p = 0.003",
              hazardRatio: "HR: 0.78 (IC95%: 0.66-0.92)",
              riskReduction: "22% redução do risco"
            }}
          />

          {/* Números em Risco - Mortalidade */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Números em Risco (Sobrevida aos 18 meses)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-center">
              <div>
                <div className="font-medium text-blue-600">Controle</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length-1].control, 'controle')} sobreviventes ({mortalityData[mortalityData.length-1].control}%)</div>
              </div>
              <div>
                <div className="font-medium text-green-600">Dapa</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length-1].treatment, 'dapa')} sobreviventes ({mortalityData[mortalityData.length-1].treatment}%)</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">Vidas Salvas</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length-1].treatment, 'dapa') - calcularAbsolutos(mortalityData[mortalityData.length-1].control, 'controle')} cães</div>
              </div>
              <div>
                <div className="font-medium text-orange-600">NNT Mortalidade</div>
                <div>15 cães</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 rounded-lg border">
            <h4 className="font-semibold text-lg mb-4 text-center">Resumo dos Resultados Renais e Mortalidade</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Proteção Renal:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>28% redução na progressão de doença renal</li>
                  <li>Preservação da eGFR ao longo de 18 meses</li>
                  <li>Benefício independente do status diabético</li>
                  <li>Efeito consistente em todas as raças</li>
                </ul>
              </div>
              <div>
                <strong>Impacto na Mortalidade:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>22% redução na mortalidade por todas as causas</li>
                  <li>Benefício observado a partir do 8º mês</li>
                  <li>Principais causas evitadas: cardiorrenais</li>
                  <li>NNT para prevenir 1 morte: 15 cães</li>
                </ul>
              </div>
              <div>
                <strong>Números em Risco:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Função renal preservada: {calcularAbsolutos(renalData[renalData.length-1].treatment, 'dapa')} vs {calcularAbsolutos(renalData[renalData.length-1].control, 'controle')}</li>
                  <li>Sobreviventes aos 18m: {calcularAbsolutos(mortalityData[mortalityData.length-1].treatment, 'dapa')} vs {calcularAbsolutos(mortalityData[mortalityData.length-1].control, 'controle')}</li>
                  <li>Vidas salvas: {calcularAbsolutos(mortalityData[mortalityData.length-1].treatment, 'dapa') - calcularAbsolutos(mortalityData[mortalityData.length-1].control, 'controle')}</li>
                  <li>Diferença absoluta: {(mortalityData[mortalityData.length-1].treatment - mortalityData[mortalityData.length-1].control).toFixed(1)}%</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-lg mb-3 text-center">Significância Estatística Geral</h4>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            Todos os resultados apresentam significância estatística robusta (p ≤ 0.045) com intervalos de confiança de 95%
          </p>
          <p className="text-xs text-muted-foreground">
            População total analisada: <strong>{totalAnimais.toLocaleString()} cães</strong> • 
            Seguimento médio: <strong>18 meses</strong> • 
            Taxa de aderência: <strong>{'>'}95%</strong> • 
            Design: <strong>Randomizado, duplo-cego, controlado por placebo</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvidenceChartsSection;