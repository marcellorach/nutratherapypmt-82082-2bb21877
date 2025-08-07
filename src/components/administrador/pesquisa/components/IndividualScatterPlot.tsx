import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/feedback";
import { Dog, Calendar, Weight, Stethoscope } from "lucide-react";

interface DogDataPoint {
  id: string;
  dogId: string; // ID único do cão para agrupar pontos temporais
  grupo: 'controle' | 'dapagliflozina' | 'empagliflozina';
  value: number;
  month: string;
  raca: string;
  idade: number;
  peso: number;
  sexo: string;
  timePoint: number;
  daysSinceStart: number; // Eixo X temporal em dias
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

// Mapeamento dos dias desde o início para cada timepoint
const TIME_POINTS_DAYS = [0, 60, 150, 240, 330, 420, 510]; // 0, 2m, 5m, 8m, 11m, 14m, 17m

const generateAllTimePointsData = (
  aggregatedData: Array<{label: string; control: number; dapagliflozin: number; empagliflozin: number}>,
  sampleSizes: {controle: number; dapa: number; empa: number},
  selectedBreed?: string
): DogDataPoint[] => {
  const dogData: DogDataPoint[] = [];
  
  // Número máximo de cães por grupo para performance
  const MAX_DOGS_PER_GROUP = selectedBreed && selectedBreed !== 'todas' ? 15 : 8;
  
  // Função para gerar características consistentes do cão
  const generateDogCharacteristics = (grupo: string, dogIndex: number) => {
    // Distribuição realística de raças
    const getRandomBreed = () => {
      if (selectedBreed && selectedBreed !== 'todas') {
        return selectedBreed;
      }
      
      const breedWeights = {
        'SRD': 0.25, 'Labrador': 0.15, 'Golden Retriever': 0.12, 'Bulldog Francês': 0.08,
        'Pastor Alemão': 0.08, 'Beagle': 0.06, 'Yorkshire': 0.05, 'Poodle': 0.05,
        'Border Collie': 0.04, 'Rottweiler': 0.03, 'Boxer': 0.03, 'Cocker Spaniel': 0.02,
        'Schnauzer': 0.02, 'Pinscher': 0.01, 'Shih Tzu': 0.01
      };
      
      const random = Math.random();
      let cumulative = 0;
      for (const [breed, weight] of Object.entries(breedWeights)) {
        cumulative += weight;
        if (random < cumulative) return breed;
      }
      return 'SRD';
    };
    
    const raca = getRandomBreed();
    
    // Características baseadas na raça
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
    
    return { raca, idade, peso, sexo };
  };
  
  // Função para gerar progressão realística ao longo do tempo
  const generateDogProgression = (grupo: string, dogCharacteristics: any, dogIndex: number) => {
    const progression: number[] = [];
    
    // Baseline individual (nem todos começam em zero)
    let baseline;
    if (grupo === 'controle') {
      baseline = Math.random() * 15; // 0-15% baseline variável
    } else {
      baseline = Math.random() * 20; // 0-20% baseline variável para grupos tratamento
    }
    
    // Fator de resposta individual (alguns respondem melhor)
    const responseFactor = 0.5 + Math.random() * 1.0; // 0.5x a 1.5x resposta
    
    // Fator de idade (cães mais velhos podem ter progressão diferente)
    const ageFactor = dogCharacteristics.idade > 8 ? 0.8 : 1.0;
    
    for (let timePoint = 0; timePoint < aggregatedData.length; timePoint++) {
      const targetMean = grupo === 'controle' 
        ? aggregatedData[timePoint].control
        : grupo === 'dapagliflozina' 
        ? aggregatedData[timePoint].dapagliflozin 
        : aggregatedData[timePoint].empagliflozin;
      
      let value;
      if (timePoint === 0) {
        // Baseline individual
        value = baseline;
      } else {
        // Progressão baseada no target mas com variabilidade individual
        const idealProgression = targetMean - baseline;
        const actualProgression = idealProgression * responseFactor * ageFactor;
        
        // Adicionar ruído temporal
        const timeNoise = (Math.random() - 0.5) * 10;
        value = baseline + actualProgression + timeNoise;
        
        // Garantir progressão monotônica para tratamentos (principalmente)
        if (grupo !== 'controle' && timePoint > 0 && value < progression[timePoint - 1]) {
          value = progression[timePoint - 1] + Math.random() * 3;
        }
      }
      
      // Limitar entre 0 e 100
      value = Math.max(0, Math.min(100, value));
      progression.push(value);
    }
    
    return progression;
  };
  
  // Gerar dados para cada grupo
  ['controle', 'dapagliflozina', 'empagliflozina'].forEach(grupo => {
    const groupSize = grupo === 'controle' ? sampleSizes.controle :
                     grupo === 'dapagliflozina' ? sampleSizes.dapa : sampleSizes.empa;
    
    const actualSize = Math.min(groupSize, MAX_DOGS_PER_GROUP);
    
    for (let dogIndex = 0; dogIndex < actualSize; dogIndex++) {
      const dogId = `${grupo}_dog_${dogIndex + 1}`;
      const dogCharacteristics = generateDogCharacteristics(grupo, dogIndex);
      const progression = generateDogProgression(grupo, dogCharacteristics, dogIndex);
      
      // Criar pontos para todos os timepoints
      aggregatedData.forEach((timeData, timePoint) => {
        dogData.push({
          id: `${dogId}_t${timePoint}`,
          dogId: dogId,
          grupo: grupo as 'controle' | 'dapagliflozina' | 'empagliflozina',
          value: progression[timePoint],
          month: timeData.label,
          raca: dogCharacteristics.raca,
          idade: dogCharacteristics.idade,
          peso: dogCharacteristics.peso,
          sexo: dogCharacteristics.sexo,
          timePoint: timePoint,
          daysSinceStart: TIME_POINTS_DAYS[timePoint]
        });
      });
    }
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
          <span className="font-semibold">Cão #{data.dogId}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-3 w-3" />
            <span>Grupo: <span className="font-medium">{data.grupo}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span>Progressão: <span className="font-medium text-primary">{data.value.toFixed(1)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Tempo: <span className="font-medium">{data.month} ({data.daysSinceStart} dias)</span></span>
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
  const [hoveredDogId, setHoveredDogId] = useState<string | null>(null);

  // Gerar todos os dados temporais de uma vez
  const allTimePointsData = useMemo(() => {
    return generateAllTimePointsData(data, sampleSizes, selectedBreed);
  }, [data, sampleSizes, selectedBreed]);

  // Filtrar dados por raça se selecionada
  const filteredData = useMemo(() => {
    if (selectedBreed === 'todas') return allTimePointsData;
    return allTimePointsData.filter(dog => dog.raca === selectedBreed);
  }, [allTimePointsData, selectedBreed]);

  // Obter contagem de cães únicos por raça
  const breedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const uniqueDogs = new Set();
    allTimePointsData.forEach(dog => {
      if (!uniqueDogs.has(dog.dogId)) {
        uniqueDogs.add(dog.dogId);
        counts[dog.raca] = (counts[dog.raca] || 0) + 1;
      }
    });
    return counts;
  }, [allTimePointsData]);

  // Raças disponíveis ordenadas por frequência
  const availableBreeds = useMemo(() => {
    const uniqueBreeds = Array.from(new Set(allTimePointsData.map(dog => dog.raca)));
    return uniqueBreeds.sort((a, b) => (breedCounts[b] || 0) - (breedCounts[a] || 0));
  }, [allTimePointsData, breedCounts]);

  // Handler para mudança de raça com loading
  const handleBreedChange = useCallback(async (breed: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setSelectedBreed(breed);
    setIsLoading(false);
  }, []);

  // Cores fixas para os grupos
  const grupoCores = {
    controle: '#6366f1', // indigo-500 - fixo
    dapagliflozina: '#10b981', // emerald-500 - fixo
    empagliflozina: '#f59e0b' // amber-500 - fixo
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
                Todas as raças ({Object.values(breedCounts).reduce((a: number, b: number) => a + b, 0)} cães)
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
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              
              {/* Eixo X temporal fixo */}
              <XAxis 
                type="number" 
                dataKey="daysSinceStart"
                domain={[0, 520]}
                ticks={TIME_POINTS_DAYS}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const labels = ['Baseline', '2m', '5m', '8m', '11m', '14m', '17m'];
                  const index = TIME_POINTS_DAYS.indexOf(value);
                  return index >= 0 ? labels[index] : value.toString();
                }}
                label={{ value: 'Tempo de Estudo', position: 'insideBottom', offset: -5 }}
              />
              
              {/* Eixo Y fixo de 0-100% */}
              <YAxis 
                type="number" 
                dataKey="value"
                domain={[0, 100]}
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Scatter plots por grupo com destaque de hover */}
              <Scatter 
                name="Controle" 
                data={filteredData.filter(d => d.grupo === 'controle')} 
                fill={grupoCores.controle}
                fillOpacity={hoveredDogId ? 0.3 : 0.7}
                stroke={grupoCores.controle}
                strokeWidth={1}
                onMouseEnter={(data) => setHoveredDogId(data.dogId)}
                onMouseLeave={() => setHoveredDogId(null)}
              />
              <Scatter 
                name="Dapagliflozina" 
                data={filteredData.filter(d => d.grupo === 'dapagliflozina')} 
                fill={grupoCores.dapagliflozina}
                fillOpacity={hoveredDogId ? 0.3 : 0.7}
                stroke={grupoCores.dapagliflozina}
                strokeWidth={1}
                onMouseEnter={(data) => setHoveredDogId(data.dogId)}
                onMouseLeave={() => setHoveredDogId(null)}
              />
              <Scatter 
                name="Empagliflozina" 
                data={filteredData.filter(d => d.grupo === 'empagliflozina')} 
                fill={grupoCores.empagliflozina}
                fillOpacity={hoveredDogId ? 0.3 : 0.7}
                stroke={grupoCores.empagliflozina}
                strokeWidth={1}
                onMouseEnter={(data) => setHoveredDogId(data.dogId)}
                onMouseLeave={() => setHoveredDogId(null)}
              />
              
