import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, BarChart3 } from "lucide-react";
import IndividualScatterPlot from './IndividualScatterPlot';
import { useToast } from "@/hooks/use-toast";

interface ComparisonChart {
  id: string;
  selectedBreed: string;
  title: string;
}

interface MultipleScatterPlotComparisonProps {
  title: string;
  data: Array<{
    label: string;
    control: number;
    dapagliflozin: number;
    empagliflozin: number;
  }>;
  yAxisLabel: string;
  description: string;
  sampleSizes: {
    controle: number;
    dapa: number;
    empa: number;
  };
}

const AVAILABLE_BREEDS = [
  'SRD', 'Labrador', 'Golden Retriever', 'Bulldog Francês', 'Pastor Alemão',
  'Beagle', 'Yorkshire', 'Poodle', 'Border Collie', 'Rottweiler', 'Boxer',
  'Cocker Spaniel', 'Schnauzer', 'Pinscher', 'Shih Tzu'
];

const MultipleScatterPlotComparison: React.FC<MultipleScatterPlotComparisonProps> = ({
  title,
  data,
  yAxisLabel,
  description,
  sampleSizes
}) => {
  const { t } = useTranslation();
  const [comparisonCharts, setComparisonCharts] = useState<ComparisonChart[]>([]);
  const { toast } = useToast();

  const addComparisonChart = useCallback(() => {
    if (comparisonCharts.length >= 4) {
      toast({
        title: t('multipleScatterPlot.toasts.limitTitle'),
        description: t('multipleScatterPlot.toasts.limitDescription'),
        variant: "destructive"
      });
      return;
    }

    const newChart: ComparisonChart = {
      id: `chart_${Date.now()}`,
      selectedBreed: 'SRD',
      title: `${t('multipleScatterPlot.chart')} ${comparisonCharts.length + 2}`
    };

    setComparisonCharts(prev => [...prev, newChart]);

    toast({
      title: t('multipleScatterPlot.toasts.addedTitle'),
      description: t('multipleScatterPlot.toasts.addedDescription', { number: comparisonCharts.length + 2 })
    });
  }, [comparisonCharts.length, toast, t]);

  const removeComparisonChart = useCallback((chartId: string) => {
    setComparisonCharts(prev => prev.filter(chart => chart.id !== chartId));
    toast({
      title: t('multipleScatterPlot.toasts.removedTitle'),
      description: t('multipleScatterPlot.toasts.removedDescription')
    });
  }, [toast, t]);

  const updateChartBreed = useCallback((chartId: string, breed: string) => {
    setComparisonCharts(prev => 
      prev.map(chart => 
        chart.id === chartId 
          ? { ...chart, selectedBreed: breed, title: `${t('multipleScatterPlot.chart')} ${prev.indexOf(chart) + 2}: ${breed}` }
          : chart
      )
    );
  }, [t]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('multipleScatterPlot.mainChart')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <IndividualScatterPlot title={title} data={data} yAxisLabel={yAxisLabel} description={description} sampleSizes={sampleSizes} />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={addComparisonChart} variant="outline" className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary" disabled={comparisonCharts.length >= 4}>
          <Plus className="h-4 w-4" />
          {t('multipleScatterPlot.addComparison')}
          {comparisonCharts.length > 0 && (
            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{comparisonCharts.length}/4</span>
          )}
        </Button>
      </div>

      {comparisonCharts.map((chart) => (
        <Card key={chart.id} className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{chart.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('multipleScatterPlot.breed')}:</span>
                  <Select value={chart.selectedBreed} onValueChange={(breed) => updateChartBreed(chart.id, breed)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('multipleScatterPlot.selectBreed')} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {AVAILABLE_BREEDS.map((breed) => (
                        <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeComparisonChart(chart.id)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <IndividualScatterPlot
              title={`${title} - ${t('multipleScatterPlot.filteredFor', { breed: chart.selectedBreed })}`}
              data={data}
              yAxisLabel={yAxisLabel}
              description={`${description} - ${t('multipleScatterPlot.analysisFor', { breed: chart.selectedBreed })}`}
              sampleSizes={sampleSizes}
              defaultBreed={chart.selectedBreed}
              comparisonMode={true}
            />
          </CardContent>
        </Card>
      ))}

      {comparisonCharts.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-2">{t('multipleScatterPlot.activeComparison')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('multipleScatterPlot.comparingCharts', { count: comparisonCharts.length + 1 })} {t('multipleScatterPlot.sharedControls')}
                </p>
                {comparisonCharts.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>{t('multipleScatterPlot.breedsCompared')}</strong> {t('multipleScatterPlot.allBreeds')}, {comparisonCharts.map(c => c.selectedBreed).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultipleScatterPlotComparison;
