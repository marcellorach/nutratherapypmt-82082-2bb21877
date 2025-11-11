
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, FolderTree, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface VeterinaryTargetsStatsProps {
  conditions: any[];
  isLoading: boolean;
}

const VeterinaryTargetsStats: React.FC<VeterinaryTargetsStatsProps> = ({
  conditions,
  isLoading
}) => {
  const totalConditions = conditions.length;
  
  const categories = [...new Set(conditions.map(c => c.category).filter(Boolean))];
  const totalCategories = categories.length;
  
  const severityLevels = [...new Set(conditions.map(c => c.severity_level).filter(Boolean))];
  const highSeverity = conditions.filter(c => c.severity_level === 'high' || c.severity_level === 'critical').length;

  const stats = [
    {
      title: 'Total de Condições',
      value: totalConditions,
      icon: Target,
      description: 'Condições cadastradas'
    },
    {
      title: 'Categorias',
      value: totalCategories,
      icon: FolderTree,
      description: 'Grupos distintos'
    },
    {
      title: 'Alta Severidade',
      value: highSeverity,
      icon: TrendingUp,
      description: 'Requerem atenção'
    },
    {
      title: 'Níveis de Severidade',
      value: severityLevels.length,
      icon: Activity,
      description: 'Classificações'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VeterinaryTargetsStats;
