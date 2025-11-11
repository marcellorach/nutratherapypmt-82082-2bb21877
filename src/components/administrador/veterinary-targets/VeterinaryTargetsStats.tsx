
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, FolderTree, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

interface VeterinaryTargetsStatsProps {
  conditions: any[];
  isLoading: boolean;
}

const VeterinaryTargetsStats: React.FC<VeterinaryTargetsStatsProps> = ({
  conditions,
  isLoading
}) => {
  const { t } = useTranslation();
  const totalConditions = conditions.length;
  
  const categories = [...new Set(conditions.map(c => c.category).filter(Boolean))];
  const totalCategories = categories.length;
  
  const severityLevels = [...new Set(conditions.map(c => c.severity_level).filter(Boolean))];
  const highSeverity = conditions.filter(c => c.severity_level === 'high' || c.severity_level === 'critical').length;
  
  // Calculate average treatability
  const conditionsWithNutra = conditions.filter(c => c.nutraceutical_count > 0);
  const avgTreatability = conditionsWithNutra.length > 0
    ? conditionsWithNutra.reduce((sum, c) => {
        const avgEfficacy = c.avg_efficacy || 0;
        let weight = 1.0;
        if (c.treatment_count > 0) weight = 1.0;
        else if (c.prevention_count > 0) weight = 0.8;
        else if (c.support_count > 0) weight = 0.6;
        return sum + ((avgEfficacy / 5) * 100 * weight);
      }, 0) / conditionsWithNutra.length
    : 0;

  const stats = [
    {
      title: t('admin.veterinaryTargets.stats.totalConditions'),
      value: totalConditions,
      icon: Target,
      description: t('admin.veterinaryTargets.stats.conditionsRegistered')
    },
    {
      title: t('admin.veterinaryTargets.stats.categories'),
      value: totalCategories,
      icon: FolderTree,
      description: t('admin.veterinaryTargets.stats.distinctGroups')
    },
    {
      title: t('admin.veterinaryTargets.stats.highSeverity'),
      value: highSeverity,
      icon: TrendingUp,
      description: t('admin.veterinaryTargets.stats.requireAttention')
    },
    {
      title: t('admin.veterinaryTargets.stats.severityLevels'),
      value: severityLevels.length,
      icon: Activity,
      description: t('admin.veterinaryTargets.stats.classifications')
    },
    {
      title: t('admin.veterinaryTargets.stats.avgTreatability'),
      value: `${avgTreatability.toFixed(1)}%`,
      icon: Target,
      description: t('admin.veterinaryTargets.stats.avgTreatabilityDesc')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
