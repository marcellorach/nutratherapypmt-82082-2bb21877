import React, { memo } from 'react';
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
}>(({ execution, onStop }) => (
  <Card className="bg-blue-50 border-blue-200">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-blue-700">
          <Activity className="h-5 w-5" />
          Execução Ativa
        </span>
        <Button size="sm" variant="outline" onClick={onStop}>
          <Pause className="h-4 w-4 mr-2" />
          Pausar
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {execution.progress}%
            </span>
          </div>
          <Progress value={execution.progress} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Etapa atual:</p>
          <p className="font-medium">{execution.currentStep}</p>
        </div>
      </div>
    </CardContent>
  </Card>
));

const RecentCampaignsList = memo<{
  campaigns: any[];
  onAction: (action: string, campaignId: string) => void;
  canExecute: (id: string) => boolean;
}>(({ campaigns, onAction, canExecute }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Campanhas Recentes
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
));

const CampaignListItem = memo<{
  campaign: any;
  onAction: (action: string, campaignId: string) => void;
  canExecute: boolean;
}>(({ campaign, onAction, canExecute }) => {
  const metricsContent = campaign.metrics && (
    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
      <div>
        <span className="text-muted-foreground">Processados:</span>
        <p className="font-medium">{campaign.metrics.totalProcessed || 0}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Taxa de Sucesso:</span>
        <p className="font-medium">{campaign.metrics.successRate || 0}%</p>
      </div>
      <div>
        <span className="text-muted-foreground">Economia:</span>
        <p className="font-medium">R$ {(campaign.metrics.estimatedSavings || 0).toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );

  return (
  <ListItem
    title={campaign.name}
    subtitle={`${
      campaign.type === 'mass_update' ? 'Atualização em Massa' :
      campaign.type === 'batch_analysis' ? 'Análise em Lote' :
      'Otimização de ROI'
    } • ${campaign.createdAt.toLocaleDateString('pt-BR')}`}
    status={
      <Badge variant={
        campaign.status === 'running' ? 'default' :
        campaign.status === 'completed' ? 'secondary' :
        'outline'
      }>
        {campaign.status === 'running' ? 'Executando' :
         campaign.status === 'completed' ? 'Concluída' :
         'Rascunho'}
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
            Executar
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onAction('details', campaign.id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Detalhes
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
      title: 'Campanhas Ativas',
      value: activeCampaigns.length,
      icon: <Activity className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Concluídas',
      value: completedCampaigns.length,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: 'success' as const
    },
    {
      title: 'Total Processado',
      value: totalMetrics.totalProcessed.toLocaleString('pt-BR'),
      icon: <Target className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Taxa de Sucesso',
      value: `${totalMetrics.avgSuccessRate.toFixed(1)}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'success' as const
    }
  ], [activeCampaigns.length, completedCampaigns.length, totalMetrics]);

  const recentCampaigns = React.useMemo(() => getRecentCampaigns(), [getRecentCampaigns]);

  const handleCampaignAction = React.useCallback((action: string, campaignId: string) => {
    switch (action) {
      case 'execute':
        executeCampaign(campaignId);
        toast.success('Campanha iniciada com sucesso!');
        break;
      case 'details':
        toast.info('Carregando detalhes da campanha...');
        break;
      default:
        toast.info(`Ação ${action} executada`);
    }
  }, [executeCampaign]);

  const handleStopExecution = React.useCallback(() => {
    stopExecution();
    toast.info('Execução interrompida');
  }, [stopExecution]);

  // Presentation
  return (
    <StackLayout spacing="lg">
      <SectionHeader
        title="Dashboard"
        badge={
          <Badge variant="outline" className="text-sm">
            {activeCampaigns.length} campanhas ativas
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