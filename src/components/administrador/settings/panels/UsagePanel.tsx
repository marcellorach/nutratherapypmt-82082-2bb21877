
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, PieChart } from "@/components/ui/chart";
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
            <BarChart
              data={usageData.tokens}
              index="name"
              categories={["tokens"]}
              colors={["indigo"]}
              valueFormatter={(value) => `${value.toLocaleString()} tokens`}
              yAxisWidth={60}
              className="h-80"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Modelo</CardTitle>
            <CardDescription>Uso por modelo de IA</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-0">
            <PieChart
              data={usageData.models}
              index="name"
              valueFormatter={(value) => `${value}%`}
              category="value"
              colors={["indigo", "blue", "violet", "cyan"]}
              className="h-80"
            />
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
