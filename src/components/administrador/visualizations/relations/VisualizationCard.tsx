
import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import VisualizationHeader from './components/VisualizationHeader';
import VisualizationTabs from './components/VisualizationTabs';
import VisualizationLegend from './components/VisualizationLegend';

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
      </CardContent>
    </Card>
  );
};

export default VisualizationCard;
