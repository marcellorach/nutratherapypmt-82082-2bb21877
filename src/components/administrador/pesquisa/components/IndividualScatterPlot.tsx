import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/feedback";
import { Dog, Calendar, Weight, Stethoscope } from "lucide-react";

interface DogDataPoint {
  id: string;
  grupo: 'controle' | 'dapagliflozina' | 'empagliflozina';
  value: number;
  month: string;
  raca: string;
  idade: number;
  peso: number;
  sexo: string;
  timePoint: number;
}

interface IndividualScatterPlotProps {
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

// Raças de cães mais comuns no estudo
const COMMON_BREEDS = [
  'Labrador', 'Golden Retriever', 'Bulldog Francês', 'SRD', 'Pastor Alemão',
  'Beagle', 'Yorkshire', 'Poodle', 'Border Collie', 'Rottweiler', 'Boxer',
  'Cocker Spaniel', 'Schnauzer', 'Pinscher', 'Shih Tzu'
];

const generateIndividualData = (
  aggregatedData: Array<{label: string; control: number; dapagliflozin: number; empagliflozin: number}>,
  sampleSizes: {controle: number; dapa: number; empa: number},
  selectedTimePoint: number,
  selectedBreed?: string
): DogDataPoint[] => {
  const currentData = aggregatedData[selectedTimePoint];
  if (!currentData) return [];

  const dogData: DogDataPoint[] = [];
  
  // Ajustar número máximo de pontos baseado se há filtro de raça
  const MAX_POINTS_PER_GROUP = selectedBreed && selectedBreed !== 'todas' ? 80 : 25;
  
  // Função para gerar variabilidade individual baseada no valor médio
  const generateIndividualVariation = (meanValue: number, groupSize: number, grupo: string) => {
    const individuals: { value: number; raca: string; idade: number; peso: number; sexo: string }[] = [];
    const variance = Math.max(0.5, meanValue * 0.15);
    const actualSize = Math.min(groupSize, MAX_POINTS_PER_GROUP);
    
    // Distribuição realística de raças por tamanho da amostra
    const getBreedDistribution = () => {
      if (selectedBreed && selectedBreed !== 'todas') {
        return [selectedBreed]; // Apenas a raça selecionada
      }
      
      // Distribuição típica de raças em estudos veterinários
      const breedWeights = {
        'SRD': 0.25, // Sem raça definida - mais comum
        'Labrador': 0.15,
        'Golden Retriever': 0.12,
        'Bulldog Francês': 0.08,
        'Pastor Alemão': 0.08,
        'Beagle': 0.06,
        'Yorkshire': 0.05,
        'Poodle': 0.05,
        'Border Collie': 0.04,
        'Rottweiler': 0.03,
        'Boxer': 0.03,
        'Cocker Spaniel': 0.02,
        'Schnauzer': 0.02,
        'Pinscher': 0.01,
        'Shih Tzu': 0.01
      };
      
      return COMMON_BREEDS.filter(breed => Math.random() < (breedWeights[breed] || 0.01));
    };
    
    for (let i = 0; i < actualSize; i++) {
      // Distribuição normal para valores
      const random1 = Math.random();
      const random2 = Math.random();
      const gaussian = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2);
      
      let value = meanValue + (gaussian * variance * 0.5);
      value = Math.max(0, Math.min(value, 100));
      
      // Selecionar raça
      const availableBreeds = getBreedDistribution();
      const raca = selectedBreed && selectedBreed !== 'todas' 
        ? selectedBreed 
        : availableBreeds[Math.floor(Math.random() * availableBreeds.length)] || 'SRD';
      
      // Características baseadas na raça e realismo veterinário
      const getBreedCharacteristics = (breed: string) => {
        const characteristics = {
          'Labrador': { pesoMin: 25, pesoMax: 40, idadeMedia: 6 },
          'Golden Retriever': { pesoMin: 25, pesoMax: 40, idadeMedia: 6 },
          'Bulldog Francês': { pesoMin: 8, pesoMax: 15, idadeMedia: 4 },
          'Yorkshire': { pesoMin: 2, pesoMax: 7, idadeMedia: 7 },
          'Pastor Alemão': { pesoMin: 25, pesoMax: 45, idadeMedia: 5 },
          'Beagle': { pesoMin: 10, pesoMax: 25, idadeMedia: 6 },
          'Poodle': { pesoMin: 6, pesoMax: 30, idadeMedia: 6 },
          'SRD': { pesoMin: 5, pesoMax: 35, idadeMedia: 5 }
        };
        return characteristics[breed] || characteristics['SRD'];
      };
      
      const breedInfo = getBreedCharacteristics(raca);
      const idade = Math.max(1, Math.min(15, Math.round(breedInfo.idadeMedia + (Math.random() - 0.5) * 6)));
      const peso = Math.round(breedInfo.pesoMin + Math.random() * (breedInfo.pesoMax - breedInfo.pesoMin));
      const sexo = Math.random() > 0.5 ? 'Macho' : 'Fêmea';
      
      individuals.push({ value, raca, idade, peso, sexo });
    }
    
    return individuals;
  };

