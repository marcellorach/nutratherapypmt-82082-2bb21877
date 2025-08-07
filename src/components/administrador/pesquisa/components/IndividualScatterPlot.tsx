import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/feedback";
import { Dog, Calendar, Weight, Stethoscope } from "lucide-react";

interface DogDataPoint {
  dogId: string; // ID único do cão (para ligar pontos do mesmo animal)
  grupo: 'controle' | 'dapagliflozina' | 'empagliflozina';
  value: number;
  raca: string;
  idade: number;
  peso: number;
  sexo: string;
  timePoint: number;
  timeLabel: string;
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

// Cache para cães gerados (garantir consistência ao longo do tempo)
const dogCache = new Map<string, { raca: string; idade: number; peso: number; sexo: string; baseline: number }>();

const generateAllTimePointsData = (
  aggregatedData: Array<{label: string; control: number; dapagliflozin: number; empagliflozin: number}>,
  sampleSizes: {controle: number; dapa: number; empa: number},
  selectedBreed?: string
): DogDataPoint[] => {
  const dogData: DogDataPoint[] = [];
  
  // Ajustar número máximo de cães baseado se há filtro de raça
  const MAX_DOGS_PER_GROUP = selectedBreed && selectedBreed !== 'todas' ? 30 : 12;
  
  // Cores padrão (iguais aos gráficos de linha)
  const grupoCores = {
    controle: '#3b82f6',
    dapagliflozina: '#10b981', 
    empagliflozina: '#f59e0b'
  };
  
  // Distribuição realística de raças
  const getBreedDistribution = () => {
    if (selectedBreed && selectedBreed !== 'todas') {
      return [selectedBreed];
    }
    
    const breedWeights = {
      'SRD': 0.25,
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
  
  // Função para gerar características de um cão baseado na raça
  const generateDogCharacteristics = (dogId: string, grupo: string) => {
    if (dogCache.has(dogId)) {
      return dogCache.get(dogId)!;
    }
    
    const availableBreeds = getBreedDistribution();
    const raca = selectedBreed && selectedBreed !== 'todas' 
      ? selectedBreed 
      : availableBreeds[Math.floor(Math.random() * availableBreeds.length)] || 'SRD';
    
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
    
    // Baseline individual (tendência do cão a ter a condição)
    const baseline = Math.random() * 100;
    
    const characteristics = { raca, idade, peso, sexo, baseline };
    dogCache.set(dogId, characteristics);
    return characteristics;
  };
  
  // Função para calcular evolução da condição ao longo do tempo
  const calculateProgressionValue = (dogCharacteristics: any, timePoint: number, meanValue: number, grupo: string) => {
    // Evolução baseada no grupo de tratamento
    const treatmentEffect = {
      'controle': 1.0,        // Sem tratamento - progressão natural
      'dapagliflozina': 0.7,  // Redução da progressão
      'empagliflozina': 0.6   // Maior redução da progressão
    };
    
    // Tendência individual baseada no baseline do cão
    const individualTendency = dogCharacteristics.baseline;
    
    // Progressão temporal (doença tende a piorar com o tempo sem tratamento)
    const timeProgression = timePoint * 0.5;
    
    // Efeito do tratamento
    const treatment = treatmentEffect[grupo] || 1.0;
    
    // Variabilidade individual
    const variance = 8; // Desvio padrão
    const gaussian = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * variance / 2;
    
    // Combinar todos os fatores
    let value = (individualTendency + timeProgression * treatment + gaussian) * (meanValue / 50);
    
    // Garantir que está entre 0 e 100
    return Math.max(0, Math.min(100, value));
  };
  
  // Gerar cães para cada grupo
  ['controle', 'dapagliflozina', 'empagliflozina'].forEach(grupo => {
    const sampleSize = grupo === 'controle' ? sampleSizes.controle : 
                     grupo === 'dapagliflozina' ? sampleSizes.dapa : sampleSizes.empa;
    
    const numDogs = Math.min(sampleSize, MAX_DOGS_PER_GROUP);
    
    for (let dogIndex = 0; dogIndex < numDogs; dogIndex++) {
      const dogId = `${grupo}_dog_${dogIndex + 1}`;
      const dogCharacteristics = generateDogCharacteristics(dogId, grupo);
      
      // Filtrar por raça se necessário
      if (selectedBreed && selectedBreed !== 'todas' && dogCharacteristics.raca !== selectedBreed) {
        continue;
      }
      
      // Gerar pontos para todos os timepoints
      aggregatedData.forEach((timeData, timeIndex) => {
        const meanValue = grupo === 'controle' ? timeData.control :
                         grupo === 'dapagliflozina' ? timeData.dapagliflozin : timeData.empagliflozin;
        
        const value = calculateProgressionValue(dogCharacteristics, timeIndex, meanValue, grupo);
        
        dogData.push({
          dogId,
          grupo: grupo as 'controle' | 'dapagliflozina' | 'empagliflozina',
          value,
          raca: dogCharacteristics.raca,
          idade: dogCharacteristics.idade,
          peso: dogCharacteristics.peso,
          sexo: dogCharacteristics.sexo,
          timePoint: timeIndex,
          timeLabel: timeData.label
        });
      });
    }
  });
  
  return dogData;
};

const CustomTooltip: React.FC<TooltipProps<number, string> & { highlightedDogId?: string }> = ({ 
  active, 
  payload, 
  label,
  highlightedDogId 
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DogDataPoint;
    const isHighlighted = highlightedDogId === data.dogId;
    
    return (
      <div className={`bg-background border border-border rounded-lg p-3 shadow-lg ${isHighlighted ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <Dog className="h-4 w-4 text-primary" />
          <span className="font-semibold">Cão #{data.dogId}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-3 w-3" />
            <span>Grupo: <span className="font-medium">{data.grupo}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span>Incidência: <span className="font-medium">{data.value.toFixed(1)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Tempo: <span className="font-medium">{data.timeLabel}</span></span>
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
  const [selectedBreed, setSelectedBreed] = useState<string>('todas');
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedDogId, setHighlightedDogId] = useState<string | null>(null);

  // Gerar dados para todos os timepoints
  const allScatterData = useMemo(() => {
    return generateAllTimePointsData(data, sampleSizes, selectedBreed);
  }, [data, sampleSizes, selectedBreed]);

  // Obter contagem de cães únicos por raça
  const breedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const uniqueDogs = new Set();
    
    allScatterData.forEach(dog => {
      const key = `${dog.dogId}_${dog.raca}`;
      if (!uniqueDogs.has(key)) {
        uniqueDogs.add(key);
        counts[dog.raca] = (counts[dog.raca] || 0) + 1;
      }
    });
    return counts;
  }, [allScatterData]);

  // Raças disponíveis ordenadas por frequência
  const availableBreeds = useMemo(() => {
    const uniqueBreeds = Array.from(new Set(allScatterData.map(dog => dog.raca)));
    return uniqueBreeds.sort((a, b) => (breedCounts[b] || 0) - (breedCounts[a] || 0));
  }, [allScatterData, breedCounts]);

  // Handler para mudança de raça com loading
  const handleBreedChange = useCallback(async (breed: string) => {
    setIsLoading(true);
    setHighlightedDogId(null);
    
    // Simular processamento (delay realístico)
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setSelectedBreed(breed);
    setIsLoading(false);
  }, []);

  // Handlers para hover
  const handleMouseEnter = useCallback((data: DogDataPoint) => {
    setHighlightedDogId(data.dogId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHighlightedDogId(null);
  }, []);

  // Cores padronizadas (iguais aos gráficos de linha)
  const grupoCores = {
    controle: '#3b82f6',     // blue-500
    dapagliflozina: '#10b981', // emerald-500
    empagliflozina: '#f59e0b'  // amber-500
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
                Todas as raças ({Object.values(breedCounts).reduce((sum: number, count: number) => sum + count, 0)} cães)
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
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number" 
                dataKey="timePoint" 
                domain={[0, data.length - 1]}
                ticks={data.map((_, index) => index)}
                tickFormatter={(value) => data[value]?.label || ''}
                tick={{ fontSize: 10 }}
                label={{ value: 'Tempo', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="value"
                domain={[0, 100]}
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip highlightedDogId={highlightedDogId} />} />
              
              {/* Scatter plots por grupo com destaque para cão selecionado */}
              <Scatter 
                name="Controle" 
                data={allScatterData.filter(d => d.grupo === 'controle')} 
                fill={grupoCores.controle}
                fillOpacity={0.6}
                stroke={grupoCores.controle}
                strokeWidth={1}
              />
              <Scatter 
                name="Dapagliflozina" 
                data={allScatterData.filter(d => d.grupo === 'dapagliflozina')} 
                fill={grupoCores.dapagliflozina}
                fillOpacity={0.6}
                stroke={grupoCores.dapagliflozina}
                strokeWidth={1}
              />
              <Scatter 
                name="Empagliflozina" 
                data={allScatterData.filter(d => d.grupo === 'empagliflozina')} 
                fill={grupoCores.empagliflozina}
                fillOpacity={0.6}
                stroke={grupoCores.empagliflozina}
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas globais */}
        <div className="mt-4 pt-4 border-t border-border">
          {selectedBreed !== 'todas' && (
            <div className="mb-3 p-2 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-center">
                Visualizando apenas: <span className="text-primary">{selectedBreed}</span>
                <div className="text-xs text-muted-foreground mt-1">
                  {Object.values(breedCounts).reduce((sum: number, count: number) => sum + count, 0)} cães desta raça ao longo de {data.length} timepoints
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-medium text-blue-600">Controle</div>
              <div>{new Set(allScatterData.filter(d => d.grupo === 'controle').map(d => d.dogId)).size} cães</div>
              <div>Baseline: {data[0]?.control.toFixed(1)}%</div>
              <div>Final: {data[data.length - 1]?.control.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-emerald-600">Dapagliflozina</div>
              <div>{new Set(allScatterData.filter(d => d.grupo === 'dapagliflozina').map(d => d.dogId)).size} cães</div>
              <div>Baseline: {data[0]?.dapagliflozin.toFixed(1)}%</div>
              <div>Final: {data[data.length - 1]?.dapagliflozin.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-amber-600">Empagliflozina</div>
              <div>{new Set(allScatterData.filter(d => d.grupo === 'empagliflozina').map(d => d.dogId)).size} cães</div>
              <div>Baseline: {data[0]?.empagliflozin.toFixed(1)}%</div>
              <div>Final: {data[data.length - 1]?.empagliflozin.toFixed(1)}%</div>
            </div>
          </div>
          
          {highlightedDogId && (
            <div className="mt-3 p-2 bg-primary/10 rounded-lg">
              <div className="text-sm font-medium text-center text-primary">
                Mouse sobre o cão: <span className="font-bold">{highlightedDogId}</span>
                <div className="text-xs text-muted-foreground mt-1">
                  Todos os pontos deste animal estão destacados
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IndividualScatterPlot;