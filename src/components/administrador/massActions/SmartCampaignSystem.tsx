import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Command, 
  Target, 
  Brain, 
  Calculator, 
  Send, 
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Eye,
  Filter
} from "lucide-react";
import { useROIIntelligence } from "@/hooks/roi/useROIIntelligence";

const SmartCampaignSystem: React.FC = () => {
  const { toast } = useToast();
  const { roiMetrics, marketOpportunities, clientProfiles } = useROIIntelligence();
  const [selectedModule, setSelectedModule] = useState('command');
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mock data para segmentação inteligente
  const audienceSegments = useMemo(() => [
    {
      id: 'high-roi-urgent',
      name: 'ROI Alto + Urgência Crítica',
      count: 142,
      roiPotential: 4.8,
      conversionRate: 0.73,
      priority: 'critical',
      description: 'Pets com condições críticas e alto potencial de ROI',
      color: 'red'
    },
    {
      id: 'preventive-premium', 
      name: 'Preventivo Premium',
      count: 287,
      roiPotential: 3.2,
      conversionRate: 0.45,
      priority: 'high',
      description: 'Clientes premium interessados em prevenção',
      color: 'purple'
    },
    {
      id: 'expansion-opportunity',
      name: 'Oportunidade de Expansão',
      count: 394,
      roiPotential: 2.6,
      conversionRate: 0.38,
      priority: 'medium',
      description: 'Clientes atuais com potencial para novos protocolos',
      color: 'blue'
    },
    {
      id: 'nurturing-prospects',
      name: 'Prospects em Nutrição',
      count: 156,
      roiPotential: 2.1,
      conversionRate: 0.22,
      priority: 'low',
      description: 'Novos prospects para educação e nurturing',
      color: 'green'
    }
  ], []);

  const campaignTypes = useMemo(() => [
    {
      id: 'opportunity-gaps',
      name: 'Campanhas de Oportunidades',
      description: 'Baseadas nos gaps identificados no ROI',
      icon: Target,
      segments: ['high-roi-urgent', 'expansion-opportunity'],
      estimatedConversion: 0.68,
      roi: 4.2
    },
    {
      id: 'educational-vets',
      name: 'Campanhas Educativas Veterinárias',
      description: 'Educação sobre novas evidências científicas',
      icon: Brain,
      segments: ['preventive-premium', 'expansion-opportunity'],
      estimatedConversion: 0.42,
      roi: 3.1
    },
    {
      id: 'retention-loyalty',
      name: 'Campanhas de Retenção',
      description: 'Para clientes com risco de churn',
      icon: TrendingUp,
      segments: ['expansion-opportunity', 'nurturing-prospects'],
      estimatedConversion: 0.55,
      roi: 2.8
    },
    {
      id: 'upsell-premium',
      name: 'Campanhas de Upsell',
      description: 'Expansão de protocolos existentes',
      icon: Zap,
      segments: ['preventive-premium', 'expansion-opportunity'],
      estimatedConversion: 0.38,
      roi: 3.4
    }
  ], []);

  const simulateCampaignExecution = (campaignType: string, segments: string[]) => {
    setIsExecuting(true);
    setCampaignProgress(0);

    const interval = setInterval(() => {
      setCampaignProgress(prev => {
        const newProgress = prev + Math.random() * 12;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsExecuting(false);
          
          const totalRecipients = segments.reduce((sum, segId) => {
            const segment = audienceSegments.find(s => s.id === segId);
            return sum + (segment?.count || 0);
          }, 0);

          toast({
            title: "Campanha Executada com Sucesso",
            description: `Campanha enviada para ${totalRecipients} destinatários com personalização por IA.`,
            duration: 5000,
          });
          return 100;
        }
        
        return newProgress;
      });
    }, 400);
  };

  const CommandModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Performance Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ROI Médio</span>
                <span className="font-bold text-primary">{roiMetrics.averageROI.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa Conversão</span>
                <span className="font-bold">47.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Campanhas Ativas</span>
                <span className="font-bold">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Oportunidades Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Alto Potencial</span>
                <Badge className="bg-green-100 text-green-800">{marketOpportunities.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Valor Estimado</span>
                <span className="font-bold text-green-600">R$ 847K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Segmentos</span>
                <span className="font-bold">{audienceSegments.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              IA Personalização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Algoritmos Ativos</span>
                <span className="font-bold">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Precisão</span>
                <span className="font-bold text-purple-600">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Otimização</span>
                <Badge className="bg-purple-100 text-purple-800">Ativa</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const CreationModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaignTypes.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <campaign.icon className="h-5 w-5 mr-2 text-primary" />
                {campaign.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{campaign.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ROI Estimado</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {campaign.roi.toFixed(1)}x
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa Conversão</span>
                  <span className="text-sm font-bold">
                    {(campaign.estimatedConversion * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Segmentos Alvo:</span>
                  <div className="flex flex-wrap gap-2">
                    {campaign.segments.map(segmentId => {
                      const segment = audienceSegments.find(s => s.id === segmentId);
                      return segment ? (
                        <Badge 
                          key={segmentId} 
                          variant="outline" 
                          className={`text-${segment.color}-700 border-${segment.color}-300`}
                        >
                          {segment.count} destinatários
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => simulateCampaignExecution(campaign.id, campaign.segments)}
                  disabled={isExecuting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Criar Campanha
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ExecutionModule = () => (
    <div className="space-y-6">
      {isExecuting && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary animate-pulse" />
              Execução em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={campaignProgress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span>Personalizando mensagens com IA...</span>
                <span>{Math.round(campaignProgress)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Segmentação Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audienceSegments.map((segment) => (
                <div key={segment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-xs text-muted-foreground">{segment.description}</p>
                    </div>
                    <Badge className={`bg-${segment.color}-100 text-${segment.color}-800`}>
                      {segment.count}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-xs">
                      <span className="text-muted-foreground">ROI Potencial: </span>
                      <span className="font-medium">{segment.roiPotential.toFixed(1)}x</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Conversão: </span>
                      <span className="font-medium">{(segment.conversionRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-green-600" />
              Simulador de Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Projeção de Resultados</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total de Envios:</span>
                    <p className="font-bold text-lg">979</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conversões Estimadas:</span>
                    <p className="font-bold text-lg text-green-600">412</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ROI Esperado:</span>
                    <p className="font-bold text-lg text-blue-600">3.4x</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Receita Estimada:</span>
                    <p className="font-bold text-lg text-purple-600">R$ 186K</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium">Cenários de Investimento</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Conservador (ROI 2.1x)</span>
                    <span className="font-medium">R$ 94K</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>Otimista (ROI 4.2x)</span>
                    <span className="font-medium">R$ 284K</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>Agressivo (ROI 6.1x)</span>
                    <span className="font-medium">R$ 398K</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AnalyticsModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">847</p>
                <p className="text-xs text-muted-foreground">Campanhas Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">68.4%</p>
                <p className="text-xs text-muted-foreground">Taxa de Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">42.1%</p>
                <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">3.7x</p>
                <p className="text-xs text-muted-foreground">ROI Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audienceSegments.map((segment) => (
              <div key={segment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{segment.name}</h4>
                  <Badge className={`bg-${segment.color}-100 text-${segment.color}-800`}>
                    {(segment.conversionRate * 100).toFixed(0)}% conversão
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Enviados:</span>
                    <p className="font-medium">{segment.count}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Abertos:</span>
                    <p className="font-medium">{Math.round(segment.count * 0.68)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clicados:</span>
                    <p className="font-medium">{Math.round(segment.count * 0.32)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Convertidos:</span>
                    <p className="font-medium text-green-600">
                      {Math.round(segment.count * segment.conversionRate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Sistema Inteligente de Campanhas
          </h2>
          <p className="text-muted-foreground">
            Central de comando para campanhas personalizadas por IA
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
          IA Ativa
        </Badge>
      </div>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="command" className="flex items-center">
            <Command className="h-4 w-4 mr-2" />
            Comando
          </TabsTrigger>
          <TabsTrigger value="creation" className="flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Criação
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center">
            <Send className="h-4 w-4 mr-2" />
            Execução
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="command" className="mt-6">
          <CommandModule />
        </TabsContent>

        <TabsContent value="creation" className="mt-6">
          <CreationModule />
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          <ExecutionModule />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartCampaignSystem;