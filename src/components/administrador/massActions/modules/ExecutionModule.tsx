import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Filter, Calculator } from "lucide-react";

interface ExecutionModuleProps {
  isExecuting: boolean;
  campaignProgress: number;
  audienceSegments: Array<{
    id: string;
    name: string;
    count: number;
    roiPotential: number;
    conversionRate: number;
    priority: string;
    description: string;
    color: string;
  }>;
}

const ExecutionModule: React.FC<ExecutionModuleProps> = ({
  isExecuting,
  campaignProgress,
  audienceSegments
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      {isExecuting && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary animate-pulse" />
              {t('bulkActions.execution.inProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={campaignProgress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span>{t('bulkActions.execution.personalizingMessages')}</span>
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
              {t('bulkActions.execution.intelligentSegmentation')}
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
                      <span className="text-muted-foreground">{t('bulkActions.execution.potentialROI')} </span>
                      <span className="font-medium">{segment.roiPotential.toFixed(1)}x</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t('bulkActions.execution.conversion')} </span>
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
              {t('bulkActions.execution.campaignSimulator')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t('bulkActions.execution.projectedResults')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('bulkActions.execution.totalSends')}</span>
                    <p className="font-bold text-lg">979</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('bulkActions.execution.estimatedConversions')}</span>
                    <p className="font-bold text-lg text-green-600">412</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('bulkActions.execution.expectedROI')}</span>
                    <p className="font-bold text-lg text-blue-600">3.4x</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('bulkActions.execution.estimatedRevenue')}</span>
                    <p className="font-bold text-lg text-purple-600">R$ 186K</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium">{t('bulkActions.execution.investmentScenarios')}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{t('bulkActions.execution.conservative', { roi: '2.1' })}</span>
                    <span className="font-medium">R$ 94K</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>{t('bulkActions.execution.optimistic', { roi: '4.2' })}</span>
                    <span className="font-medium">R$ 284K</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>{t('bulkActions.execution.aggressive', { roi: '6.1' })}</span>
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
};

export default ExecutionModule;