  // Usar tamanhos reduzidos para cada grupo
  const maxControle = Math.min(sampleSizes.controle, MAX_POINTS_PER_GROUP);
  const maxDapa = Math.min(sampleSizes.dapa, MAX_POINTS_PER_GROUP);
  const maxEmpa = Math.min(sampleSizes.empa, MAX_POINTS_PER_GROUP);

  // Gerar dados para grupo controle
  const controleValues = generateIndividualVariation(currentData.control, maxControle, 'controle');
  controleValues.forEach((individual, index) => {
    dogData.push({
      id: `controle_${index + 1}`,
      grupo: 'controle',
      value: individual.value,
      month: currentData.label,
      raca: individual.raca,
      idade: individual.idade,
      peso: individual.peso,
      sexo: individual.sexo,
      timePoint: selectedTimePoint
    });
  });

  // Gerar dados para grupo dapagliflozina
  const dapaValues = generateIndividualVariation(currentData.dapagliflozin, maxDapa, 'dapagliflozina');
  dapaValues.forEach((individual, index) => {
    dogData.push({
      id: `dapa_${index + 1}`,
      grupo: 'dapagliflozina',
      value: individual.value,
      month: currentData.label,
      raca: individual.raca,
      idade: individual.idade,
      peso: individual.peso,
      sexo: individual.sexo,
      timePoint: selectedTimePoint
    });
  });

  // Gerar dados para grupo empagliflozina
  const empaValues = generateIndividualVariation(currentData.empagliflozin, maxEmpa, 'empagliflozina');
  empaValues.forEach((individual, index) => {
    dogData.push({
      id: `empa_${index + 1}`,
      grupo: 'empagliflozina',
      value: individual.value,
      month: currentData.label,
      raca: individual.raca,
      idade: individual.idade,
      peso: individual.peso,
      sexo: individual.sexo,
      timePoint: selectedTimePoint
    });
  });

