
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AreaChart, 
  BarChart4, 
  Gauge, 
  LineChart, 
  PiggyBank, 
  RefreshCw, 
  Thermometer,
  TrendingUp,
  Target,
  Calculator
} from "lucide-react";

// Componentes refatorados
import { MarketOpportunityMatrix } from '@/components/administrador/roi/MarketOpportunityMatrix';
import { PredictiveROIChart } from '@/components/administrador/roi/PredictiveROIChart';
import { BusinessCaseSimulator } from '@/components/administrador/roi/BusinessCaseSimulator';
import { useROIIntelligence } from '@/hooks/roi/useROIIntelligence';
import KPICard from '@/components/administrador/roi/modules/KPICard';
import ExecutiveSummary from '@/components/administrador/roi/modules/ExecutiveSummary';

// Componente de exemplo do gráfico de ROI
const ROIChart: React.FC = () => {
  return (
    <div className="w-full h-72 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center flex-col gap-2 p-4">
      <AreaChart className="h-12 w-12 text-gray-400" />
      <p className="text-gray-500 text-center">
        Gráfico de ROI por categoria de tratamento
        <br />
        (Visualização simulada - Será implementado com Recharts)
      </p>
    </div>
  );
};


const CustoBeneficioTab: React.FC = () => {
  const { t } = useTranslation();
  const [periodoAnalise, setPeriodoAnalise] = useState("6");
  const [custoPeriodo, setCustoPeriodo] = useState([3500]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { roiMetrics, marketOpportunities, isLoading } = useROIIntelligence();
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('roi.title')}</h2>
          <p className="text-muted-foreground">
            {t('roi.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <AreaChart className="h-4 w-4" />
            {t('roi.buttons.exportReport')}
          </Button>
          <Button className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('roi.buttons.updateAnalyses')}
          </Button>
        </div>
      </div>
      
      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard 
          title={t('roi.kpis.totalROI.title')} 
          value={`${roiMetrics.totalROI}%`}
          subtitle={t('roi.kpis.totalROI.subtitle')} 
          trend={`${roiMetrics.averageROI > 250 ? '+' : ''}${Math.round((roiMetrics.averageROI - 250) / 2.5)}% ${t('roi.kpis.totalROI.trendVsMeta')}`}
          trendUp={roiMetrics.averageROI > 250}
          icon={<TrendingUp className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />} 
          color="hsl(var(--primary))"
        />
        
        <KPICard 
          title={t('roi.kpis.preventiveROI.title')} 
          value={`${roiMetrics.preventiveROI}%`}
          subtitle={t('roi.kpis.preventiveROI.subtitle')} 
          trend={`${roiMetrics.preventiveROI - roiMetrics.treatmentROI}% ${t('roi.kpis.preventiveROI.trendVsTreatment')}`}
          trendUp={true}
          icon={<Target className="h-6 w-6" style={{ color: "hsl(var(--success))" }} />} 
          color="hsl(var(--success))"
        />
        
        <KPICard 
          title={t('roi.kpis.sustainabilityIndex.title')} 
          value={`${roiMetrics.sustainabilityIndex}%`}
          subtitle={t('roi.kpis.sustainabilityIndex.subtitle')} 
          trend={t('roi.kpis.sustainabilityIndex.trendHigh')}
          trendUp={true}
          icon={<Gauge className="h-6 w-6" style={{ color: "hsl(var(--secondary))" }} />} 
          color="hsl(var(--secondary))"
        />
        
        <KPICard 
          title={t('roi.kpis.marketPenetration.title')} 
          value={`${roiMetrics.marketPenetration}%`}
          subtitle={t('roi.kpis.marketPenetration.subtitle')} 
          trend={`${marketOpportunities.length} ${t('roi.kpis.marketPenetration.conditionsMapped')}`}
          trendUp={true}
          icon={<BarChart4 className="h-6 w-6" style={{ color: "hsl(var(--accent))" }} />} 
          color="hsl(var(--accent))"
        />
      </div>
      
      {/* Painel Principal de Análises */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('roi.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('roi.tabs.opportunities')}
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <AreaChart className="h-4 w-4" />
            {t('roi.tabs.predictive')}
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('roi.tabs.simulator')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ExecutiveSummary roiMetrics={roiMetrics} />
            {/* Métricas de Sustentabilidade */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('roi.sustainability.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span>{t('roi.sustainability.clvAverage')}:</span>
                    <span className="font-medium">R$ 4.800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('roi.sustainability.retentionRate')}:</span>
                    <span className="font-medium text-green-600">89%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('roi.sustainability.avgPayback')}:</span>
                    <span className="font-medium">8.3 {t('roi.sustainability.months')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('roi.sustainability.contributionMargin')}:</span>
                    <span className="font-medium">67%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('roi.clinicalImpact.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span>{t('roi.clinicalImpact.consultationReduction')}:</span>
                    <span className="font-medium">43%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('roi.clinicalImpact.emergencyReduction')}:</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('roi.clinicalImpact.qualityImprovement')}:</span>
                    <span className="font-medium text-green-600">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('roi.clinicalImpact.tutorSatisfaction')}:</span>
                    <span className="font-medium">91%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <MarketOpportunityMatrix 
            onOpportunitySelect={(opportunity) => {
              setSelectedCondition(opportunity.conditionName);
              setActiveTab('predictive');
            }}
          />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveROIChart 
            selectedCondition={selectedCondition}
            timeHorizon={parseInt(periodoAnalise) || 12}
          />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <BusinessCaseSimulator />
        </TabsContent>
      </Tabs>
      {/* Detalhes Avançados */}
      {mostrarDetalhes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('roi.methodology.title')}</CardTitle>
            <CardDescription>
              {t('roi.methodology.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">{t('roi.methodology.parametersTitle')}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('roi.methodology.parameter')}</TableHead>
                      <TableHead>{t('roi.methodology.value')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{t('roi.methodology.baseIncidenceRate')}</TableCell>
                      <TableCell>18.2%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('roi.methodology.protocolReduction')}</TableCell>
                      <TableCell>76.4%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('roi.methodology.avgTreatmentCost')}</TableCell>
                      <TableCell>R$ 3.840</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>{t('roi.methodology.preventiveProtocolCost')}</TableCell>
                      <TableCell>R$ 1.260</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">{t('roi.methodology.modelsTitle')}</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">{t('roi.methodology.predictiveAnalysis')}</p>
                    <p className="text-xs text-muted-foreground">Ensemble: XGBoost + Random Forest</p>
                    <p className="text-xs text-muted-foreground">{t('roi.methodology.accuracy')}: 91.2%</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">{t('roi.methodology.trendAnalysis')}</p>
                    <p className="text-xs text-muted-foreground">LSTM + ARIMA</p>
                    <p className="text-xs text-muted-foreground">R²: 0.87</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">{t('roi.methodology.monteCarloSimulation')}</p>
                    <p className="text-xs text-muted-foreground">10,000 {t('roi.methodology.iterations')}</p>
                    <p className="text-xs text-muted-foreground">IC: 95%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

// Adicionando componente Table temporariamente para exemplo
const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full overflow-auto">
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead>{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    {children}
  </tr>
);

const TableHead = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <td className={`p-4 align-middle ${className}`}>
    {children}
  </td>
);

export default CustoBeneficioTab;
