
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthConditionStatsProps {
  stats: {
    totalConditions: number;
    highTreatability: number;
    highPrevention: number;
    averageTreatability: number;
    averagePrevention: number;
    totalEligibleAnimals?: number;
    totalEligibleTreatments?: number;
    totalEligibleDogs?: number;
    totalEligibleCats?: number;
  };
  isLoading: boolean;
}

const HealthConditionStats: React.FC<HealthConditionStatsProps> = ({
  stats,
  isLoading
}) => {
  const { t } = useTranslation();
  
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
        {stats.totalEligibleAnimals && stats.totalEligibleTreatments && (
          <div className="pb-4 border-b">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Total de Animais Elegíveis
            </p>
            <p className="text-3xl font-bold text-primary">
              {stats.totalEligibleAnimals.toLocaleString('pt-BR')}
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-blue-600 font-medium">
                🐕 {stats.totalEligibleDogs?.toLocaleString('pt-BR')} cães
              </span>
              <span className="text-purple-600 font-medium">
                🐈 {stats.totalEligibleCats?.toLocaleString('pt-BR')} gatos
              </span>
            </div>
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900">
                Total de Tratamentos Elegíveis
              </p>
              <p className="text-2xl font-bold text-green-700">
                {stats.totalEligibleTreatments.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-green-600 mt-1">
                ~{(stats.totalEligibleTreatments / stats.totalEligibleAnimals).toFixed(1)}x tratamentos por animal
              </p>
            </div>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t('visualization.conditions.stats.totalConditions')}
          </p>
          <p className="text-3xl font-bold">{stats.totalConditions}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('visualization.conditions.stats.highTreatability')}
            </p>
            <p className="text-xl font-semibold text-green-600">{stats.highTreatability}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('visualization.conditions.stats.highPrevention')}
            </p>
            <p className="text-xl font-semibold text-purple-600">{stats.highPrevention}</p>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {t('visualization.conditions.stats.avgTreatability')}
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
            {t('visualization.conditions.stats.avgPrevention')}
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
            {t('visualization.conditions.stats.newConditions')}
          </p>
          <ul className="text-sm text-gray-600 list-disc pl-5 mt-2">
            <li>{t('visualization.conditions.stats.cellularSenescence')}</li>
            <li>{t('visualization.conditions.stats.generalMortality')}</li>
            <li>{t('visualization.conditions.stats.oxidativeStress')}</li>
            <li>{t('visualization.conditions.stats.mitochondrialDysfunction')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthConditionStats;
