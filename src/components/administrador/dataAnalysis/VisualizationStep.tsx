
import React, { useState } from 'react';
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
  Cell 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

const ageData = [
  { name: '0-1', value: 452 },
  { name: '1-3', value: 785 },
  { name: '3-5', value: 573 },
  { name: '5-8', value: 328 },
  { name: '8+', value: 203 }
];

const speciesData = [
  { name: 'Cachorros', value: 1560 },
  { name: 'Gatos', value: 730 },
  { name: 'Outros', value: 51 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const treatmentData = [
  { month: 'Jan', success: 65, failure: 12 },
  { month: 'Fev', success: 72, failure: 18 },
  { month: 'Mar', success: 78, failure: 14 },
  { month: 'Abr', success: 83, failure: 11 },
  { month: 'Mai', success: 75, failure: 15 },
  { month: 'Jun', success: 84, failure: 10 },
];

const conditionsData = [
  { name: 'Artrite', dogs: 125, cats: 32 },
  { name: 'Diabetes', dogs: 87, cats: 65 },
  { name: 'Obesidade', dogs: 215, cats: 110 },
  { name: 'Alergias', dogs: 178, cats: 58 },
  { name: 'Problemas Dentários', dogs: 156, cats: 142 },
];

const tableData = [
  { id: 1, name: 'Condroitina', efficacy: 87, pets: 324, avgImprovement: '74%', recommendation: 'Alta' },
  { id: 2, name: 'Ômega 3', efficacy: 92, pets: 415, avgImprovement: '82%', recommendation: 'Alta' },
  { id: 3, name: 'Glucosamina', efficacy: 85, pets: 287, avgImprovement: '71%', recommendation: 'Alta' },
  { id: 4, name: 'Probióticos', efficacy: 78, pets: 356, avgImprovement: '68%', recommendation: 'Média' },
  { id: 5, name: 'MSM', efficacy: 76, pets: 201, avgImprovement: '65%', recommendation: 'Média' },
];

const VisualizationStep: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('6m');
  
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
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Idade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer 
                    config={{
                      age: {
                        label: 'Idade',
                        theme: {
                          light: '#8B5CF6',
                          dark: '#8B5CF6',
                        }
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent labelKey="name" nameKey="name" />
                          }
                        />
                        <Bar dataKey="value" fill="var(--color-age)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Espécie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={speciesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {speciesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} pets`, 'Quantidade']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Sucesso de Tratamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer 
                  config={{
                    success: {
                      label: 'Sucesso',
                      theme: {
                        light: '#22C55E',
                        dark: '#22C55E',
                      }
                    },
                    failure: {
                      label: 'Falha',
                      theme: {
                        light: '#EF4444',
                        dark: '#EF4444',
                      }
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={treatmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent labelKey="month" nameKey="dataKey" />
                        }
                      />
                      <Legend />
                      <Line type="monotone" dataKey="success" stroke="var(--color-success)" strokeWidth={2} />
                      <Line type="monotone" dataKey="failure" stroke="var(--color-failure)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
              <div className="h-96">
                <ChartContainer 
                  config={{
                    dogs: {
                      label: 'Cachorros',
                      theme: {
                        light: '#3B82F6',
                        dark: '#3B82F6',
                      }
                    },
                    cats: {
                      label: 'Gatos',
                      theme: {
                        light: '#EC4899',
                        dark: '#EC4899',
                      }
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conditionsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent labelKey="name" nameKey="dataKey" />
                        }
                      />
                      <Legend />
                      <Bar dataKey="dogs" fill="var(--color-dogs)" />
                      <Bar dataKey="cats" fill="var(--color-cats)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
