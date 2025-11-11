
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AIInsight } from './types';

interface InsightCardProps {
  insight: AIInsight;
  onViewDetails: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onViewDetails }) => {
  const { t } = useTranslation();

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

  const getPriorityColor = (priority: string) => {
    const colors = {
      'critical': 'bg-red-500/10 text-red-600 dark:text-red-400',
      'high': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      'medium': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      'low': 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const allApproved = insight.approvalChain?.every(stage => stage.status === 'approved');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="bg-primary/5">
            {getTypeLabel(insight.type)}
          </Badge>
          <Badge className={getConfidenceColor(insight.confidence)}>
            {t('aiInsights.confidence')}: {insight.confidence}%
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg leading-tight line-clamp-3">
          {insight.title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {insight.overview.summary}
        </p>

        {insight.approvalChain && (
          <div className="flex items-center gap-2 text-xs">
            {allApproved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {insight.approvalChain.length} {t('aiInsights.types.longitudinalDiscovery')} approved
                </span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">
                  Pending approval
                </span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className={getPriorityColor(insight.recommendation.priority)}>
            {insight.recommendation.priority.toUpperCase()}
          </Badge>
          
          <Button variant="ghost" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            {t('aiInsights.actions.viewDetails')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
