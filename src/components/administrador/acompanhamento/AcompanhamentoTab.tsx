import React, { useState, useMemo } from 'react';
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
import DashboardModule from './modules/DashboardModule';
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
    toast.success(`Ação "${action}" executada para a campanha ${campaignId}`);
  };


  const CampanhasModule = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Campanhas</h2>
        <Button onClick={() => toast.success("Funcionalidade em desenvolvimento")}>
          <Play className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  <p className="text-muted-foreground">Tipo: {campaign.type}</p>
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
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <p className="text-lg font-semibold">
                    {((campaign.opened / campaign.sent) * 100).toFixed(1)}% abertura
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversão</p>
                  <p className="text-lg font-semibold">
                    {((campaign.converted / campaign.sent) * 100).toFixed(1)}% convertido
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className="text-lg font-semibold text-green-600">{campaign.roi}%</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {campaign.status === 'ativa' && (
                  <Button size="sm" variant="outline" onClick={() => handleCampaignAction('pausar', campaign.id)}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                )}
                {campaign.status === 'pausada' && (
                  <Button size="sm" variant="outline" onClick={() => handleCampaignAction('reativar', campaign.id)}>
                    <Play className="h-4 w-4 mr-1" />
                    Reativar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleCampaignAction('analisar', campaign.id)}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analisar
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
      <h2 className="text-2xl font-bold">Analytics Detalhado</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance por Tipo de Campanha</CardTitle>
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
                      <p className="font-semibold">{avgRoi.toFixed(0)}% ROI</p>
                      <p className="text-sm text-muted-foreground">{typeCampaigns.length} campanhas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendências de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Taxa de Abertura Média</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">42.3%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxa de Clique Média</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">12.8%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxa de Conversão Média</span>
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
        <h2 className="text-2xl font-bold">Relatórios Executivos</h2>
        <Button onClick={() => toast.success("Relatório gerado com sucesso!")}>
          Gerar Relatório Completo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Investimento Total</span>
              <span className="font-semibold">R$ {totalMetrics.investment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Receita Gerada</span>
              <span className="font-semibold text-green-600">R$ {totalMetrics.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>ROI Total</span>
              <span className="font-bold text-green-600">
                {((totalMetrics.revenue / totalMetrics.investment) * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Engajamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total de Contatos Alcançados</span>
              <span className="font-semibold">{totalMetrics.sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Engajamento Total</span>
              <span className="font-semibold">{totalMetrics.opened.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Conversões Totais</span>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
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