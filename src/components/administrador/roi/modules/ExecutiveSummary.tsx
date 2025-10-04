import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface ExecutiveSummaryProps {
  roiMetrics: {
    totalROI: number;
    preventiveROI: number;
    treatmentROI: number;
    sustainabilityIndex: number;
    marketPenetration: number;
    averageROI: number;
  };
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ roiMetrics }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('roi.executiveSummary.title')}</CardTitle>
        <CardDescription>{t('roi.executiveSummary.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-300">{t('roi.executiveSummary.preventiveApproach')}</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('roi.executiveSummary.avgROI')}:</span>
                  <span className="font-bold text-green-600">{roiMetrics.preventiveROI}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('roi.executiveSummary.costPerPetYear')}:</span>
                  <span className="font-medium">R$ 1.260</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('roi.executiveSummary.caseReduction')}:</span>
                  <span className="font-medium">76%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <h4 className="font-semibold text-orange-800 dark:text-orange-300">{t('roi.executiveSummary.reactiveTreatment')}</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('roi.executiveSummary.avgROI')}:</span>
                  <span className="font-bold text-orange-600">{roiMetrics.treatmentROI}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('roi.executiveSummary.costPerCase')}:</span>
                  <span className="font-medium">R$ 3.840</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('roi.executiveSummary.incidenceRate')}:</span>
                  <span className="font-medium">18%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-primary">{t('roi.executiveSummary.competitiveAdvantage')}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('roi.executiveSummary.preventionSuperior', { difference: roiMetrics.preventiveROI - roiMetrics.treatmentROI })}
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              +{Math.round(((roiMetrics.preventiveROI - roiMetrics.treatmentROI) / roiMetrics.treatmentROI) * 100)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveSummary;