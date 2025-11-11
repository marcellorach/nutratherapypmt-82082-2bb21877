
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InsightCard from './ai-insights/InsightCard';
import InsightDetailsDialog from './ai-insights/InsightDetailsDialog';
import { mockInsights } from './ai-insights/mockInsights';
import { AIInsight } from './ai-insights/types';

const AIInsightsTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('0');

  const handleViewDetails = (insight: AIInsight) => {
    setSelectedInsight(insight);
    setDialogOpen(true);
  };

  const filteredInsights = mockInsights.filter(insight => {
    const typeMatch = typeFilter === 'all' || insight.type === typeFilter;
    const confidenceMatch = insight.confidence >= parseInt(confidenceFilter);
    return typeMatch && confidenceMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t('aiInsights.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('aiInsights.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('aiInsights.filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('aiInsights.filters.all')}</SelectItem>
              <SelectItem value="longitudinal-discovery">
                {t('aiInsights.types.longitudinalDiscovery')}
              </SelectItem>
              <SelectItem value="new-study">
                {t('aiInsights.types.newStudy')}
              </SelectItem>
              <SelectItem value="efficacy-analysis">
                {t('aiInsights.types.efficacyAnalysis')}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('aiInsights.filters.confidence')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Confidence</SelectItem>
              <SelectItem value="60">≥ 60%</SelectItem>
              <SelectItem value="70">≥ 70%</SelectItem>
              <SelectItem value="80">≥ 80%</SelectItem>
              <SelectItem value="90">≥ 90%</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInsights.map(insight => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onViewDetails={() => handleViewDetails(insight)}
          />
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No insights found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more insights
          </p>
        </div>
      )}

      <InsightDetailsDialog
        insight={selectedInsight}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default AIInsightsTab;
