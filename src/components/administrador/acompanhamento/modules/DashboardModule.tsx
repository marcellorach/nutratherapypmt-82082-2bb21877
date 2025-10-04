import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SectionHeader, 
  MetricCard, 
  ProgressCard, 
  ListItem,
  GridLayout,
  StackLayout 
} from '@/components/base';
import { useCampaignManager } from '@/hooks/campaigns/useCampaignManager';
import { Activity, CheckCircle, Target, TrendingUp, Clock, Play, Eye, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Presentation Components (Pure UI)
const MetricsGrid = memo<{ metrics: any[] }>(({ metrics }) => (
  <GridLayout columns={4} gap="md">
    {metrics.map((metric, index) => (
      <MetricCard key={index} {...metric} />
    ))}
  </GridLayout>
));

const ActiveExecutionCard = memo<{ 
  execution: any; 
  onStop: () => void;
}>(({ execution, onStop }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-blue-700">
            <Activity className="h-5 w-5" />
            {t('monitoring.dashboard.activeExecution.title')}
          </span>
          <Button size="sm" variant="outline" onClick={onStop}>
            <Pause className="h-4 w-4 mr-2" />
            {t('monitoring.dashboard.activeExecution.pause')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">{t('monitoring.dashboard.activeExecution.progress')}</span>
              <span className="text-sm text-muted-foreground">
                {execution.progress}%
              </span>
            </div>
            <Progress value={execution.progress} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('monitoring.dashboard.activeExecution.currentStep')}:</p>
            <p className="font-medium">{execution.currentStep}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const RecentCampaignsList = memo<{
  campaigns: any[];
  onAction: (action: string, campaignId: string) => void;
  canExecute: (id: string) => boolean;
}>(({ campaigns, onAction, canExecute }) => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('monitoring.dashboard.recentCampaigns')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StackLayout spacing="md">
          {campaigns.map((campaign) => (
            <CampaignListItem
              key={campaign.id}
              campaign={campaign}
              onAction={onAction}
              canExecute={canExecute(campaign.id)}
            />
          ))}
        </StackLayout>
      </CardContent>
    </Card>
  );
});

const CampaignListItem = memo<{
  campaign: any;
  onAction: (action: string, campaignId: string) => void;
  canExecute: boolean;
}>(({ campaign, onAction, canExecute }) => {
  const { t } = useTranslation();
  
  const metricsContent = campaign.metrics && (
    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
      <div>
        <span className="text-muted-foreground">{t('monitoring.campaigns.metrics.processed')}:</span>
        <p className="font-medium">{campaign.metrics.totalProcessed || 0}</p>
      </div>
      <div>
        <span className="text-muted-foreground">{t('monitoring.campaigns.metrics.successRate')}:</span>
        <p className="font-medium">{campaign.metrics.successRate || 0}%</p>
      </div>
      <div>
        <span className="text-muted-foreground">{t('monitoring.campaigns.metrics.savings')}:</span>
        <p className="font-medium">R$ {(campaign.metrics.estimatedSavings || 0).toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );

  const getCampaignTypeLabel = (type: string) => {
    switch(type) {
      case 'mass_update': return t('monitoring.campaigns.types.massUpdate');
      case 'batch_analysis': return t('monitoring.campaigns.types.batchAnalysis');
      default: return t('monitoring.campaigns.types.roiOptimization');
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'running': return t('monitoring.campaigns.status.running');
      case 'completed': return t('monitoring.campaigns.status.completed');
      default: return t('monitoring.campaigns.status.draft');
    }
  };

  return (
  <ListItem
    title={campaign.name}
    subtitle={`${getCampaignTypeLabel(campaign.type)} • ${campaign.createdAt.toLocaleDateString('pt-BR')}`}
    status={
      <Badge variant={
        campaign.status === 'running' ? 'default' :
        campaign.status === 'completed' ? 'secondary' :
        'outline'
      }>
        {getStatusLabel(campaign.status)}
      </Badge>
    }
    actions={
      <div className="flex gap-2">
        {canExecute && (
          <Button 
            size="sm" 
            onClick={() => onAction('execute', campaign.id)}
          >
            <Play className="h-4 w-4 mr-1" />
            {t('monitoring.campaigns.actions.execute')}
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onAction('details', campaign.id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {t('monitoring.campaigns.actions.details')}
        </Button>
      </div>
    }
  >
    {metricsContent}
  </ListItem>
  );
});

// Container Component (Logic + Presentation)
export const DashboardModule = memo(() => {
  const { t } = useTranslation();
  const {
    activeCampaigns,
    completedCampaigns,
    totalMetrics,
    activeExecution,
    getRecentCampaigns,
    canExecuteCampaign,
    executeCampaign,
    stopExecution,
  } = useCampaignManager();

  // Business Logic
  const metrics = React.useMemo(() => [
    {
      title: t('monitoring.dashboard.metrics.activeCampaigns'),
      value: activeCampaigns.length,
      icon: <Activity className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: t('monitoring.dashboard.metrics.completed'),
      value: completedCampaigns.length,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: 'success' as const
    },
    {
      title: t('monitoring.dashboard.metrics.totalProcessed'),
      value: totalMetrics.totalProcessed.toLocaleString('pt-BR'),
      icon: <Target className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: t('monitoring.dashboard.metrics.successRate'),
      value: `${totalMetrics.avgSuccessRate.toFixed(1)}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'success' as const
    }
  ], [activeCampaigns.length, completedCampaigns.length, totalMetrics, t]);

  const recentCampaigns = React.useMemo(() => getRecentCampaigns(), [getRecentCampaigns]);

  const handleCampaignAction = React.useCallback((action: string, campaignId: string) => {
    switch (action) {
      case 'execute':
        executeCampaign(campaignId);
        toast.success(t('monitoring.campaigns.toast.campaignStarted'));
        break;
      case 'details':
        toast.info(t('monitoring.campaigns.toast.loadingDetails'));
        break;
      default:
        toast.info(t('monitoring.campaigns.toast.actionExecuted', { action, campaignId }));
    }
  }, [executeCampaign, t]);

  const handleStopExecution = React.useCallback(() => {
    stopExecution();
    toast.info(t('monitoring.campaigns.toast.executionStopped'));
  }, [stopExecution, t]);

  // Presentation
  return (
    <StackLayout spacing="lg">
      <SectionHeader
        title={t('monitoring.dashboard.title')}
        badge={
          <Badge variant="outline" className="text-sm">
            {t('monitoring.dashboard.activeCampaignsCount', { count: activeCampaigns.length })}
          </Badge>
        }
      />

      <MetricsGrid metrics={metrics} />

      {activeExecution && (
        <ActiveExecutionCard
          execution={activeExecution}
          onStop={handleStopExecution}
        />
      )}

      <RecentCampaignsList
        campaigns={recentCampaigns}
        onAction={handleCampaignAction}
        canExecute={canExecuteCampaign}
      />
    </StackLayout>
  );
});

DashboardModule.displayName = 'DashboardModule';

export default DashboardModule;