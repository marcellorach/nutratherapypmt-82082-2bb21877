import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Target, Brain, Calculator, TrendingUp, Zap, Command, Send, BarChart3 } from "lucide-react";
import { useROIIntelligence } from "@/hooks/roi/useROIIntelligence";

// Módulos refatorados do sistema de campanhas inteligentes
import CommandModule from './modules/CommandModule';
import CreationModule from './modules/CreationModule';
import ExecutionModule from './modules/ExecutionModule';
import AnalyticsModule from './modules/AnalyticsModule';

/**
 * SmartCampaignSystem - Sistema inteligente de campanhas em massa
 * Utiliza IA para segmentação, personalização e otimização de ROI
 */
const SmartCampaignSystem: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { roiMetrics, marketOpportunities, clientProfiles } = useROIIntelligence();
  const [selectedModule, setSelectedModule] = useState('command');
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mock data para segmentação inteligente
  const audienceSegments = useMemo(() => [
    {
      id: 'high-roi-urgent',
      name: t('bulkActions.segments.highRoiUrgent.name'),
      count: 142,
      roiPotential: 4.8,
      conversionRate: 0.73,
      priority: 'critical',
      description: t('bulkActions.segments.highRoiUrgent.description'),
      color: 'red'
    },
    {
      id: 'preventive-premium', 
      name: t('bulkActions.segments.preventivePremium.name'),
      count: 287,
      roiPotential: 3.2,
      conversionRate: 0.45,
      priority: 'high',
      description: t('bulkActions.segments.preventivePremium.description'),
      color: 'purple'
    },
    {
      id: 'expansion-opportunity',
      name: t('bulkActions.segments.expansionOpportunity.name'),
      count: 394,
      roiPotential: 2.6,
      conversionRate: 0.38,
      priority: 'medium',
      description: t('bulkActions.segments.expansionOpportunity.description'),
      color: 'blue'
    },
    {
      id: 'nurturing-prospects',
      name: t('bulkActions.segments.nurturingProspects.name'),
      count: 156,
      roiPotential: 2.1,
      conversionRate: 0.22,
      priority: 'low',
      description: t('bulkActions.segments.nurturingProspects.description'),
      color: 'green'
    }
  ], [t]);

  const campaignTypes = useMemo(() => [
    {
      id: 'opportunity-gaps',
      name: t('bulkActions.campaignTypes.opportunityGaps.name'),
      description: t('bulkActions.campaignTypes.opportunityGaps.description'),
      icon: Target,
      segments: ['high-roi-urgent', 'expansion-opportunity'],
      estimatedConversion: 0.68,
      roi: 4.2
    },
    {
      id: 'educational-vets',
      name: t('bulkActions.campaignTypes.educationalVets.name'),
      description: t('bulkActions.campaignTypes.educationalVets.description'),
      icon: Brain,
      segments: ['preventive-premium', 'expansion-opportunity'],
      estimatedConversion: 0.42,
      roi: 3.1
    },
    {
      id: 'retention-loyalty',
      name: t('bulkActions.campaignTypes.retentionLoyalty.name'),
      description: t('bulkActions.campaignTypes.retentionLoyalty.description'),
      icon: TrendingUp,
      segments: ['expansion-opportunity', 'nurturing-prospects'],
      estimatedConversion: 0.55,
      roi: 2.8
    },
    {
      id: 'upsell-premium',
      name: t('bulkActions.campaignTypes.upsellPremium.name'),
      description: t('bulkActions.campaignTypes.upsellPremium.description'),
      icon: Zap,
      segments: ['preventive-premium', 'expansion-opportunity'],
      estimatedConversion: 0.38,
      roi: 3.4
    }
  ], [t]);

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
            title: t('bulkActions.toast.campaignSuccess'),
            description: t('bulkActions.toast.campaignSent', { count: totalRecipients }),
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
            {t('bulkActions.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('bulkActions.description')}
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
          {t('bulkActions.badges.aiActive')}
        </Badge>
      </div>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="command" className="flex items-center">
            <Command className="h-4 w-4 mr-2" />
            {t('bulkActions.tabs.command')}
          </TabsTrigger>
          <TabsTrigger value="creation" className="flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            {t('bulkActions.tabs.creation')}
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center">
            <Send className="h-4 w-4 mr-2" />
            {t('bulkActions.tabs.execution')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('bulkActions.tabs.analytics')}
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