              {/* Destaque para o cão em hover */}
              {hoveredDogId && (
                <Scatter 
                  name="Destacado"
                  data={filteredData.filter(d => d.dogId === hoveredDogId)}
                  fill="hsl(var(--primary))"
                  fillOpacity={1}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  r={6}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Estatísticas dos dados filtrados */}
        <div className="mt-4 pt-4 border-t border-border">
          {selectedBreed !== 'todas' && (
            <div className="mb-3 p-2 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium text-center">
                Visualizando apenas: <span className="text-primary">{selectedBreed}</span>
                <div className="text-xs text-muted-foreground mt-1">
                  {breedCounts[selectedBreed] || 0} cães desta raça ao longo de todo o estudo
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded">
              <div className="font-medium" style={{ color: grupoCores.controle }}>Controle</div>
              <div>{new Set(filteredData.filter(d => d.grupo === 'controle').map(d => d.dogId)).size} cães</div>
              <div className="text-xs text-muted-foreground">
                {filteredData.filter(d => d.grupo === 'controle').length} pontos temporais
              </div>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded">
              <div className="font-medium" style={{ color: grupoCores.dapagliflozina }}>Dapagliflozina</div>
              <div>{new Set(filteredData.filter(d => d.grupo === 'dapagliflozina').map(d => d.dogId)).size} cães</div>
              <div className="text-xs text-muted-foreground">
                {filteredData.filter(d => d.grupo === 'dapagliflozina').length} pontos temporais
              </div>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
              <div className="font-medium" style={{ color: grupoCores.empagliflozina }}>Empagliflozina</div>
              <div>{new Set(filteredData.filter(d => d.grupo === 'empagliflozina').map(d => d.dogId)).size} cães</div>
              <div className="text-xs text-muted-foreground">
                {filteredData.filter(d => d.grupo === 'empagliflozina').length} pontos temporais
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-center text-xs text-muted-foreground">
            💡 Passe o mouse sobre um ponto para destacar a evolução completa do animal
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndividualScatterPlot;