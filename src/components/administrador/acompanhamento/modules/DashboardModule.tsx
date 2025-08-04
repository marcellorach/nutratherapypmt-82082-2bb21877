import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, TrendingUp, Clock, CheckCircle, Play, Pause, BarChart3 } from "lucide-react";
import { useCampaignManager } from '@/hooks/campaigns/useCampaignManager';

const DashboardModule: React.FC = () => {
  const { 
    campaigns, 
    activeCampaigns, 
    completedCampaigns, 
    totalMetrics,
    activeExecution,
    getRecentCampaigns,
    selectCampaign,
    executeCampaign,
    stopExecution 
  } = useCampaignManager();

  const handleCampaignAction = (action: string, campaignId: string) => {
    switch (action) {
      case 'execute':
        executeCampaign(campaignId);
        break;
      case 'pause':
        stopExecution();
        break;
      case 'details':
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign) selectCampaign(campaign);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Acompanhamento</h2>
          <p className="text-muted-foreground">Monitoramento em tempo real das campanhas</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {activeCampaigns.length} Campanhas Ativas
        </Badge>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campanhas Ativas</p>
                <p className="text-2xl font-bold">{activeCampaigns.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{completedCampaigns.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Processado</p>
                <p className="text-2xl font-bold">{totalMetrics.totalProcessed.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{totalMetrics.avgSuccessRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execução Ativa */}
      {activeExecution && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Play className="h-5 w-5" />
              Execução em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {campaigns.find(c => c.id === activeExecution.campaignId)?.name}
                </span>
                <Badge variant="secondary">{Math.round(activeExecution.progress)}%</Badge>
              </div>
              <Progress value={activeExecution.progress} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{activeExecution.currentStep}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleCampaignAction('pause', activeExecution.campaignId)}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
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
            {getRecentCampaigns().map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
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
                    campaign.status === 'completed' ? 'default' :
                    campaign.status === 'running' ? 'secondary' :
                    campaign.status === 'failed' ? 'destructive' : 'outline'
                  }>
                    {campaign.status === 'completed' ? 'Concluída' :
                     campaign.status === 'running' ? 'Em Execução' :
                     campaign.status === 'failed' ? 'Falha' : 'Rascunho'}
                  </Badge>
                </div>
                
                {campaign.metrics && (
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Processados</p>
                      <p className="font-semibold">{campaign.metrics.totalProcessed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                      <p className="font-semibold">{campaign.metrics.successRate.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Economia</p>
                      <p className="font-semibold text-green-600">
                        R$ {campaign.metrics.estimatedSavings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    {campaign.status === 'completed' && campaign.completedAt && (
                      <span className="text-muted-foreground">
                        Concluída em {campaign.completedAt.toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {campaign.status === 'running' && activeExecution?.campaignId === campaign.id && (
                      <span className="text-blue-600 font-medium">
                        {activeExecution.currentStep}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && !activeExecution && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCampaignAction('execute', campaign.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Executar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleCampaignAction('details', campaign.id)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardModule;