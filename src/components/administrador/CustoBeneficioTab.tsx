
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
import { Input } from "@/components/ui/input";
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
  Thermometer 
} from "lucide-react";

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
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Análise de Custo-Benefício</h2>
          <p className="text-gray-600">Avaliação preditiva de retorno sobre investimento em nutracêuticos</p>
        </div>
        
        <Button className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar Previsões
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard 
          title="ROI Médio Esperado" 
          value="312%" 
          subtitle="Para intervenções preventivas" 
          trend="18% maior que trimestre anterior" 
          trendUp={true}
          icon={<PiggyBank className="h-6 w-6" style={{ color: "#10b981" }} />} 
          color="#10b981"
        />
        
        <KPICard 
          title="Economia Projetada" 
          value="R$ 428.500" 
          subtitle="Em 12 meses de programa" 
          trend="Por plano com 1000 pets" 
          trendUp={true}
          icon={<Gauge className="h-6 w-6" style={{ color: "#3b82f6" }} />} 
          color="#3b82f6"
        />
        
        <KPICard 
          title="Redução de Complicações" 
          value="37.8%" 
          subtitle="Em condições crônicas tratadas" 
          trend="12% melhor que cenário base" 
          trendUp={true}
          icon={<Thermometer className="h-6 w-6" style={{ color: "#8b5cf6" }} />} 
          color="#8b5cf6"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projeção de Custo-Benefício</CardTitle>
            <CardDescription>Análise preditiva ROI com base nos modelos treinados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="condicao" className="mb-2 block">Condição clínica</Label>
                <Select defaultValue="osteoartrite">
                  <SelectTrigger id="condicao">
                    <SelectValue placeholder="Selecione uma condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="osteoartrite">Osteoartrite canina</SelectItem>
                    <SelectItem value="dermatite">Dermatite atópica</SelectItem>
                    <SelectItem value="cardio">Cardiomiopatia</SelectItem>
                    <SelectItem value="renal">Doença renal crônica</SelectItem>
                    <SelectItem value="todas">Todas as condições</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="periodo" className="mb-2 block">Período de análise (meses)</Label>
                <Select value={periodoAnalise} onValueChange={setPeriodoAnalise}>
                  <SelectTrigger id="periodo">
                    <SelectValue placeholder="Período de análise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label className="mb-2 block">Custo por período (R$)</Label>
                <div className="pt-4">
                  <Slider
                    value={custoPeriodo}
                    min={1000}
                    max={10000}
                    step={500}
                    onValueChange={setCustoPeriodo}
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>R$ 1.000</span>
                    <span className="font-medium">R$ {custoPeriodo[0].toLocaleString()}</span>
                    <span>R$ 10.000</span>
                  </div>
                </div>
              </div>
            </div>
            
            <ROIChart />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Switch id="detalhes" checked={mostrarDetalhes} onCheckedChange={setMostrarDetalhes} />
                <Label htmlFor="detalhes">Mostrar detalhes avançados</Label>
              </div>
              
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Confiança da previsão: Alta
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparativo de Custos</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Tabs defaultValue="tratamento">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tratamento">Tratamento</TabsTrigger>
                  <TabsTrigger value="prevencao">Prevenção</TabsTrigger>
                </TabsList>
                <TabsContent value="tratamento" className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Custo médio por caso:</span>
                    <span className="font-medium">R$ 3.840</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxa de ocorrência:</span>
                    <span className="font-medium">18%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duração média:</span>
                    <span className="font-medium">17 meses</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="font-medium">Custo projetado por 100 pets:</span>
                    <span className="font-bold">R$ 69.120</span>
                  </div>
                </TabsContent>
                <TabsContent value="prevencao" className="pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Custo do protocolo:</span>
                    <span className="font-medium">R$ 1.260</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Eficácia preventiva:</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duração do protocolo:</span>
                    <span className="font-medium">12 meses</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                    <span className="font-medium">Custo projetado por 100 pets:</span>
                    <span className="font-bold text-green-600">R$ 22.140</span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              <div className="w-full flex justify-between items-center">
                <span className="text-sm font-medium">Economia estimada:</span>
                <span className="text-lg font-bold text-green-600">R$ 46.980</span>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Indicadores Clínicos</CardTitle>
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
                <span>Melhora na qualidade de vida:</span>
                <span className="font-medium">72%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Diminuição do sofrimento:</span>
                <span className="font-medium">85%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {mostrarDetalhes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalhamento da Análise de ROI</CardTitle>
            <CardDescription>Parâmetros utilizados no cálculo do retorno sobre investimento</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parâmetro</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Taxa de incidência base</TableCell>
                  <TableCell>18.2%</TableCell>
                  <TableCell>Média para a condição sem intervenção</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Taxa de incidência com protocolo</TableCell>
                  <TableCell>4.3%</TableCell>
                  <TableCell>Redução de 76.4% com intervenção nutracêutica</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Custo médio de tratamento</TableCell>
                  <TableCell>R$ 3.840</TableCell>
                  <TableCell>Inclui medicação, consultas e procedimentos</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Custo do protocolo preventivo</TableCell>
                  <TableCell>R$ 1.260</TableCell>
                  <TableCell>Por pet durante 12 meses</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Modelo de predição utilizado</TableCell>
                  <TableCell>XGBoost + LSTM</TableCell>
                  <TableCell>Acurácia combinada de 91%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
