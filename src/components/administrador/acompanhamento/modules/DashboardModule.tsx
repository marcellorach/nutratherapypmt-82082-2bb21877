import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Mail, Eye, MousePointer, TrendingUp, BarChart3, Pause } from "lucide-react";

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

interface DashboardModuleProps {
  activeCampaigns: Campaign[];
  totalMetrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    investment: number;
    revenue: number;
  };
  onCampaignAction: (action: string, campaignId: string) => void;
}

const DashboardModule: React.FC<DashboardModuleProps> = ({
  activeCampaigns,
  totalMetrics,
  onCampaignAction
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Acompanhamento</h2>
          <p className="text-muted-foreground">Monitoramento em tempo real das campanhas ativas</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Enviado</p>
                <p className="text-2xl font-bold">{totalMetrics.sent.toLocaleString()}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Abertura</p>
                <p className="text-2xl font-bold">{((totalMetrics.opened / totalMetrics.sent) * 100).toFixed(1)}%</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Clique</p>
                <p className="text-2xl font-bold">{((totalMetrics.clicked / totalMetrics.sent) * 100).toFixed(1)}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI Médio</p>
                <p className="text-2xl font-bold">{((totalMetrics.revenue / totalMetrics.investment) * 100).toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campanhas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Campanhas em Andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Iniciada em {new Date(campaign.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={campaign.type === 'Oportunidades' ? 'default' : 'secondary'}>
                    {campaign.type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Enviado</p>
                    <p className="font-semibold">{campaign.sent}/{campaign.targetAudience}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Aberto</p>
                    <p className="font-semibold">{campaign.opened}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Clicado</p>
                    <p className="font-semibold">{campaign.clicked}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Convertido</p>
                    <p className="font-semibold">{campaign.converted}</p>
                  </div>
                </div>

                <Progress value={(campaign.sent / campaign.targetAudience) * 100} className="mb-3" />
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">ROI: </span>
                    <span className="font-semibold text-green-600">{campaign.roi}%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onCampaignAction('pausar', campaign.id)}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pausar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onCampaignAction('detalhes', campaign.id)}>
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