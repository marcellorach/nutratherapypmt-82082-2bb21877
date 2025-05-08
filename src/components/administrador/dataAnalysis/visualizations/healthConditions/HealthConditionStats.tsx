
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthConditionStatsProps {
  stats: {
    totalConditions: number;
    highTreatability: number;
    highPrevention: number;
    averageTreatability: number;
    averagePrevention: number;
  };
  isLoading: boolean;
}

const HealthConditionStats: React.FC<HealthConditionStatsProps> = ({
  stats,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Total de Condições Analisadas
          </p>
          <p className="text-3xl font-bold">{stats.totalConditions}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Alta Tratabilidade
            </p>
            <p className="text-xl font-semibold text-green-600">{stats.highTreatability}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Alta Prevenção
            </p>
            <p className="text-xl font-semibold text-purple-600">{stats.highPrevention}</p>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Índice Médio de Tratabilidade
          </p>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${stats.averageTreatability}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">{stats.averageTreatability}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Índice Médio de Prevenção
          </p>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-purple-500 h-2.5 rounded-full" 
                style={{ width: `${stats.averagePrevention}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">{stats.averagePrevention}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthConditionStats;
