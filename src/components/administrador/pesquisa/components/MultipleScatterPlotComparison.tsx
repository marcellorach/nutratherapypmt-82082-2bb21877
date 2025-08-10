import React, { useState, useCallback } from 'react';
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

// Raças disponíveis para seleção
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
  const [comparisonCharts, setComparisonCharts] = useState<ComparisonChart[]>([]);
  const { toast } = useToast();

  const addComparisonChart = useCallback(() => {
    if (comparisonCharts.length >= 4) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 4 gráficos de comparação permitidos",
        variant: "destructive"
      });
      return;
    }

    const newChart: ComparisonChart = {
      id: `chart_${Date.now()}`,
      selectedBreed: 'SRD', // Raça padrão
      title: `Gráfico ${comparisonCharts.length + 2}`
    };

    setComparisonCharts(prev => [...prev, newChart]);

    toast({
      title: "Gráfico adicionado",
      description: `Gráfico de comparação ${comparisonCharts.length + 2} criado`
    });
  }, [comparisonCharts.length, toast]);

  const removeComparisonChart = useCallback((chartId: string) => {
    setComparisonCharts(prev => prev.filter(chart => chart.id !== chartId));
    
    toast({
      title: "Gráfico removido",
      description: "Gráfico de comparação removido com sucesso"
    });
  }, [toast]);

  const updateChartBreed = useCallback((chartId: string, breed: string) => {
    setComparisonCharts(prev => 
      prev.map(chart => 
        chart.id === chartId 
          ? { 
              ...chart, 
              selectedBreed: breed,
              title: `Gráfico ${prev.indexOf(chart) + 2}: ${breed}`
            }
          : chart
      )
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Gráfico Principal: Todas as Raças
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <IndividualScatterPlot
            title={title}
            data={data}
            yAxisLabel={yAxisLabel}
            description={description}
            sampleSizes={sampleSizes}
          />
        </CardContent>
      </Card>

      {/* Botão Adicionar Gráfico */}
      <div className="flex justify-center">
        <Button
          onClick={addComparisonChart}
          variant="outline"
          className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
          disabled={comparisonCharts.length >= 4}
        >
          <Plus className="h-4 w-4" />
          Adicionar Gráfico de Comparação
          {comparisonCharts.length > 0 && (
            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              {comparisonCharts.length}/4
            </span>
          )}
        </Button>
      </div>

      {/* Gráficos de Comparação */}
      {comparisonCharts.map((chart, index) => (
        <Card key={chart.id} className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {chart.title}
                </CardTitle>
                
                {/* Seletor de Raça */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Raça:</span>
                  <Select 
                    value={chart.selectedBreed} 
                    onValueChange={(breed) => updateChartBreed(chart.id, breed)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selecionar raça" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {AVAILABLE_BREEDS.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Botão Remover */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeComparisonChart(chart.id)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <IndividualScatterPlot
              title={`${title} - Filtrado para ${chart.selectedBreed}`}
              data={data}
              yAxisLabel={yAxisLabel}
              description={`${description} - Análise específica para raça ${chart.selectedBreed}`}
              sampleSizes={sampleSizes}
              defaultBreed={chart.selectedBreed}
              comparisonMode={true}
            />
          </CardContent>
        </Card>
      ))}

      {/* Informação sobre múltiplos gráficos */}
      {comparisonCharts.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-2">Comparação Ativa</h4>
                <p className="text-sm text-muted-foreground">
                  Você está comparando {comparisonCharts.length + 1} gráficos simultaneamente. 
                  Use os controles compartilhados para ajustar o número de cães e modo densidade em todos os gráficos.
                </p>
                
                {comparisonCharts.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <strong>Raças sendo comparadas:</strong> Todas as raças, {comparisonCharts.map(c => c.selectedBreed).join(', ')}
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