import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, Target, Heart, FileText } from 'lucide-react';

interface StatsGridProps {
  nutraceuticals: any[];
  outcomes: any[];
  conditions: any[];
  studies: any[];
  isLoading: boolean;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  nutraceuticals,
  outcomes,
  conditions,
  studies,
  isLoading
}) => {
  // Calcular números reais baseados nos dados
  const nutraceuticalCount = nutraceuticals.length;
  
  // Somar outcomes e estudos simulados dos nutracêuticos
  const outcomesCount = nutraceuticals.reduce((total, nutra) => {
    return total + (nutra.outcomeCount || 0);
  }, 0);
  
  const conditionsCount = conditions.length;
  
  const studiesCount = nutraceuticals.reduce((total, nutra) => {
    return total + (nutra.studyCount || 0);
  }, 0);

  const stats = [
    {
      title: 'Total de Nutracêuticos',
      value: nutraceuticalCount,
      icon: Beaker,
      color: 'text-blue-600'
    },
    {
      title: 'Outcomes',
      value: outcomesCount,
      icon: Target,
      color: 'text-green-600'
    },
    {
      title: 'Condições de Saúde',
      value: conditionsCount,
      icon: Heart,
      color: 'text-purple-600'
    },
    {
      title: 'Estudos Científicos',
      value: studiesCount,
      icon: FileText,
      color: 'text-amber-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsGrid;