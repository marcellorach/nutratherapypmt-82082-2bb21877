
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface PackageEfficiencyMetricsProps {
  packageStats: {
    averageEfficacy: number;
    averageEfficacyByCondition: Array<{
      condition: string;
      treatmentEfficacy: number;
      preventionEfficacy: number;
    }>;
    efficacyTrend: Array<{
      month: string;
      treatmentEfficacy: number;
      preventionEfficacy: number;
    }>;
  };
  isLoading: boolean;
}

const PackageEfficiencyMetrics: React.FC<PackageEfficiencyMetricsProps> = ({
  packageStats,
  isLoading
}) => {
  const { t } = useTranslation();
  
  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            {t('visualization.treatments.efficiency.avgTreatment')}
          </h4>
          <p className="text-2xl font-bold">{packageStats.averageEfficacy}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('visualization.treatments.efficiency.avgTreatmentDesc')}
          </p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            {t('visualization.treatments.efficiency.avgPrevention')}
          </h4>
          <p className="text-2xl font-bold">78.4%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('visualization.treatments.efficiency.avgPreventionDesc')}
          </p>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            {t('visualization.treatments.efficiency.mostEfficient')}
          </h4>
          <p className="text-2xl font-bold">Artrite</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('visualization.treatments.efficiency.treatmentEfficacy')} 88.7%
          </p>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-4">{t('visualization.treatments.efficiency.efficacyTrend')}</h4>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={packageStats.efficacyTrend}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => [`${value}%`, '']}
              labelFormatter={(label) => `${t('visualization.treatments.efficiency.month')} ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="treatmentEfficacy" 
              name={t('visualization.treatments.efficiency.treatmentEfficacyLabel')}
              stroke="#8b5cf6" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="preventionEfficacy" 
              name={t('visualization.treatments.efficiency.preventionEfficacyLabel')}
              stroke="#10b981" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PackageEfficiencyMetrics;
