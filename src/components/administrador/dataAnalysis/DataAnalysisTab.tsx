import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Database, Download } from "lucide-react";
import NutraceuticalEfficacy from '@/components/charts/NutraceuticalEfficacy';

const DataAnalysisTab: React.FC = () => {
  // Dados simulados para demonstração
  const efficacyData = [
    { name: 'Curcumina', score: 4.2, contraindications: 2 },
    { name: 'Resveratrol', score: 3.8, contraindications: 1 },
    { name: 'NMN', score: 4.5, contraindications: 0 },
    { name: 'Coenzima Q10', score: 4.0, contraindications: 3 },
  ];

  const generateRandomData = () => {
    // Função para gerar dados aleatórios para exemplo
    console.log('Gerando dados aleatórios para análise...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Análise de Dados</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateRandomData}>
            <Database className="h-4 w-4 mr-2" />
            Gerar Dados Aleatórios
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Nutracêuticos
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">
                +12 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eficácia Média
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.1/5</div>
              <p className="text-xs text-muted-foreground">
                +0.3 pontos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estudos Científicos
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,243</div>
              <p className="text-xs text-muted-foreground">
                +89 novos estudos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Eficácia */}
        <Card>
          <CardHeader>
            <CardTitle>Eficácia por Nutracêutico</CardTitle>
            <CardDescription>
              Análise comparativa da eficácia dos principais nutracêuticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NutraceuticalEfficacy data={efficacyData} />
          </CardContent>
        </Card>

        {/* Análises Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Condições</CardTitle>
              <CardDescription>
                Nutracêuticos mais utilizados por condição de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Artrite</span>
                  <span className="text-sm font-medium">24 nutracêuticos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cardiopatias</span>
                  <span className="text-sm font-medium">18 nutracêuticos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Diabetes</span>
                  <span className="text-sm font-medium">15 nutracêuticos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendências de Pesquisa</CardTitle>
              <CardDescription>
                Áreas de maior interesse científico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Anti-inflamatórios</span>
                  <span className="text-sm font-medium text-green-600">+23%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Neuroproteção</span>
                  <span className="text-sm font-medium text-green-600">+18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Longevidade</span>
                  <span className="text-sm font-medium text-green-600">+15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisTab;