import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Play, Pause, Eye, Activity, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaignManager } from '@/hooks/campaigns/useCampaignManager';

// Memoized campaign item component
const CampaignItem = memo<{
  campaign: any;
  onAction: (action: string, campaignId: string) => void;
  canExecute: boolean;
}>(({ campaign, onAction, canExecute }) => (
  <div className="border rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="font-semibold">{campaign.name}</h3>
        <p className="text-sm text-muted-foreground">
          {campaign.type === 'mass_update' ? 'Atualização em Massa' :
           campaign.type === 'batch_analysis' ? 'Análise em Lote' :
           'Otimização de ROI'} • {campaign.createdAt.toLocaleDateString('pt-BR')}
        </p>
      </div>
      <Badge variant={
        campaign.status === 'running' ? 'default' :
        campaign.status === 'completed' ? 'secondary' :
        'outline'
      }>
        {campaign.status === 'running' ? 'Executando' :
         campaign.status === 'completed' ? 'Concluída' :
         'Rascunho'}
      </Badge>
    </div>
    
    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
      <div>
        <span className="text-muted-foreground">Processados:</span>
        <p className="font-medium">{campaign.metrics?.totalProcessed || 0}</p>
      </div>
      <div>
        <span className="text-muted-foreground">Taxa de Sucesso:</span>
        <p className="font-medium">{campaign.metrics?.successRate || 0}%</p>
      </div>
      <div>
        <span className="text-muted-foreground">Economia:</span>
        <p className="font-medium">R$ {(campaign.metrics?.estimatedSavings || 0).toLocaleString('pt-BR')}</p>
      </div>
    </div>
    
    <div className="flex gap-2">
      {canExecute && (
        <Button 
          size="sm" 
          onClick={() => onAction('execute', campaign.id)}
          className="flex items-center gap-1"
        >
          <Play className="h-4 w-4" />
          Executar
        </Button>
      )}
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => onAction('details', campaign.id)}
        className="flex items-center gap-1"
      >
        <Eye className="h-4 w-4" />
        Detalhes
      </Button>
    </div>
  </div>
));

CampaignItem.displayName = 'CampaignItem';

// Memoized metric card component
const MetricCard = memo<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning';
}>(({ title, value, icon, variant = 'default' }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${
          variant === 'success' ? 'bg-green-100 text-green-600' :
          variant === 'warning' ? 'bg-yellow-100 text-yellow-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

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
    selectCampaign,
  } = useCampaignManager();

  // Memoized values
  const metrics = useMemo(() => [
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

  const recentCampaigns = useMemo(() => getRecentCampaigns(), [getRecentCampaigns]);

  // Memoized handlers
  const handleCampaignAction = useCallback((action: string, campaignId: string) => {
    switch (action) {
      case 'execute':
        executeCampaign(campaignId);
        toast.success('Campanha iniciada com sucesso!');
        break;
      case 'pause':
        stopExecution();
        toast.info('Execução pausada');
        break;
      case 'details':
        // selectCampaign expects a Campaign object, not just ID
        toast.info('Carregando detalhes da campanha...');
        break;
      default:
        toast.info(`Ação ${action} executada`);
    }
  }, [executeCampaign, stopExecution, selectCampaign]);

  const handleStopExecution = useCallback(() => {
    stopExecution();
    toast.info('Execução interrompida');
  }, [stopExecution]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {activeCampaigns.length} campanhas ativas
        </Badge>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Execução Ativa */}
      {activeExecution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execução Ativa
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleStopExecution}
              >
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
                    {activeExecution.progress}%
                  </span>
                </div>
                <Progress value={activeExecution.progress} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Etapa atual:</p>
                <p className="font-medium">{activeExecution.currentStep}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campanhas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Campanhas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <CampaignItem
                key={campaign.id}
                campaign={campaign}
                onAction={handleCampaignAction}
                canExecute={canExecuteCampaign(campaign.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DashboardModule.displayName = 'DashboardModule';