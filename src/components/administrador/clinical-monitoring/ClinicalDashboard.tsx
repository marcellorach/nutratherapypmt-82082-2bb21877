import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { Activity, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { getClinicalStats, Pet } from '@/utils/mockClinicalData';
import BreedDistributionChart from './BreedDistributionChart';

interface ClinicalDashboardProps {
  pets: Pet[];
}

const ClinicalDashboard: React.FC<ClinicalDashboardProps> = ({ pets }) => {
  const { t } = useTranslation();
  const stats = getClinicalStats(pets);

  return (
    <div className="space-y-6">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('clinicalMonitoring.metrics.totalPets')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('clinicalMonitoring.metrics.activeMonitoring')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('clinicalMonitoring.metrics.averageFollowup')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgFollowup} {t('clinicalMonitoring.metrics.months')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('clinicalMonitoring.metrics.longitudinalData')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('clinicalMonitoring.metrics.adherenceRate')}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAdherence}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('clinicalMonitoring.metrics.protocolCompliance')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('clinicalMonitoring.metrics.responseRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(parseFloat(stats.significant.percentage) + parseFloat(stats.mild.percentage)).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('clinicalMonitoring.metrics.positiveOutcomes')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Response Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalMonitoring.metrics.treatmentStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">{t('clinicalMonitoring.status.significant')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.significant.count.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">({stats.significant.percentage}%)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm">{t('clinicalMonitoring.status.mild')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.mild.count.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">({stats.mild.percentage}%)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">{t('clinicalMonitoring.status.none')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.none.count.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">({stats.none.percentage}%)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm">{t('clinicalMonitoring.status.insufficient')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{stats.insufficient.count.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">({stats.insufficient.percentage}%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breed Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalMonitoring.breedDistribution.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BreedDistributionChart pets={pets} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicalDashboard;
