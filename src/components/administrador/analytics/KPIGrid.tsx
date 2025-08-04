import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, BarChart3, Activity, Shield, Zap } from "lucide-react";

interface KPIGridProps {
  metrics: {
    totalNutraceuticals: number;
    averageEfficacy: number;
    totalConditions: number;
    totalStudies: number;
    treatabilityIndex: number;
    sustainabilityIndex: number;
    prescriptionCoverage: number;
    therapeuticGaps: number;
  };
}

const KPIGrid: React.FC<KPIGridProps> = ({ metrics }) => {
  const kpiCards = [
    {
      title: "Nutracêuticos Ativos",
      value: metrics.totalNutraceuticals,
      icon: BarChart3,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Eficácia Média",
      value: `${metrics.averageEfficacy.toFixed(1)}/5`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: "Índice de Tratabilidade",
      value: `${metrics.treatabilityIndex.toFixed(1)}%`,
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "Cobertura de Prescrição",
      value: `${metrics.prescriptionCoverage.toFixed(1)}%`,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: "Índice de Sustentabilidade",
      value: `${metrics.sustainabilityIndex.toFixed(1)}/5`,
      icon: Shield,
      color: "text-teal-500",
      bgColor: "bg-teal-50"
    },
    {
      title: "Gaps Terapêuticos",
      value: metrics.therapeuticGaps,
      icon: Zap,
      color: "text-red-500",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPIGrid;