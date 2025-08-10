import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/feedback";
import { Dog, Calendar, Weight, Stethoscope, Users, Settings } from "lucide-react";
import { useDebounce } from "@/hooks/performance/useDebounce";
import { useOptimizedMultiState } from "@/hooks/performance/useOptimizedState";

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

// Constantes para estudo observacional (18 meses = 540 dias)
const STUDY_DURATION_DAYS = 540;
const MIN_VISITS_PER_DOG = 2;
const MAX_VISITS_PER_DOG = 8;
const MIN_INTERVAL_BETWEEN_VISITS = 30;

const generateAllTimePointsData = (
  aggregatedData: Array<{label: string; control: number; dapagliflozin: number; empagliflozin: number}>,
  sampleSizes: {controle: number; dapa: number; empa: number},
  selectedBreed?: string
): DogDataPoint[] => {
  const dogData: DogDataPoint[] = [];
  
  // Número máximo de cães por grupo baseado no filtro e configuração
  const getMaxDogsPerGroup = (breed?: string) => {
    if (breed && breed !== 'todas') return 200; // Raça específica: até 200
    return 100; // Todas as raças: até 100 por grupo (300 total)
  };
  
  const MAX_DOGS_PER_GROUP = getMaxDogsPerGroup(selectedBreed);
  
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
  
  // Função para gerar dados de consultas aleatórias para estudo observacional
  const generateRandomVisitData = (grupo: string, dogCharacteristics: any, dogIndex: number, aggregatedData: any[]) => {
    const visitData: DogDataPoint[] = [];
    
    // Número aleatório de consultas por cão
    const numVisits = Math.floor(Math.random() * (MAX_VISITS_PER_DOG - MIN_VISITS_PER_DOG + 1)) + MIN_VISITS_PER_DOG;
    
    // Gerar datas de consulta aleatórias
    const visitDates: number[] = [];
    for (let i = 0; i < numVisits; i++) {
      let date;
      do {
        date = Math.floor(Math.random() * STUDY_DURATION_DAYS);
      } while (visitDates.some(existing => Math.abs(existing - date) < MIN_INTERVAL_BETWEEN_VISITS));
      visitDates.push(date);
    }
    visitDates.sort((a, b) => a - b);
    
    // Baseline individual baseado no grupo
    let baseline;
    if (grupo === 'controle') {
      baseline = Math.random() * 15; // 0-15% baseline variável
    } else {
      baseline = Math.random() * 20; // 0-20% baseline variável para grupos tratamento
    }
    
    // Fator de resposta individual
    const responseFactor = 0.5 + Math.random() * 1.0;
    const ageFactor = dogCharacteristics.idade > 8 ? 0.8 : 1.0;
    
    // Determinar quando o tratamento começou (pode ser após a primeira consulta)
    const treatmentStartDay = grupo === 'controle' ? -1 : Math.floor(Math.random() * (STUDY_DURATION_DAYS * 0.3));
    
    visitDates.forEach((visitDay, visitIndex) => {
      // Calcular valor esperado baseado no tempo e se está em tratamento
      let expectedValue = baseline;
      
      if (grupo !== 'controle' && visitDay >= treatmentStartDay) {
        // Aplicar efeito do tratamento baseado no tempo desde início do tratamento
        const daysSinceTreatment = visitDay - treatmentStartDay;
        const treatmentProgress = Math.min(1, daysSinceTreatment / 180); // Efeito máximo em 6 meses
        
        // Usar dados agregados como referência para o efeito esperado
        const timePointIndex = Math.min(
          aggregatedData.length - 1,
          Math.floor((visitDay / STUDY_DURATION_DAYS) * aggregatedData.length)
        );
        const targetMean = grupo === 'dapagliflozina' 
          ? aggregatedData[timePointIndex].dapagliflozin 
          : aggregatedData[timePointIndex].empagliflozin;
        
        const maxImprovement = targetMean - baseline;
        expectedValue = baseline + (maxImprovement * treatmentProgress * responseFactor * ageFactor);
      } else {
        // Progressão natural da doença (pode piorar ligeiramente ao longo do tempo)
        const naturalProgression = (visitDay / STUDY_DURATION_DAYS) * Math.random() * 5; // 0-5% piora
        expectedValue = baseline + naturalProgression;
      }
      
      // Adicionar variabilidade individual
      const noise = (Math.random() - 0.5) * 15; // ±7.5%
      let finalValue = expectedValue + noise;
      
      // Limitar entre 0 e 100
      finalValue = Math.max(0, Math.min(100, finalValue));
      
      visitData.push({
        id: `${grupo}_dog_${dogIndex + 1}_visit_${visitIndex}`,
        dogId: `${grupo}_dog_${dogIndex + 1}`,
        grupo: grupo as 'controle' | 'dapagliflozina' | 'empagliflozina',
        value: finalValue,
        month: `${Math.floor(visitDay / 30.44)}m ${Math.floor(visitDay % 30.44)}d`, // Aproximação mês/dia
        raca: dogCharacteristics.raca,
        idade: dogCharacteristics.idade,
        peso: dogCharacteristics.peso,
        sexo: dogCharacteristics.sexo,
        timePoint: visitIndex,
        daysSinceStart: visitDay
      });
    });
    
    return visitData;
  };
  
  // Gerar dados para cada grupo com consultas aleatórias
  ['controle', 'dapagliflozina', 'empagliflozina'].forEach(grupo => {
    const groupSize = grupo === 'controle' ? sampleSizes.controle :
                     grupo === 'dapagliflozina' ? sampleSizes.dapa : sampleSizes.empa;
    
    const actualSize = Math.min(groupSize, MAX_DOGS_PER_GROUP);
    
    for (let dogIndex = 0; dogIndex < actualSize; dogIndex++) {
      const dogCharacteristics = generateDogCharacteristics(grupo, dogIndex);
      const visitData = generateRandomVisitData(grupo, dogCharacteristics, dogIndex, aggregatedData);
      dogData.push(...visitData);
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
  const [maxDogsPerGroup, setMaxDogsPerGroup] = useState<number>(100);
  const [showControls, setShowControls] = useState(false);
  
  // Otimização: debounce do hover para reduzir re-renders
  const debouncedHoveredDogId = useDebounce(hoveredDogId, 50);
  
  // Estado otimizado para configurações
  const { state: config, updateField } = useOptimizedMultiState({
    densityMode: false,
    showStatistics: true,
    enableHover: true
  }, 100);

  // Gerar todos os dados temporais de uma vez com otimização
  const allTimePointsData = useMemo(() => {
    const customSampleSizes = {
      controle: Math.min(sampleSizes.controle, maxDogsPerGroup),
      dapa: Math.min(sampleSizes.dapa, maxDogsPerGroup),
      empa: Math.min(sampleSizes.empa, maxDogsPerGroup)
    };
    return generateAllTimePointsData(data, customSampleSizes, selectedBreed);
  }, [data, sampleSizes, selectedBreed, maxDogsPerGroup]);

  // Filtrar dados por raça se selecionada
  const filteredData = useMemo(() => {
    if (selectedBreed === 'todas') return allTimePointsData;
    return allTimePointsData.filter(dog => dog.raca === selectedBreed);
  }, [allTimePointsData, selectedBreed]);

  // Obter contagem de cães únicos por raça (otimizado com cache)
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

  // Handler para mudança de raça com loading otimizado
  const handleBreedChange = useCallback(async (breed: string) => {
    setIsLoading(true);
    // Delay menor para grandes volumes
    await new Promise(resolve => setTimeout(resolve, 150));
    setSelectedBreed(breed);
    setIsLoading(false);
  }, []);
  
  // Handler otimizado para hover
  const handleMouseEnter = useCallback((data: any) => {
    if (config.enableHover) {
      setHoveredDogId(data.dogId);
    }
  }, [config.enableHover]);
  
  const handleMouseLeave = useCallback(() => {
    if (config.enableHover) {
      setHoveredDogId(null);
    }
  }, [config.enableHover]);
  
  // Calcular estatísticas de performance
  const performanceStats = useMemo(() => {
    const totalPoints = filteredData.length;
    const uniqueDogs = new Set(filteredData.map(d => d.dogId)).size;
    return { totalPoints, uniqueDogs };
  }, [filteredData]);

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
        
        {/* Controles de Visualização */}
        <div className="space-y-4 pt-3 border-t border-border/50">
          {/* Filtros e Estatísticas de Performance */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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
              
              {isLoading && <LoadingSpinner className="text-primary" />}
            </div>
            
            {/* Performance Stats */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {performanceStats.uniqueDogs} cães
              </Badge>
              <Badge variant="outline" className="text-xs">
                {performanceStats.totalPoints} pontos
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowControls(!showControls)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Controles Avançados */}
          {showControls && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Controle de Volume */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Máximo de cães por grupo: {maxDogsPerGroup}
                  </label>
                  <Slider
                    value={[maxDogsPerGroup]}
                    onValueChange={(value) => setMaxDogsPerGroup(value[0])}
                    max={500}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10</span>
                    <span>500</span>
                  </div>
                </div>
                
                {/* Modo Densidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visualização</label>
                  <div className="flex gap-2">
                    <Button
                      variant={config.densityMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField('densityMode', !config.densityMode)}
                    >
                      Modo Densidade
                    </Button>
                  </div>
                </div>
                
                {/* Toggle Hover */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interações</label>
                  <div className="flex gap-2">
                    <Button
                      variant={config.enableHover ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateField('enableHover', !config.enableHover)}
                    >
                      Hover
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 30, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              
              {/* Eixo X temporal contínuo */}
              <XAxis 
                type="number" 
                dataKey="daysSinceStart"
                domain={[0, STUDY_DURATION_DAYS]}
                ticks={[0, 90, 180, 270, 360, 450, 540]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value === 0) return '0m';
                  const months = Math.round(value / 30.44);
                  return `${months}m`;
                }}
                label={{ value: 'Tempo de Estudo (meses)', position: 'insideBottom', offset: -5 }}
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
              
              {/* Scatter plots por grupo com otimizações de performance */}
              <Scatter 
                name="Controle" 
                data={filteredData.filter(d => d.grupo === 'controle')} 
                fill={grupoCores.controle}
                fillOpacity={debouncedHoveredDogId ? 0.3 : (config.densityMode ? 0.5 : 0.7)}
                stroke={grupoCores.controle}
                strokeWidth={config.densityMode ? 0 : 1}
                r={config.densityMode ? 2 : 4}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
              <Scatter 
                name="Dapagliflozina" 
                data={filteredData.filter(d => d.grupo === 'dapagliflozina')} 
                fill={grupoCores.dapagliflozina}
                fillOpacity={debouncedHoveredDogId ? 0.3 : (config.densityMode ? 0.5 : 0.7)}
                stroke={grupoCores.dapagliflozina}
                strokeWidth={config.densityMode ? 0 : 1}
                r={config.densityMode ? 2 : 4}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
              <Scatter 
                name="Empagliflozina" 
                data={filteredData.filter(d => d.grupo === 'empagliflozina')} 
                fill={grupoCores.empagliflozina}
                fillOpacity={debouncedHoveredDogId ? 0.3 : (config.densityMode ? 0.5 : 0.7)}
                stroke={grupoCores.empagliflozina}
                strokeWidth={config.densityMode ? 0 : 1}
                r={config.densityMode ? 2 : 4}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
              
              {/* Destaque para o cão em hover (otimizado) */}
              {debouncedHoveredDogId && config.enableHover && (
                <Scatter 
                  name="Destacado"
                  data={filteredData.filter(d => d.dogId === debouncedHoveredDogId)}
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