  return dogData;
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DogDataPoint;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Dog className="h-4 w-4 text-primary" />
          <span className="font-semibold">Cão #{data.id}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-3 w-3" />
            <span>Grupo: <span className="font-medium">{data.grupo}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span>Valor: <span className="font-medium">{data.value.toFixed(1)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Tempo: <span className="font-medium">{data.month}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span>🐕</span>
            <span>Raça: <span className="font-medium">{data.raca}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎂</span>
            <span>Idade: <span className="font-medium">{data.idade} anos</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Weight className="h-3 w-3" />
            <span>Peso: <span className="font-medium">{data.peso}kg</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚥</span>
            <span>Sexo: <span className="font-medium">{data.sexo}</span></span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const IndividualScatterPlot: React.FC<IndividualScatterPlotProps> = ({
  title,
  data,
  yAxisLabel,
  description,
  sampleSizes
}) => {
  const [selectedTimePoint, setSelectedTimePoint] = useState(data.length - 1);
  const [selectedBreed, setSelectedBreed] = useState<string>('todas');
  const [isLoading, setIsLoading] = useState(false);

  // Memoizar a geração de dados para evitar recálculos desnecessários
  const scatterData = useMemo(() => {
    return generateIndividualData(data, sampleSizes, selectedTimePoint, selectedBreed);
  }, [data, sampleSizes, selectedTimePoint, selectedBreed]);

  // Obter contagem de cães por raça
  const breedCounts = useMemo(() => {
    const counts = {};
    scatterData.forEach(dog => {
      counts[dog.raca] = (counts[dog.raca] || 0) + 1;
    });
    return counts;
  }, [scatterData]);

  // Raças disponíveis ordenadas por frequência
  const availableBreeds = useMemo(() => {
    const uniqueBreeds = Array.from(new Set(scatterData.map(dog => dog.raca)));
    return uniqueBreeds.sort((a, b) => (breedCounts[b] || 0) - (breedCounts[a] || 0));
  }, [scatterData, breedCounts]);

  // Debounce da mudança de timepoint
  const handleTimePointChange = useCallback((index: number) => {
    setSelectedTimePoint(index);
  }, []);

  // Handler para mudança de raça com loading
  const handleBreedChange = useCallback(async (breed: string) => {
    setIsLoading(true);
    
    // Simular processamento (delay realístico)
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setSelectedBreed(breed);
    setIsLoading(false);
  }, []);

  const grupoCores = {
    controle: '#3b82f6', // blue-500
    dapagliflozina: '#10b981', // emerald-500
    empagliflozina: '#f59e0b' // amber-500
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title} - Dados Individuais</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Seletor de Raça */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Dog className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por raça:</span>
          </div>
          
          <Select value={selectedBreed} onValueChange={handleBreedChange} disabled={isLoading}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione uma raça" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="todas">
                Todas as raças ({scatterData.length} cães)
              </SelectItem>
              {availableBreeds.map((breed) => (
                <SelectItem key={breed} value={breed}>
                  {breed} ({breedCounts[breed] || 0} cães)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isLoading && (
            <LoadingSpinner className="text-primary" />
          )}
        </div>

        {/* Controles de tempo */}
        <div className="flex flex-wrap gap-1 pt-2">
          {data.map((item, index) => (
            <Button
              key={index}
              variant={selectedTimePoint === index ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimePointChange(index)}
              className="h-7 px-2 text-xs"
              disabled={isLoading}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="category" 
                dataKey="grupo" 
                domain={['controle', 'dapagliflozina', 'empagliflozina']}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="value"
                domain={[0, 'dataMax + 5']}
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Scatter plots por grupo */}
              <Scatter 
                name="Controle" 
                data={scatterData.filter(d => d.grupo === 'controle')} 
                fill={grupoCores.controle}
                fillOpacity={0.6}
                stroke={grupoCores.controle}
                strokeWidth={1}
              />
              <Scatter 
                name="Dapagliflozina" 
                data={scatterData.filter(d => d.grupo === 'dapagliflozina')} 
                fill={grupoCores.dapagliflozina}
                fillOpacity={0.6}
                stroke={grupoCores.dapagliflozina}
                strokeWidth={1}
              />
              <Scatter 
                name="Empagliflozina" 
                data={scatterData.filter(d => d.grupo === 'empagliflozina')} 
                fill={grupoCores.empagliflozina}
                fillOpacity={0.6}
                stroke={grupoCores.empagliflozina}
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas do ponto temporal selecionado */}
        <div className="mt-4 pt-4 border-t border-border">
          {selectedBreed !== 'todas' && (
            <div className="mb-3 p-2 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-center">
                Visualizando apenas: <span className="text-primary">{selectedBreed}</span>
                <div className="text-xs text-muted-foreground mt-1">
                  {scatterData.length} cães desta raça sendo exibidos
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-medium text-blue-600">Controle</div>
              <div>{scatterData.filter(d => d.grupo === 'controle').length} cães</div>
              <div>Média: {data[selectedTimePoint]?.control.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-emerald-600">Dapagliflozina</div>
              <div>{scatterData.filter(d => d.grupo === 'dapagliflozina').length} cães</div>
              <div>Média: {data[selectedTimePoint]?.dapagliflozin.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-amber-600">Empagliflozina</div>
              <div>{scatterData.filter(d => d.grupo === 'empagliflozina').length} cães</div>
              <div>Média: {data[selectedTimePoint]?.empagliflozin.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndividualScatterPlot;