
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
              Alta Tratabilidade ({'>'}45%)
            </p>
            <p className="text-xl font-semibold text-green-600">{stats.highTreatability}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Alta Prevenção ({'>'}65%)
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
                className={`bg-green-500 h-2.5 rounded-full ${stats.averageTreatability > 45 ? 'bg-green-500' : stats.averageTreatability > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
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
                className={`h-2.5 rounded-full ${stats.averagePrevention > 65 ? 'bg-purple-500' : stats.averagePrevention > 40 ? 'bg-blue-500' : 'bg-orange-500'}`}
                style={{ width: `${stats.averagePrevention}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm">{stats.averagePrevention}%</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-gray-700">
            Novas condições relacionadas à longevidade:
          </p>
          <ul className="text-sm text-gray-600 list-disc pl-5 mt-2">
            <li>Senescência Celular</li>
            <li>Mortalidade Geral</li>
            <li>Estresse Oxidativo</li>
            <li>Disfunção Mitocondrial</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthConditionStats;
