import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  const kpiCards = [
    {
      title: t('analytics.kpis.activeNutraceuticals'),
      value: metrics.totalNutraceuticals,
      icon: BarChart3,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: t('analytics.kpis.averageEfficacy'),
      value: `${metrics.averageEfficacy.toFixed(1)}/5`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      title: t('analytics.kpis.treatabilityIndex'),
      value: `${metrics.treatabilityIndex.toFixed(1)}%`,
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      title: t('analytics.kpis.prescriptionCoverage'),
      value: `${metrics.prescriptionCoverage.toFixed(1)}%`,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: t('analytics.kpis.treatabilityIndex'),
      value: `${metrics.sustainabilityIndex.toFixed(1)}/5`,
      icon: Shield,
      color: "text-teal-500",
      bgColor: "bg-teal-50"
    },
    {
      title: t('analytics.kpis.therapeuticGaps'),
      value: metrics.therapeuticGaps,
      icon: Zap,
      color: "text-red-500",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground leading-tight">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${kpi.bgColor} shadow-sm`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
                {index < 2 && (
                  <div className="text-xs text-muted-foreground">
                    {index === 0 ? 'Ativos no sistema' : 'Score médio do portfólio'}
                  </div>
                )}
                {index >= 2 && index < 4 && (
                  <div className="text-xs text-muted-foreground">
                    {index === 2 ? 'Cobertura do mercado' : 'Efetividade operacional'}
                  </div>
                )}
                {index >= 4 && (
                  <div className="text-xs text-muted-foreground">
                    {index === 4 ? 'Score de responsabilidade' : 'Oportunidades de melhoria'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPIGrid;