import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  Pause,
  Play,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";

// Módulos refatorados
import { DashboardModule } from './modules/DashboardModule';
import { CampaignProvider } from '@/contexts/CampaignContext';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'ativa' | 'pausada' | 'finalizada' | 'agendada';
  startDate: string;
  endDate?: string;
  targetAudience: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  roi: number;
  investment: number;
  revenue: number;
}

const AcompanhamentoTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedModule, setSelectedModule] = useState<'dashboard' | 'campanhas' | 'analytics' | 'relatorios'>('dashboard');

  // Mock data para demonstração
  const campaigns = useMemo<Campaign[]>(() => [
    {
      id: '1',
      name: 'Protocolo Cardíaco Premium',
      type: 'Oportunidades',
      status: 'ativa',
      startDate: '2024-01-15',
      targetAudience: 450,
      sent: 380,
      opened: 190,
      clicked: 76,
      converted: 23,
      roi: 340,
      investment: 2500,
      revenue: 8500
    },
    {
      id: '2',
      name: 'Educação Nutracêuticos',
      type: 'Educativa',
      status: 'ativa',
      startDate: '2024-01-20',
      targetAudience: 1200,
      sent: 1200,
      opened: 720,
      clicked: 180,
      converted: 45,
      roi: 280,
      investment: 1800,
      revenue: 5040
    },
    {
      id: '3',
      name: 'Retenção Clientes Alto Valor',
      type: 'Retenção',
      status: 'pausada',
      startDate: '2024-01-10',
      endDate: '2024-01-25',
      targetAudience: 85,
      sent: 85,
      opened: 68,
      clicked: 34,
      converted: 12,
      roi: 420,
      investment: 850,
      revenue: 3570
    }
  ], []);

  const activeCampaigns = campaigns.filter(c => c.status === 'ativa');
  const totalMetrics = useMemo(() => {
    return campaigns.reduce((acc, campaign) => ({
      sent: acc.sent + campaign.sent,
      opened: acc.opened + campaign.opened,
      clicked: acc.clicked + campaign.clicked,
      converted: acc.converted + campaign.converted,
      investment: acc.investment + campaign.investment,
      revenue: acc.revenue + campaign.revenue
    }), { sent: 0, opened: 0, clicked: 0, converted: 0, investment: 0, revenue: 0 });
  }, [campaigns]);

  const handleCampaignAction = (action: string, campaignId: string) => {
    toast.success(t('monitoring.campaigns.toast.actionExecuted', { action, campaignId }));
  };


  const CampanhasModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('monitoring.campaigns.title')}</h2>
        <Button onClick={() => toast.success(t('monitoring.campaigns.toast.inDevelopment'))}>
          <Play className="h-4 w-4 mr-2" />
          {t('monitoring.campaigns.newCampaign')}
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  <p className="text-muted-foreground">{t('monitoring.campaigns.type')}: {campaign.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      campaign.status === 'ativa' ? 'default' :
                      campaign.status === 'pausada' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {campaign.status === 'ativa' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {campaign.status === 'pausada' && <Pause className="h-3 w-3 mr-1" />}
                    {campaign.status === 'finalizada' && <Clock className="h-3 w-3 mr-1" />}
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('monitoring.campaigns.metrics.performance')}</p>
                  <p className="text-lg font-semibold">
                    {((campaign.opened / campaign.sent) * 100).toFixed(1)}% {t('monitoring.campaigns.metrics.opening')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('monitoring.campaigns.metrics.conversion')}</p>
                  <p className="text-lg font-semibold">
                    {((campaign.converted / campaign.sent) * 100).toFixed(1)}% {t('monitoring.campaigns.metrics.converted')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('monitoring.campaigns.metrics.roi')}</p>
                  <p className="text-lg font-semibold text-green-600">{campaign.roi}%</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {campaign.status === 'ativa' && (
                  <Button size="sm" variant="outline" onClick={() => handleCampaignAction(t('monitoring.campaigns.actions.pause'), campaign.id)}>
                    <Pause className="h-4 w-4 mr-1" />
                    {t('monitoring.campaigns.actions.pause')}
                  </Button>
                )}
                {campaign.status === 'pausada' && (
                  <Button size="sm" variant="outline" onClick={() => handleCampaignAction(t('monitoring.campaigns.actions.reactivate'), campaign.id)}>
                    <Play className="h-4 w-4 mr-1" />
                    {t('monitoring.campaigns.actions.reactivate')}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleCampaignAction(t('monitoring.campaigns.actions.analyze'), campaign.id)}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {t('monitoring.campaigns.actions.analyze')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const AnalyticsModule = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('monitoring.analytics.title')}</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('monitoring.analytics.performanceByType')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Oportunidades', 'Educativa', 'Retenção'].map((type) => {
                const typeCampaigns = campaigns.filter(c => c.type === type);
                const avgRoi = typeCampaigns.reduce((acc, c) => acc + c.roi, 0) / typeCampaigns.length || 0;
                
                return (
                  <div key={type} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{type}</span>
                    <div className="text-right">
                      <p className="font-semibold">{avgRoi.toFixed(0)}% {t('monitoring.campaigns.metrics.roi')}</p>
                      <p className="text-sm text-muted-foreground">{typeCampaigns.length} {t('monitoring.analytics.campaigns')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('monitoring.analytics.trends.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>{t('monitoring.analytics.trends.avgOpenRate')}</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">42.3%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('monitoring.analytics.trends.avgClickRate')}</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">12.8%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('monitoring.analytics.trends.avgConversionRate')}</span>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-semibold">4.2%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const RelatoriosModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('monitoring.reports.title')}</h2>
        <Button onClick={() => toast.success(t('monitoring.reports.reportGenerated'))}>
          {t('monitoring.reports.generateReport')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('monitoring.reports.financialSummary.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>{t('monitoring.reports.financialSummary.totalInvestment')}</span>
              <span className="font-semibold">R$ {totalMetrics.investment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('monitoring.reports.financialSummary.generatedRevenue')}</span>
              <span className="font-semibold text-green-600">R$ {totalMetrics.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>{t('monitoring.reports.financialSummary.totalROI')}</span>
              <span className="font-bold text-green-600">
                {((totalMetrics.revenue / totalMetrics.investment) * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('monitoring.reports.engagement.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>{t('monitoring.reports.engagement.totalReached')}</span>
              <span className="font-semibold">{totalMetrics.sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('monitoring.reports.engagement.totalEngagement')}</span>
              <span className="font-semibold">{totalMetrics.opened.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('monitoring.reports.engagement.totalConversions')}</span>
              <span className="font-semibold text-green-600">{totalMetrics.converted}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <CampaignProvider>
      <div className="p-6">
        <Tabs value={selectedModule} onValueChange={(value) => setSelectedModule(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">{t('monitoring.tabs.dashboard')}</TabsTrigger>
            <TabsTrigger value="campanhas">{t('monitoring.tabs.campaigns')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('monitoring.tabs.analytics')}</TabsTrigger>
            <TabsTrigger value="relatorios">{t('monitoring.tabs.reports')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardModule />
          </TabsContent>

          <TabsContent value="campanhas">
            <CampanhasModule />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsModule />
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosModule />
          </TabsContent>
        </Tabs>
      </div>
    </CampaignProvider>
  );
};

export default AcompanhamentoTab;