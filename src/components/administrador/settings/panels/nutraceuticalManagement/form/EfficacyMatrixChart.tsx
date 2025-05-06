
import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Card, CardContent } from '@/components/ui/card';

interface Nutraceutical {
  id: string;
  name: string;
  efficacy: number;
  condition: string;
  studies: number;
}

interface Props {
  data: Nutraceutical[];
  isLoading?: boolean;
}

const EfficacyMatrixChart: React.FC<Props> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Não há dados para exibir</p>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    nutraceutical: item.name,
    efficacy: item.efficacy,
    studies: item.studies,
    condition: item.condition
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveBar
        data={chartData}
        keys={['efficacy']}
        indexBy="nutraceutical"
        margin={{ top: 10, right: 60, bottom: 80, left: 80 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'green_blue' }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legendPosition: 'middle',
          legendOffset: 32,
          truncateTickAt: 0
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Eficácia',
          legendPosition: 'middle',
          legendOffset: -40,
          truncateTickAt: 0
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      />
    </div>
  );
};

export default EfficacyMatrixChart;
