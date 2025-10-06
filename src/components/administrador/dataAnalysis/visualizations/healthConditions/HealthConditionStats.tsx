import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from 'react-i18next';
import SampleGroupBadge from "@/components/administrador/SampleGroupBadge";

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

const HealthConditionStats: React.FC<HealthConditionStatsProps> = ({ stats, isLoading }) => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>{t('visualization.conditions.stats.title')}</CardTitle>
          <SampleGroupBadge />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {t('visualization.conditions.stats.totalEligibleAnimals')}
              </div>
              <div className="text-3xl font-bold">{stats.totalEligibleAnimals?.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {stats.totalEligibleDogs?.toLocaleString()} {t('visualization.conditions.stats.dogs')} • {stats.totalEligibleCats?.toLocaleString()} {t('visualization.conditions.stats.cats')}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {t('visualization.conditions.stats.totalEligibleTreatments')}
              </div>
              <div className="text-3xl font-bold">{stats.totalEligibleTreatments?.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {t('visualization.conditions.stats.basedOn')} {t('sampleGroup.badge', { id: 'J' })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {t('visualization.conditions.stats.totalConditions')}
              </div>
              <div className="text-2xl font-semibold">{stats.totalConditions}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {t('visualization.conditions.stats.highTreatability')}
              </div>
              <div className="text-2xl font-semibold text-green-600">{stats.highTreatability}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                {t('visualization.conditions.stats.highPrevention')}
              </div>
              <div className="text-2xl font-semibold text-blue-600">{stats.highPrevention}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('visualization.conditions.stats.avgTreatability')}
                </span>
                <span className="font-semibold">{stats.averageTreatability.toFixed(1)}/10</span>
              </div>
              <Progress value={stats.averageTreatability * 10} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('visualization.conditions.stats.avgPrevention')}
                </span>
                <span className="font-semibold">{stats.averagePrevention.toFixed(1)}/10</span>
              </div>
              <Progress value={stats.averagePrevention * 10} className="h-2" />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm font-medium mb-3 text-muted-foreground">
              {t('visualization.conditions.stats.newConditions')}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                {t('visualization.conditions.cellularSenescence')}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {t('visualization.conditions.generalMortality')}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                {t('visualization.conditions.oxidativeStress')}
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                {t('visualization.conditions.mitochondrialDysfunction')}
              </span>
            </div>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthConditionStats;
