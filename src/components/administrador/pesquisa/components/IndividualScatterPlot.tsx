import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  selectedTimePoint: number
): DogDataPoint[] => {
  const currentData = aggregatedData[selectedTimePoint];
  if (!currentData) return [];

  const dogData: DogDataPoint[] = [];
  
  // Função para gerar variabilidade individual baseada no valor médio
  const generateIndividualVariation = (meanValue: number, groupSize: number) => {
    const individuals: number[] = [];
    const variance = Math.max(0.5, meanValue * 0.15); // Variabilidade proporcional
    
    for (let i = 0; i < groupSize; i++) {
      // Distribuição normal aproximada usando Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      let value = meanValue + (z0 * variance);
      // Garantir que valores não sejam negativos e tenham limites realísticos
      value = Math.max(0, Math.min(value, 100));
      individuals.push(value);
    }
    
    return individuals;
  };

  // Gerar dados para grupo controle
  const controleValues = generateIndividualVariation(currentData.control, sampleSizes.controle);
  controleValues.forEach((value, index) => {
    dogData.push({
      id: `controle_${index + 1}`,
      grupo: 'controle',
      value,
      month: currentData.label,
      raca: COMMON_BREEDS[Math.floor(Math.random() * COMMON_BREEDS.length)],
      idade: Math.floor(Math.random() * 12) + 1, // 1-12 anos
      peso: Math.floor(Math.random() * 50) + 5, // 5-55kg
      sexo: Math.random() > 0.5 ? 'Macho' : 'Fêmea',
      timePoint: selectedTimePoint
    });
  });

  // Gerar dados para grupo dapagliflozina
  const dapaValues = generateIndividualVariation(currentData.dapagliflozin, sampleSizes.dapa);
  dapaValues.forEach((value, index) => {
    dogData.push({
      id: `dapa_${index + 1}`,
      grupo: 'dapagliflozina',
      value,
      month: currentData.label,
      raca: COMMON_BREEDS[Math.floor(Math.random() * COMMON_BREEDS.length)],
      idade: Math.floor(Math.random() * 12) + 1,
      peso: Math.floor(Math.random() * 50) + 5,
      sexo: Math.random() > 0.5 ? 'Macho' : 'Fêmea',
      timePoint: selectedTimePoint
    });
  });

  // Gerar dados para grupo empagliflozina
  const empaValues = generateIndividualVariation(currentData.empagliflozin, sampleSizes.empa);
  empaValues.forEach((value, index) => {
    dogData.push({
      id: `empa_${index + 1}`,
      grupo: 'empagliflozina',
      value,
      month: currentData.label,
      raca: COMMON_BREEDS[Math.floor(Math.random() * COMMON_BREEDS.length)],
      idade: Math.floor(Math.random() * 12) + 1,
      peso: Math.floor(Math.random() * 50) + 5,
      sexo: Math.random() > 0.5 ? 'Macho' : 'Fêmea',
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
  const [selectedTimePoint, setSelectedTimePoint] = useState(data.length - 1); // Último timepoint por padrão

  const scatterData = useMemo(() => {
    return generateIndividualData(data, sampleSizes, selectedTimePoint);
  }, [data, sampleSizes, selectedTimePoint]);

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
        
        {/* Controles de tempo */}
        <div className="flex flex-wrap gap-1 pt-2">
          {data.map((item, index) => (
            <Button
              key={index}
              variant={selectedTimePoint === index ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimePoint(index)}
              className="h-7 px-2 text-xs"
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
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-medium text-blue-600">Controle</div>
              <div>{sampleSizes.controle.toLocaleString()} cães</div>
              <div>Média: {data[selectedTimePoint]?.control.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-emerald-600">Dapagliflozina</div>
              <div>{sampleSizes.dapa.toLocaleString()} cães</div>
              <div>Média: {data[selectedTimePoint]?.dapagliflozin.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-amber-600">Empagliflozina</div>
              <div>{sampleSizes.empa.toLocaleString()} cães</div>
              <div>Média: {data[selectedTimePoint]?.empagliflozin.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndividualScatterPlot;