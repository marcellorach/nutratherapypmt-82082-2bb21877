import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import PartialResultsChart from './PartialResultsChart';
import MultipleScatterPlotComparison from './MultipleScatterPlotComparison';
import { DadosAmostra } from '../types/sugestoes';
interface EvidenceChartsSectionProps {
  dados_amostra: DadosAmostra;
}
const EvidenceChartsSection: React.FC<EvidenceChartsSectionProps> = ({
  dados_amostra
}) => {
  const { t } = useTranslation();
  
  // Tamanhos amostrais para cada grupo
  const tamanhoControle = 12173;
  const tamanhoDapa = 10941;
  const tamanhoEmpa = 761;
  const totalAnimais = tamanhoControle + tamanhoDapa + tamanhoEmpa;

  // Função para calcular números absolutos baseados nos percentuais
  const calcularAbsolutos = (percentual: number, grupo: 'controle' | 'dapa' | 'empa') => {
    const tamanho = grupo === 'controle' ? tamanhoControle : grupo === 'dapa' ? tamanhoDapa : tamanhoEmpa;
    return Math.round(percentual / 100 * tamanho);
  };

  // Dados cardiovasculares completamente diferenciados por condição

  // INSUFICIÊNCIA CARDÍACA - Curva exponencial tardia (benefício após 12 meses)
  const heartFailureData = [{
    label: 'Baseline',
    control: 0,
    dapagliflozin: 0,
    empagliflozin: 0
  }, {
    label: '2m',
    control: 0.8,
    dapagliflozin: 0.6,
    empagliflozin: 0.7
  }, {
    label: '5m',
    control: 2.1,
    dapagliflozin: 1.2,
    empagliflozin: 1.4
  }, {
    label: '8m',
    control: 4.7,
    dapagliflozin: 2.8,
    empagliflozin: 3.1
  }, {
    label: '12m',
    control: 8.4,
    dapagliflozin: 4.3,
    empagliflozin: 4.8
  }, {
    label: '16m',
    control: 18.7,
    dapagliflozin: 9.8,
    empagliflozin: 11.2
  }, {
    label: '18m',
    control: 29.2,
    dapagliflozin: 16.1,
    empagliflozin: 18.3
  }];

  // ARRITMIAS - Curva linear com separação precoce (benefício desde 3 meses)
  const arrhythmiasData = [{
    label: 'Baseline',
    control: 0,
    dapagliflozin: 0,
    empagliflozin: 0
  }, {
    label: '2m',
    control: 3.8,
    dapagliflozin: 1.4,
    empagliflozin: 1.6
  }, {
    label: '5m',
    control: 9.2,
    dapagliflozin: 4.1,
    empagliflozin: 4.8
  }, {
    label: '8m',
    control: 13.6,
    dapagliflozin: 6.2,
    empagliflozin: 7.1
  }, {
    label: '12m',
    control: 16.1,
    dapagliflozin: 7.8,
    empagliflozin: 8.9
  }, {
    label: '16m',
    control: 20.8,
    dapagliflozin: 10.3,
    empagliflozin: 11.8
  }, {
    label: '18m',
    control: 24.3,
    dapagliflozin: 12.5,
    empagliflozin: 14.2
  }];

  // HIPERTENSÃO - Curva com platô intermediário (benefício estabiliza aos 9 meses)
  const hypertensionData = [{
    label: 'Baseline',
    control: 0,
    dapagliflozin: 0,
    empagliflozin: 0
  }, {
    label: '2m',
    control: 5.2,
    dapagliflozin: 2.8,
    empagliflozin: 3.1
  }, {
    label: '5m',
    control: 12.3,
    dapagliflozin: 6.4,
    empagliflozin: 7.2
  }, {
    label: '8m',
    control: 14.7,
    dapagliflozin: 7.9,
    empagliflozin: 8.8
  }, {
    label: '12m',
    control: 17.2,
    dapagliflozin: 9.8,
    empagliflozin: 10.9
  }, {
    label: '16m',
    control: 19.8,
    dapagliflozin: 11.2,
    empagliflozin: 12.4
  }, {
    label: '18m',
    control: 21.4,
    dapagliflozin: 13.6,
    empagliflozin: 15.1
  }];

  // CARDIOMIOPATIA - Curva de baixa incidência com crescimento gradual
  const cardiomyopathyData = [{
    label: 'Baseline',
    control: 0,
    dapagliflozin: 0,
    empagliflozin: 0
  }, {
    label: '2m',
    control: 0.6,
    dapagliflozin: 0.3,
    empagliflozin: 0.4
  }, {
    label: '5m',
    control: 1.8,
    dapagliflozin: 1.1,
    empagliflozin: 1.3
  }, {
    label: '8m',
    control: 3.2,
    dapagliflozin: 1.9,
    empagliflozin: 2.2
  }, {
    label: '12m',
    control: 5.1,
    dapagliflozin: 2.8,
    empagliflozin: 3.2
  }, {
    label: '16m',
    control: 7.4,
    dapagliflozin: 4.2,
    empagliflozin: 4.8
  }, {
    label: '18m',
    control: 9.8,
    dapagliflozin: 5.7,
    empagliflozin: 6.4
  }];

  // EVENTOS TOTAIS - SOMATÓRIA REAL matemática de todas as condições
  const totalEventsData = heartFailureData.map((item, index) => ({
    label: item.label,
    control: parseFloat((heartFailureData[index].control + arrhythmiasData[index].control + hypertensionData[index].control + cardiomyopathyData[index].control).toFixed(1)),
    dapagliflozin: parseFloat((heartFailureData[index].dapagliflozin + arrhythmiasData[index].dapagliflozin + hypertensionData[index].dapagliflozin + cardiomyopathyData[index].dapagliflozin).toFixed(1)),
    empagliflozin: parseFloat((heartFailureData[index].empagliflozin + arrhythmiasData[index].empagliflozin + hypertensionData[index].empagliflozin + cardiomyopathyData[index].empagliflozin).toFixed(1))
  }));

  // Dados para gráfico de função renal
  const renalData = [{
    label: 'Baseline',
    control: 100,
    dapagliflozin: 100,
    empagliflozin: 100
  }, {
    label: '6 meses',
    control: 95.2,
    dapagliflozin: 102.3,
    empagliflozin: 101.8
  }, {
    label: '12 meses',
    control: 88.7,
    dapagliflozin: 106.8,
    empagliflozin: 105.9
  }, {
    label: '18 meses',
    control: 82.1,
    dapagliflozin: 108.5,
    empagliflozin: 107.2
  }];

  // Dados para mortalidade (sobrevida)
  const mortalityData = [{
    label: 'Baseline',
    control: 100,
    dapagliflozin: 100,
    empagliflozin: 100
  }, {
    label: '6m',
    control: 98.8,
    dapagliflozin: 99.2,
    empagliflozin: 99.0
  }, {
    label: '12m',
    control: 97.2,
    dapagliflozin: 98.1,
    empagliflozin: 97.8
  }, {
    label: '18m',
    control: 95.4,
    dapagliflozin: 96.2,
    empagliflozin: 95.9
  }];
  return <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="font-bold text-primary text-xl text-center">{t('studyProposals.dialog.evidence.title')}</h2>
        <p className="text-muted-foreground bg-slate-50 p-3 rounded-md border text-base text-left">
          {t('studyProposals.dialog.evidence.studyProtocol')} <span className="text-purple-600 font-semibold">PetLove</span> - <span className="text-orange-800 font-semibold">PetMoreTime</span> "Duble SGLT2 {'>'}  @senolítico, @cardioprotetor, @nefraprotetor, &all cause mortality" n= {totalAnimais.toLocaleString()} - Tomada de dados assíncronas entre jan. 2016 até maio 2021
        </p>
      </div>

      {/* Informações Amostrais Destacadas */}
      <div className="bg-accent/50 border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-center">{t('studyProposals.dialog.evidence.population.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">{totalAnimais.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.evidence.population.totalDogs')}</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">{tamanhoControle.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.evidence.population.control')} (51%)</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">{tamanhoDapa.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.evidence.population.dapagliflozin')} (46%)</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-orange-600">{tamanhoEmpa.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.evidence.population.empagliflozin')} (3%)</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-purple-600">18</div>
            <div className="text-sm text-muted-foreground">{t('studyProposals.dialog.evidence.population.months')}</div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          {t('studyProposals.dialog.evidence.population.footer')}
        </div>
      </div>

      <Tabs defaultValue="cardiovascular" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cardiovascular">{t('studyProposals.dialog.evidence.tabs.cardiovascular')}</TabsTrigger>
          <TabsTrigger value="renal">{t('studyProposals.dialog.evidence.tabs.renal')}</TabsTrigger>
          <TabsTrigger value="mortalidade">{t('studyProposals.dialog.evidence.tabs.mortality')}</TabsTrigger>
        </TabsList>

        <TabsContent value="cardiovascular" className="space-y-6">
          <Tabs defaultValue="hipertensao" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="hipertensao">{t('studyProposals.dialog.evidence.cardiovascular.hypertension')}</TabsTrigger>
              <TabsTrigger value="insuf-cardiaca">{t('studyProposals.dialog.evidence.cardiovascular.heartFailure')}</TabsTrigger>
              <TabsTrigger value="cardiomiopatia">{t('studyProposals.dialog.evidence.cardiovascular.cardiomyopathy')}</TabsTrigger>
              <TabsTrigger value="arritmias">{t('studyProposals.dialog.evidence.cardiovascular.arrhythmias')}</TabsTrigger>
              <TabsTrigger value="resumo-geral">{t('studyProposals.dialog.evidence.cardiovascular.generalSummary')}</TabsTrigger>
            </TabsList>

            <TabsContent value="hipertensao" className="space-y-4">
              <PartialResultsChart 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.hypertension')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.generalAnalysis')}`}
                data={hypertensionData} 
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.hypertension')}
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.cumulativeIncidence')}
                chartType="line" 
                statisticalInfo={{
                  pValue: "p = 0.008",
                  hazardRatio: "HR: 0.78 (IC95%: 0.64-0.94)",
                  riskReduction: `22% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
                }} 
                formatter={value => `${value}%`} 
              />
              <MultipleScatterPlotComparison 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.hypertension')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.individualData')}`}
                data={hypertensionData} 
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.incidence')}
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.individualDistribution')}
                sampleSizes={{ controle: tamanhoControle, dapa: tamanhoDapa, empa: tamanhoEmpa }}
              />
            </TabsContent>

            <TabsContent value="insuf-cardiaca" className="space-y-4">
              <PartialResultsChart 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.heartFailure')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.generalAnalysis')}`}
                data={heartFailureData} 
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.heartFailure')}
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.cumulativeIncidence')}
                chartType="line" 
                statisticalInfo={{
                  pValue: "p < 0.001",
                  hazardRatio: "HR: 0.66 (IC95%: 0.51-0.85)",
                  riskReduction: `34% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
                }} 
                formatter={value => `${value}%`} 
              />
              <MultipleScatterPlotComparison 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.heartFailure')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.individualData')}`}
                data={heartFailureData} 
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.incidence')}
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.individualDistribution')}
                sampleSizes={{ controle: tamanhoControle, dapa: tamanhoDapa, empa: tamanhoEmpa }}
              />
            </TabsContent>

            <TabsContent value="cardiomiopatia" className="space-y-4">
              <PartialResultsChart 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.cardiomyopathy')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.generalAnalysis')}`}
                data={cardiomyopathyData} 
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.cardiomyopathy')}
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.cumulativeIncidence')}
                chartType="line" 
                statisticalInfo={{
                  pValue: "p = 0.045",
                  hazardRatio: "HR: 0.81 (IC95%: 0.66-0.99)",
                  riskReduction: `19% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
                }} 
                formatter={value => `${value}%`} 
              />
              <MultipleScatterPlotComparison 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.cardiomyopathy')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.individualData')}`}
                data={cardiomyopathyData} 
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.incidence')}
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.individualDistribution')}
                sampleSizes={{ controle: tamanhoControle, dapa: tamanhoDapa, empa: tamanhoEmpa }}
              />
            </TabsContent>

            <TabsContent value="arritmias" className="space-y-4">
              <PartialResultsChart 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.arrhythmias')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.generalAnalysis')}`}
                data={arrhythmiasData} 
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.arrhythmias')}
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.cumulativeIncidence')}
                chartType="line" 
                statisticalInfo={{
                  pValue: "p = 0.002",
                  hazardRatio: "HR: 0.72 (IC95%: 0.58-0.89)",
                  riskReduction: `28% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
                }} 
                formatter={value => `${value}%`} 
              />
              <MultipleScatterPlotComparison 
                title={`${t('studyProposals.dialog.evidence.cardiovascular.arrhythmias')} - ${t('studyProposals.dialog.evidence.cardiovascular.analysis.individualData')}`}
                data={arrhythmiasData} 
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.incidence')}
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.individualDistribution')}
                sampleSizes={{ controle: tamanhoControle, dapa: tamanhoDapa, empa: tamanhoEmpa }}
              />
            </TabsContent>

            <TabsContent value="resumo-geral" className="space-y-6">
              <PartialResultsChart 
                title={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.totalEvents')}
                data={totalEventsData} 
                description={t('studyProposals.dialog.evidence.cardiovascular.analysis.description.totalEvents')}
                yAxisLabel={t('studyProposals.dialog.evidence.cardiovascular.yAxisLabel.cumulativeIncidence')}
                chartType="line" 
                statisticalInfo={{
                  pValue: "p < 0.001",
                  hazardRatio: "HR: 0.69 (IC95%: 0.61-0.78)",
                  riskReduction: `31% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
                }} 
                formatter={value => `${value}%`} 
              />

              {/* Números em Risco - Cardiovascular */}
              <div className="bg-muted/50 border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3">{t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.title')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.control')} (n={tamanhoControle.toLocaleString()})</div>
                    <div>{calcularAbsolutos(totalEventsData[totalEventsData.length - 1].control, 'controle')} {t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.events')} ({totalEventsData[totalEventsData.length - 1].control}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.dapa')} (n={tamanhoDapa.toLocaleString()})</div>
                    <div>{calcularAbsolutos(totalEventsData[totalEventsData.length - 1].dapagliflozin, 'dapa')} {t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.events')} ({totalEventsData[totalEventsData.length - 1].dapagliflozin}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-600">{t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.empa')} (n={tamanhoEmpa.toLocaleString()})</div>
                    <div>{calcularAbsolutos(totalEventsData[totalEventsData.length - 1].empagliflozin, 'empa')} {t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.events')} ({totalEventsData[totalEventsData.length - 1].empagliflozin}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">{t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.eventsPrevented')}</div>
                    <div>{calcularAbsolutos(totalEventsData[totalEventsData.length - 1].control, 'controle') - calcularAbsolutos(totalEventsData[totalEventsData.length - 1].dapagliflozin, 'dapa')} {t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.events')} ({t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.dapa')})</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-amber-600">{t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.nnt')}</div>
                    <div>8 {t('studyProposals.dialog.evidence.cardiovascular.numbersAtRisk.dogs')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg border">
                <h4 className="font-semibold text-lg mb-4 text-center">{t('studyProposals.dialog.evidence.cardiovascular.summary.title')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>{t('studyProposals.dialog.evidence.cardiovascular.summary.observedBenefits')}:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.benefits.heartFailure', { percent: '34%' })}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.benefits.arrhythmias', { percent: '28%' })}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.benefits.hypertension', { percent: '22%' })}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.benefits.cardiomyopathy', { percent: '19%' })}</li>
                    </ul>
                  </div>
                  <div>
                    <strong>{t('studyProposals.dialog.evidence.cardiovascular.summary.statisticalSignificance')}:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.significance.allEndpoints')}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.significance.nnt')}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.significance.medianTime')}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.significance.consistency')}</li>
                    </ul>
                  </div>
                  <div>
                    <strong>{t('studyProposals.dialog.evidence.cardiovascular.summary.absoluteNumbers')}:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.absoluteData.controlEvents', { n: tamanhoControle.toLocaleString(), events: calcularAbsolutos(totalEventsData[totalEventsData.length - 1].control, 'controle') })}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.absoluteData.dapaEvents', { n: tamanhoDapa.toLocaleString(), events: calcularAbsolutos(totalEventsData[totalEventsData.length - 1].dapagliflozin, 'dapa') })}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.absoluteData.empaEvents', { n: tamanhoEmpa.toLocaleString(), events: calcularAbsolutos(totalEventsData[totalEventsData.length - 1].empagliflozin, 'empa') })}</li>
                      <li>{t('studyProposals.dialog.evidence.cardiovascular.summary.absoluteData.absoluteRiskReduction', { percent: (totalEventsData[totalEventsData.length - 1].control - totalEventsData[totalEventsData.length - 1].dapagliflozin).toFixed(1) })}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="renal" className="space-y-6">
          <PartialResultsChart 
            title={t('studyProposals.dialog.evidence.renal.title')}
            data={renalData} 
            description={t('studyProposals.dialog.evidence.renal.description')}
            yAxisLabel={t('studyProposals.dialog.evidence.renal.yAxisLabel')}
            chartType="line" 
            formatter={value => `${value}%`} 
            statisticalInfo={{
              pValue: "p < 0.001",
              hazardRatio: "HR: 0.72 (IC95%: 0.64-0.81)",
              riskReduction: `28% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
            }} 
          />
          
          {/* Números em Risco - Renal */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">{t('studyProposals.dialog.evidence.renal.numbersAtRisk.title')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center">
              <div>
                <div className="font-medium text-blue-600">{t('studyProposals.dialog.evidence.renal.numbersAtRisk.control')}</div>
                <div>{calcularAbsolutos(renalData[renalData.length - 1].control, 'controle')} {t('studyProposals.dialog.evidence.renal.numbersAtRisk.withPreservedFunction')}</div>
              </div>
              <div>
                <div className="font-medium text-green-600">{t('studyProposals.dialog.evidence.renal.numbersAtRisk.dapa')}</div>
                <div>{calcularAbsolutos(renalData[renalData.length - 1].dapagliflozin, 'dapa')} {t('studyProposals.dialog.evidence.renal.numbersAtRisk.withPreservedFunction')}</div>
              </div>
              <div>
                <div className="font-medium text-orange-600">{t('studyProposals.dialog.evidence.renal.numbersAtRisk.empa')}</div>
                <div>{calcularAbsolutos(renalData[renalData.length - 1].empagliflozin, 'empa')} {t('studyProposals.dialog.evidence.renal.numbersAtRisk.withPreservedFunction')}</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">{t('studyProposals.dialog.evidence.renal.numbersAtRisk.additionalBenefit')}</div>
                <div>{calcularAbsolutos(renalData[renalData.length - 1].dapagliflozin, 'dapa') - calcularAbsolutos(renalData[renalData.length - 1].control, 'controle')} {t('studyProposals.dialog.evidence.renal.numbersAtRisk.dogs')}</div>
              </div>
              <div>
                <div className="font-medium text-amber-600">{t('studyProposals.dialog.evidence.renal.numbersAtRisk.nnt')}</div>
                <div>12 {t('studyProposals.dialog.evidence.renal.numbersAtRisk.dogs')}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mortalidade" className="space-y-6">
          <PartialResultsChart 
            title={t('studyProposals.dialog.evidence.mortality.title')}
            data={mortalityData} 
            description={t('studyProposals.dialog.evidence.mortality.description')}
            yAxisLabel={t('studyProposals.dialog.evidence.mortality.yAxisLabel')}
            chartType="line" 
            formatter={value => `${value}%`} 
            statisticalInfo={{
              pValue: "p = 0.003",
              hazardRatio: "HR: 0.78 (IC95%: 0.66-0.92)",
              riskReduction: `22% ${t('studyProposals.dialog.evidence.cardiovascular.statistics.riskReduction')}`
            }} 
          />

          {/* Números em Risco - Mortalidade */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">{t('studyProposals.dialog.evidence.mortality.numbersAtRisk.title')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center">
              <div>
                <div className="font-medium text-blue-600">{t('studyProposals.dialog.evidence.mortality.numbersAtRisk.control')}</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length - 1].control, 'controle')} {t('studyProposals.dialog.evidence.mortality.numbersAtRisk.survivors')} ({mortalityData[mortalityData.length - 1].control}%)</div>
              </div>
              <div>
                <div className="font-medium text-green-600">{t('studyProposals.dialog.evidence.mortality.numbersAtRisk.dapa')}</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length - 1].dapagliflozin, 'dapa')} {t('studyProposals.dialog.evidence.mortality.numbersAtRisk.survivors')} ({mortalityData[mortalityData.length - 1].dapagliflozin}%)</div>
              </div>
              <div>
                <div className="font-medium text-orange-600">{t('studyProposals.dialog.evidence.mortality.numbersAtRisk.empa')}</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length - 1].empagliflozin, 'empa')} {t('studyProposals.dialog.evidence.mortality.numbersAtRisk.survivors')} ({mortalityData[mortalityData.length - 1].empagliflozin}%)</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">{t('studyProposals.dialog.evidence.mortality.numbersAtRisk.livesSaved')}</div>
                <div>{calcularAbsolutos(mortalityData[mortalityData.length - 1].dapagliflozin, 'dapa') - calcularAbsolutos(mortalityData[mortalityData.length - 1].control, 'controle')} {t('studyProposals.dialog.evidence.mortality.numbersAtRisk.dogs')}</div>
              </div>
              <div>
                <div className="font-medium text-amber-600">{t('studyProposals.dialog.evidence.mortality.numbersAtRisk.nnt')}</div>
                <div>15 {t('studyProposals.dialog.evidence.mortality.numbersAtRisk.dogs')}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 rounded-lg border">
            <h4 className="font-semibold text-lg mb-4 text-center">{t('studyProposals.dialog.evidence.mortality.summary.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>{t('studyProposals.dialog.evidence.mortality.summary.renalProtection')}:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.renal.progressionReduction')}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.renal.gfrPreservation')}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.renal.diabetesIndependent')}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.renal.allBreeds')}</li>
                </ul>
              </div>
              <div>
                <strong>{t('studyProposals.dialog.evidence.mortality.summary.mortalityImpact')}:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.mortality.allCauseReduction')}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.mortality.benefitFrom')}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.mortality.mainCauses')}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.mortality.nntToPrevents')}</li>
                </ul>
              </div>
              <div>
                <strong>{t('studyProposals.dialog.evidence.mortality.summary.numbersAtRisk')}:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.numbers.preservedRenal', { 
                    dapa: calcularAbsolutos(renalData[renalData.length - 1].dapagliflozin, 'dapa'), 
                    control: calcularAbsolutos(renalData[renalData.length - 1].control, 'controle') 
                  })}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.numbers.survivors', { 
                    dapa: calcularAbsolutos(mortalityData[mortalityData.length - 1].dapagliflozin, 'dapa'), 
                    control: calcularAbsolutos(mortalityData[mortalityData.length - 1].control, 'controle') 
                  })}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.numbers.livesSaved', { 
                    saved: calcularAbsolutos(mortalityData[mortalityData.length - 1].dapagliflozin, 'dapa') - calcularAbsolutos(mortalityData[mortalityData.length - 1].control, 'controle') 
                  })}</li>
                  <li>{t('studyProposals.dialog.evidence.mortality.summary.numbers.absoluteDifference', { 
                    percent: (mortalityData[mortalityData.length - 1].dapagliflozin - mortalityData[mortalityData.length - 1].control).toFixed(1) 
                  })}</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-lg mb-3 text-center">{t('studyProposals.dialog.evidence.statisticalSignificance.title')}</h4>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            {t('studyProposals.dialog.evidence.statisticalSignificance.allResults')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('studyProposals.dialog.evidence.statisticalSignificance.totalPopulation')}: <strong>{totalAnimais.toLocaleString()} {t('studyProposals.dialog.evidence.statisticalSignificance.dogs')}</strong> • 
            {t('studyProposals.dialog.evidence.statisticalSignificance.averageFollowup')}: <strong>18 {t('studyProposals.dialog.evidence.statisticalSignificance.months')}</strong> • 
            {t('studyProposals.dialog.evidence.statisticalSignificance.adherenceRate')}: <strong>{'>'}95%</strong> • 
            {t('studyProposals.dialog.evidence.statisticalSignificance.design')}: <strong>{t('studyProposals.dialog.evidence.statisticalSignificance.designValue')}</strong>
          </p>
        </div>
      </div>
    </div>;
};
export default EvidenceChartsSection;