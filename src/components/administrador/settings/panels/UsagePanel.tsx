
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

interface UsagePanelProps {
  section: 'knowledge-base' | 'data-processing' | 'research' | 'predictive-analysis';
}

const UsagePanel: React.FC<UsagePanelProps> = ({ section }) => {
  const sectionLabel = section === 'knowledge-base' ? 'Base de Conhecimento' : 
                       section === 'data-processing' ? 'Processamento de Dados' :
                       section === 'research' ? 'Pesquisa e Desenvolvimento' :
                       'Análise Preditiva';

  // Dados simulados de uso
  const usageData = {
    tokens: [
      { name: "Jan", tokens: 2500 },
      { name: "Fev", tokens: 3000 },
      { name: "Mar", tokens: 2800 },
      { name: "Abr", tokens: 3200 },
      { name: "Mai", tokens: 4000 },
      { name: "Jun", tokens: 3700 },
    ],
    models: [
      { name: "GPT-4o", value: 45 },
      { name: "GPT-4o Mini", value: 30 },
      { name: "GPT-4 Vision", value: 15 },
      { name: "Outros", value: 10 },
    ]
  };

  const COLORS = ["#6366f1", "#3b82f6", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Uso de API - {sectionLabel}</h3>
        <div className="flex gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumo de Tokens</CardTitle>
            <CardDescription>Uso mensal de tokens por esta seção</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer 
              className="h-80"
              config={{
                tokens: { color: "#6366f1" }
              }}
            >
              <BarChart
                data={usageData.tokens}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} tokens`} />
                <Bar dataKey="tokens" fill="var(--color-tokens, #6366f1)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Modelo</CardTitle>
            <CardDescription>Uso por modelo de IA</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <ChartContainer 
              className="h-80"
              config={{
                default: { color: "#6366f1" }
              }}
            >
              <PieChart>
                <Pie
                  data={usageData.models}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {usageData.models.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" className="flex gap-2">
          <Download className="h-4 w-4" />
          <span>Exportar Relatório</span>
        </Button>
      </div>
    </div>
  );
};

export default UsagePanel;
