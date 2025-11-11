
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AIInsight } from './types';

interface InsightDetailsDialogProps {
  insight: AIInsight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InsightDetailsDialog: React.FC<InsightDetailsDialogProps> = ({
  insight,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();

  if (!insight) return null;

  const getTypeLabel = (type: string) => {
    const labels = {
      'longitudinal-discovery': t('aiInsights.types.longitudinalDiscovery'),
      'new-study': t('aiInsights.types.newStudy'),
      'efficacy-analysis': t('aiInsights.types.efficacyAnalysis')
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (confidence >= 60) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
  };

  const getApprovalIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'rejected') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/5">
                {getTypeLabel(insight.type)}
              </Badge>
              <Badge className={getConfidenceColor(insight.confidence)}>
                {t('aiInsights.confidence')}: {insight.confidence}%
              </Badge>
            </div>
            <DialogTitle className="text-xl leading-tight pr-8">
              {insight.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('aiInsights.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="evidence">{t('aiInsights.tabs.evidence')}</TabsTrigger>
            {insight.resources && (
              <TabsTrigger value="resources">{t('aiInsights.tabs.resources')}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{insight.overview.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Based On</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.overview.basedOn.map((item, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="mr-2 text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {insight.overview.methodology && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Methodology</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{insight.overview.methodology}</p>
                </CardContent>
              </Card>
            )}

            {insight.overview.markers && insight.overview.markers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Biomarkers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insight.overview.markers.map((marker, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span>{marker}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {insight.approvalChain && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Approval Chain</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insight.approvalChain.map((stage, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {getApprovalIcon(stage.status)}
                          <div>
                            <p className="text-sm font-medium">{stage.stage}</p>
                            {stage.date && (
                              <p className="text-xs text-muted-foreground">{stage.date}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {stage.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="capitalize">{insight.recommendation.priority}</Badge>
                  <span className="text-sm font-medium">{insight.recommendation.action}</span>
                </div>
                <p className="text-sm text-muted-foreground">{insight.recommendation.impact}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{insight.evidence.dataSource}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sample Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insight.evidence.sampleSize.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timeframe</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{insight.evidence.timeframe}</p>
                </CardContent>
              </Card>

              {insight.evidence.statisticalSignificance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Significance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{insight.evidence.statisticalSignificance}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.evidence.findings.map((finding, index) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="mr-2 text-primary font-bold">{index + 1}.</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {insight.resources && (
            <TabsContent value="resources" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Study Population</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Dogs</p>
                      <p className="text-xl font-bold">{insight.resources.studyPopulation.totalDogs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-xl font-bold">{insight.resources.studyPopulation.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age Range</p>
                      <p className="text-lg font-semibold">{insight.resources.studyPopulation.ageRange}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Groups</p>
                      <p className="text-sm">
                        Placebo: {insight.resources.studyPopulation.groups.placebo} | 
                        Treatment: {insight.resources.studyPopulation.groups.treatment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Size Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{insight.resources.sizeDistribution.small}%</p>
                      <p className="text-sm text-muted-foreground">Small</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{insight.resources.sizeDistribution.medium}%</p>
                      <p className="text-sm text-muted-foreground">Medium</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{insight.resources.sizeDistribution.large}%</p>
                      <p className="text-sm text-muted-foreground">Large</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Breeds with Predisposition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insight.resources.breeds.map((breed, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{breed.name}</p>
                          <Badge variant="outline">{breed.volunteers} volunteers</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{breed.condition}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InsightDetailsDialog;
