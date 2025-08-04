import React, { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Target, Brain, Calculator, TrendingUp, Zap, Command, Send, BarChart3 } from "lucide-react";
import { useROIIntelligence } from "@/hooks/roi/useROIIntelligence";

// Módulos refatorados
import CommandModule from './modules/CommandModule';
import CreationModule from './modules/CreationModule';
import ExecutionModule from './modules/ExecutionModule';
import AnalyticsModule from './modules/AnalyticsModule';

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
          <CommandModule 
            audienceSegments={audienceSegments}
            marketOpportunities={marketOpportunities}
          />
        </TabsContent>

        <TabsContent value="creation" className="mt-6">
          <CreationModule 
            campaignTypes={campaignTypes}
            audienceSegments={audienceSegments}
            onCampaignExecute={simulateCampaignExecution}
            isExecuting={isExecuting}
          />
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          <ExecutionModule 
            isExecuting={isExecuting}
            campaignProgress={campaignProgress}
            audienceSegments={audienceSegments}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsModule 
            audienceSegments={audienceSegments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartCampaignSystem;