import React, { useState, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Sector 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import HealthConditionsSankey from './visualizations/HealthConditionsSankey';
import BreedDistribution from './visualizations/BreedDistribution';
import AgeDistributionChart from './visualizations/AgeDistributionChart';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Dados detalhados de idade, ano a ano
const detailedAgeData = [
  { name: '< 1', value: 328, percent: 12.4 },
  { name: '1', value: 421, percent: 15.9 },
  { name: '2', value: 387, percent: 14.6 },
  { name: '3', value: 352, percent: 13.3 },
  { name: '4', value: 289, percent: 10.9 },
  { name: '5', value: 235, percent: 8.9 },
  { name: '6', value: 187, percent: 7.1 },
  { name: '7', value: 142, percent: 5.4 },
  { name: '8', value: 98, percent: 3.7 },
  { name: '9', value: 76, percent: 2.9 },
  { name: '10', value: 52, percent: 2.0 },
  { name: '11', value: 38, percent: 1.4 },
  { name: '12', value: 26, percent: 1.0 },
  { name: '13', value: 18, percent: 0.7 },
  { name: '14', value: 12, percent: 0.5 },
  { name: '15', value: 9, percent: 0.3 },
  { name: '16', value: 5, percent: 0.2 },
  { name: '17', value: 3, percent: 0.1 },
  { name: '18', value: 1, percent: 0.04 },
  { name: '19+', value: 1, percent: 0.04 }
];

// Dados de espécies e raças
const speciesData = [
  { name: 'Cães', value: 1560, percent: 66.7 },
  { name: 'Gatos', value: 730, percent: 31.2 },
  { name: 'Outros', value: 51, percent: 2.1 }
];

// Dados de raças para cada espécie
const breedData = {
  'Cães': [
    { name: 'SRD', value: 645, percent: 41.3 },
    { name: 'Golden Retriever', value: 187, percent: 12.0 },
    { name: 'Bulldog Francês', value: 156, percent: 10.0 },
    { name: 'Shih Tzu', value: 124, percent: 7.9 },
    { name: 'Poodle', value: 98, percent: 6.3 },
    { name: 'Labrador', value: 93, percent: 6.0 },
    { name: 'Pastor Alemão', value: 78, percent: 5.0 },
    { name: 'Yorkshire', value: 65, percent: 4.2 },
    { name: 'Outras raças', value: 114, percent: 7.3 }
  ],
  'Gatos': [
    { name: 'SRD', value: 543, percent: 74.4 },
    { name: 'Siamês', value: 58, percent: 7.9 },
    { name: 'Persa', value: 43, percent: 5.9 },
    { name: 'Maine Coon', value: 36, percent: 4.9 },
    { name: 'Ragdoll', value: 23, percent: 3.2 },
    { name: 'Bengal', value: 15, percent: 2.1 },
    { name: 'Outras raças', value: 12, percent: 1.6 }
  ],
  'Outros': [
    { name: 'Coelhos', value: 28, percent: 54.9 },
    { name: 'Hamsters', value: 12, percent: 23.5 },
    { name: 'Aves', value: 8, percent: 15.7 },
    { name: 'Outros', value: 3, percent: 5.9 }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
const HOVER_COLORS = ['#4dabff', '#4ad9bf', '#ffca5b', '#ff9f71', '#a6a3e2', '#4a9fe5', '#ffab5e', '#6dbe6d', '#e45a5a', '#b595cf'];

const VisualizationStep: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('6m');
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [showBreedDistribution, setShowBreedDistribution] = useState(false);
  const [isAbsoluteValues, setIsAbsoluteValues] = useState(true);
  
  // Renderização personalizada para setor ativo no gráfico de pizza
  const renderActiveShape = useCallback((props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.8}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={-12} textAnchor={textAnchor} fill="#333" fontSize={12}>
          {payload.name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>
          {`${value} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  }, []);
  
  // Função para lidar com o clique em uma espécie no gráfico de pizza
  const handlePieClick = (data: any) => {
    setSelectedSpecies(data.name);
    setShowBreedDistribution(true);
  };
  
  // Função para retornar à visão de espécies
  const handleBackToSpecies = () => {
    setSelectedSpecies(null);
    setShowBreedDistribution(false);
  };
  
  // Toggle para valores absolutos/percentuais
  const toggleValueType = () => {
    setIsAbsoluteValues(!isAbsoluteValues);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visualização de Dados</h2>
          <p className="text-gray-600">Análise e visualização dos padrões identificados</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Período:</span>
          <Select defaultValue="6m" onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conditions">Condições de Saúde</TabsTrigger>
          <TabsTrigger value="treatments">Tratamentos</TabsTrigger>
          <TabsTrigger value="nutraceuticals">Nutracêuticos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Distribuição por Idade</CardTitle>
              <Button variant="outline" size="sm" onClick={toggleValueType}>
                {isAbsoluteValues ? "Mostrar Percentuais" : "Mostrar Valores Absolutos"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <AgeDistributionChart data={detailedAgeData} isAbsoluteValues={isAbsoluteValues} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {showBreedDistribution 
                  ? `Distribuição de Raças - ${selectedSpecies}` 
                  : "Distribuição por Espécie"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {showBreedDistribution ? (
                  <BreedDistribution 
                    data={selectedSpecies ? breedData[selectedSpecies] : []} 
                    onBackClick={handleBackToSpecies}
                    colors={COLORS}
                    hoverColors={HOVER_COLORS}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={speciesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        activeIndex={0}
                        activeShape={renderActiveShape}
                        onClick={handlePieClick}
                        isAnimationActive={true}
                        animationDuration={800}
                        className="cursor-pointer"
                      >
                        {speciesData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        layout="horizontal"
                        formatter={(value, entry, index) => (
                          <span style={{ color: '#333', cursor: 'pointer' }}>
                            {value} ({speciesData[index].percent}%)
                          </span>
                        )}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          return [`${value} pets (${props.payload.percent}%)`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="mt-4 text-sm text-gray-500 text-center">
                  {showBreedDistribution ? (
                    <p>Clique em uma raça para ver detalhes ou <button 
                      onClick={handleBackToSpecies}
                      className="text-blue-500 underline"
                    >voltar para visão de espécies</button></p>
                  ) : (
                    <p>Clique em uma espécie para ver a distribuição por raças</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Mapeamento de Condições de Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <HealthConditionsSankey height={360} />
              </div>
              <div className="mt-2 text-xs text-center text-gray-500">
                Diagrama de Sankey mostrando a distribuição de condições de saúde por espécie e raça
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conditions">
          <Card>
            <CardHeader>
              <CardTitle>Prevalência de Condições por Espécie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 mb-4">
                Análise detalhada das condições de saúde encontradas, com filtros por espécie e faixa etária.
              </div>
              <div className="h-96">
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-md border border-gray-200">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Carregar Dados Detalhados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle>Tratamentos Prescritos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 mb-4">
                Análise dos tratamentos mais prescritos e sua eficácia ao longo do tempo.
              </div>
              
              <div className="h-80">
                {/* Placeholder para gráficos de tratamentos */}
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-400">Dados de tratamentos em processamento...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nutraceuticals">
          <Card>
            <CardHeader>
              <CardTitle>Eficácia de Nutracêuticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Eficácia (%)</TableHead>
                      <TableHead className="text-right">Qtd. Pets</TableHead>
                      <TableHead className="text-right">Melhora Média</TableHead>
                      <TableHead>Recomendação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.efficacy}%</TableCell>
                        <TableCell className="text-right">{item.pets}</TableCell>
                        <TableCell className="text-right">{item.avgImprovement}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            item.recommendation === 'Alta' 
                              ? 'bg-green-100 text-green-800' 
                              : item.recommendation === 'Média'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.recommendation}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisualizationStep;
