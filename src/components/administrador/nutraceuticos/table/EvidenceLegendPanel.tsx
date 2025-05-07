
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EvidenceLegend from './EvidenceLegend';

const EvidenceLegendPanel: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Legenda de Níveis de Evidência</CardTitle>
      </CardHeader>
      <CardContent>
        <EvidenceLegend />
      </CardContent>
    </Card>
  );
};

export default EvidenceLegendPanel;
