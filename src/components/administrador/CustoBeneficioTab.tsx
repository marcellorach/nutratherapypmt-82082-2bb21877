
import React, { useState } from 'react';
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

// Novos componentes ROI
import { MarketOpportunityMatrix } from '@/components/administrador/roi/MarketOpportunityMatrix';
import { PredictiveROIChart } from '@/components/administrador/roi/PredictiveROIChart';
import { BusinessCaseSimulator } from '@/components/administrador/roi/BusinessCaseSimulator';
import { useROIIntelligence } from '@/hooks/roi/useROIIntelligence';

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

// Componente de KPI
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, trend, trendUp, icon, color }) => {
  return (
    <Card className="overflow-hidden border-t-4" style={{ borderTopColor: color }}>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`rounded-full p-3 bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div className={`flex items-center mt-4 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CustoBeneficioTab: React.FC = () => {
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
          <h2 className="text-xl font-bold text-foreground">Inteligência de ROI & Business Case</h2>
          <p className="text-muted-foreground">
            Análise preditiva avançada e simulação de cenários para nutracêuticos veterinários
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <AreaChart className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Análises
          </Button>
        </div>
      </div>
      
      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard 
          title="ROI Total Médio" 
          value={`${roiMetrics.totalROI}%`}
          subtitle="Retorno médio dos nutracêuticos" 
          trend={`${roiMetrics.averageROI > 250 ? '+' : ''}${Math.round((roiMetrics.averageROI - 250) / 2.5)}% vs meta`}
          trendUp={roiMetrics.averageROI > 250}
          icon={<TrendingUp className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />} 
          color="hsl(var(--primary))"
        />
        
        <KPICard 
          title="ROI Preventivo" 
          value={`${roiMetrics.preventiveROI}%`}
          subtitle="Maior retorno em prevenção" 
          trend={`${roiMetrics.preventiveROI - roiMetrics.treatmentROI}% vs tratamento`}
          trendUp={true}
          icon={<Target className="h-6 w-6" style={{ color: "hsl(var(--success))" }} />} 
          color="hsl(var(--success))"
        />
        
        <KPICard 
          title="Índice Sustentabilidade" 
          value={`${roiMetrics.sustainabilityIndex}%`}
          subtitle="Viabilidade a longo prazo" 
          trend="Alta consistência"
          trendUp={true}
          icon={<Gauge className="h-6 w-6" style={{ color: "hsl(var(--secondary))" }} />} 
          color="hsl(var(--secondary))"
        />
        
        <KPICard 
          title="Penetração Mercado" 
          value={`${roiMetrics.marketPenetration}%`}
          subtitle="Oportunidades disponíveis" 
          trend={`${marketOpportunities.length} condições mapeadas`}
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
            Visão Executiva
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Oportunidades
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <AreaChart className="h-4 w-4" />
            Análise Preditiva
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Análise Comparativa ROI */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Análise Comparativa de ROI</CardTitle>
                <CardDescription>Comparação entre abordagens preventivas vs. tratamento reativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-300">Abordagem Preventiva</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">ROI Médio:</span>
                          <span className="font-bold text-green-600">{roiMetrics.preventiveROI}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Custo por Pet/Ano:</span>
                          <span className="font-medium">R$ 1.260</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Redução de Casos:</span>
                          <span className="font-medium">76%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-300">Tratamento Reativo</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">ROI Médio:</span>
                          <span className="font-bold text-orange-600">{roiMetrics.treatmentROI}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Custo por Caso:</span>
                          <span className="font-medium">R$ 3.840</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Taxa de Incidência:</span>
                          <span className="font-medium">18%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-primary">Vantagem Competitiva</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Prevenção oferece ROI {roiMetrics.preventiveROI - roiMetrics.treatmentROI}% superior ao tratamento reativo
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      +{Math.round(((roiMetrics.preventiveROI - roiMetrics.treatmentROI) / roiMetrics.treatmentROI) * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Métricas de Sustentabilidade */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Métricas de Sustentabilidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span>CLV Médio (24m):</span>
                    <span className="font-medium">R$ 4.800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxa de Retenção:</span>
                    <span className="font-medium text-green-600">89%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payback Médio:</span>
                    <span className="font-medium">8.3 meses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Margem de Contribuição:</span>
                    <span className="font-medium">67%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Impacto Clínico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Redução de consultas:</span>
                    <span className="font-medium">43%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Redução de emergências:</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Melhora qualidade de vida:</span>
                    <span className="font-medium text-green-600">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Satisfação dos tutores:</span>
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
            <CardTitle>Metodologia e Parâmetros Técnicos</CardTitle>
            <CardDescription>
              Detalhamento dos modelos e algoritmos utilizados nas análises preditivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Parâmetros de Cálculo</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parâmetro</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Taxa base incidência</TableCell>
                      <TableCell>18.2%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Redução com protocolo</TableCell>
                      <TableCell>76.4%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Custo médio tratamento</TableCell>
                      <TableCell>R$ 3.840</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Custo protocolo preventivo</TableCell>
                      <TableCell>R$ 1.260</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Modelos Utilizados</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">Análise Preditiva</p>
                    <p className="text-xs text-muted-foreground">Ensemble: XGBoost + Random Forest</p>
                    <p className="text-xs text-muted-foreground">Acurácia: 91.2%</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">Análise de Tendências</p>
                    <p className="text-xs text-muted-foreground">LSTM + ARIMA</p>
                    <p className="text-xs text-muted-foreground">R²: 0.87</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">Simulação Monte Carlo</p>
                    <p className="text-xs text-muted-foreground">10,000 iterações</p>
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
