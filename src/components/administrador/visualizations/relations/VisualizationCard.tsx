
import React, { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import VisualizationHeader from './components/VisualizationHeader';
import VisualizationTabs from './components/VisualizationTabs';
import VisualizationLegend from './components/VisualizationLegend';

const RelationsAuditorChat = lazy(() => import('@/components/administrador/relations/RelationsAuditorChat'));

interface VisualizationCardProps {
  efficacyFilter: string;
  onEfficacyFilterChange: (value: string) => void;
  relationView: string;
  onRelationViewChange: (value: string) => void;
  networkData: any;
  matrixData: any;
}

const VisualizationCard: React.FC<VisualizationCardProps> = ({
  efficacyFilter,
  onEfficacyFilterChange,
  relationView,
  onRelationViewChange,
  networkData,
  matrixData
}) => {
  const { t } = useTranslation();
  const [auditorOpen, setAuditorOpen] = useState(true);

  return (
    <Card>
      <CardHeader>
        <VisualizationHeader 
          efficacyFilter={efficacyFilter}
          onEfficacyFilterChange={onEfficacyFilterChange}
        />
      </CardHeader>
      
      <CardContent className="pt-4">
        <VisualizationTabs
          relationView={relationView}
          onRelationViewChange={onRelationViewChange}
          networkData={networkData}
          matrixData={matrixData}
          isLoading={false}
        />
        <VisualizationLegend />

        {/* Auditor Conversacional - Fixed Footer */}
        <Collapsible open={auditorOpen} onOpenChange={setAuditorOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-between gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">{t('relations.auditor.title', 'Auditor de Relações')}</span>
              </div>
              {auditorOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronUp className="h-4 w-4 text-primary" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 border border-primary/20 rounded-lg p-4 bg-primary/[0.02]">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }>
              <RelationsAuditorChat />
            </Suspense>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default VisualizationCard;
