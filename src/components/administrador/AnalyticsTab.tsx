
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import NutraceuticalEfficacy from '@/components/charts/NutraceuticalEfficacy';
import { nutraceuticals } from '@/data';

const AnalyticsTab: React.FC = () => {
  // Dados para o gráfico
  const efficacyData = nutraceuticals.map(item => ({
    name: item.name,
    score: item.scientificEvidence.efficacyScore,
    contraindications: item.contraindications.length
  }));
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Eficácia Comparativa</CardTitle>
          <CardDescription>Análise da eficácia dos nutracêuticos em relação às suas contraindicações</CardDescription>
        </CardHeader>
        <CardContent>
          <NutraceuticalEfficacy data={efficacyData} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Correlação com Doenças</CardTitle>
          <CardDescription>Eficácia dos nutracêuticos em diferentes condições</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Database className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500 text-center ml-4">
              Gráfico de correlação (a implementar)
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Adoção por Raças</CardTitle>
          <CardDescription>Distribuição de prescrições por raças</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Database className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500 text-center ml-4">
              Gráfico de distribuição (a implementar)
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Feedback dos Tutores</CardTitle>
          <CardDescription>Avaliações de eficácia pelos tutores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Database className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500 text-center ml-4">
              Gráfico de avaliações (a implementar)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
