
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface RaceComparisonChartProps {
  currentRace: string;
  condition: string;
}

const RaceComparisonChart: React.FC<RaceComparisonChartProps> = ({ 
  currentRace, 
  condition 
}) => {
  // Função para gerar dados de comparação de raças
  const generateRaceData = () => {
    const races = [currentRace];
    
    // Adicionar raças relacionadas com base na raça atual
    const raceGroups: Record<string, string[]> = {
      "Golden Retriever": ["Labrador Retriever", "Border Collie", "Pastor Alemão"],
      "Bulldog Francês": ["Pug", "Boston Terrier", "Buldogue Inglês"],
      "Chihuahua": ["Yorkshire Terrier", "Pinscher", "Shih Tzu"],
      "Pastor Alemão": ["Rottweiler", "Doberman", "Boxer"],
      "Poodle": ["Bichon Frisé", "Maltês", "Lhasa Apso"],
      "Beagle": ["Basset Hound", "Fox Terrier", "Jack Russell"]
    };
    
    // Encontrar grupo de raça mais próximo
    let raceGroup = Object.keys(raceGroups).find(r => 
      currentRace.toLowerCase().includes(r.toLowerCase()) || 
      r.toLowerCase().includes(currentRace.toLowerCase())
    ) || "Golden Retriever";
    
    // Adicionar outras raças do mesmo grupo para comparação
    races.push(...raceGroups[raceGroup as keyof typeof raceGroups].slice(0, 2));
    
    // Gerar média populacional
    races.push("Média populacional");
    
    return races.map((race, index) => {
      // Eficácia base - a raça atual deve ter o melhor resultado
      let baseEfficacy = race === currentRace ? 85 : 
                         race === "Média populacional" ? 65 : 
                         70 + Math.floor(Math.random() * 10);
      
      // Tempo de resposta - a raça atual deve ter o menor tempo
      let responseTime = race === currentRace ? 4.2 : 
                         race === "Média populacional" ? 6.3 : 
                         5 + Math.floor(Math.random() * 3);
      
      return {
        name: race,
        eficacia: baseEfficacy,
        tempo: responseTime,
        // Para destacar a raça atual
        isCurrent: race === currentRace
      };
    });
  };

  const data = generateRaceData();
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const isCurrent = payload[0].payload.isCurrent;
      
      return (
        <div className={`${isCurrent ? 'bg-blue-50' : 'bg-white'} p-3 border rounded shadow-sm`}>
          <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
            {label} {isCurrent ? '(Raça atual)' : ''}
          </p>
          <div className="space-y-2 mt-2">
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 inline-block bg-[#4caf50] mr-1 rounded-sm"></span> 
              <span>Taxa de eficácia: </span>
              <span className="font-medium ml-1">{`${payload[0].value}%`}</span>
            </p>
            <p className="text-xs flex items-center">
              <span className="w-3 h-3 inline-block bg-[#ff9800] mr-1 rounded-sm"></span>
              <span>Tempo de resposta: </span>
              <span className="font-medium ml-1">{`${payload[1].value} semanas`}</span>
            </p>
          </div>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="w-full h-60 bg-slate-50 p-3 rounded-md mt-2">
      <h4 className="font-medium mb-2 text-sm">Comparativo por raças - {condition}</h4>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tickFormatter={(value) => value === 0 ? '' : `${value}%`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120}
            tick={({ x, y, payload }) => {
              const isCurrent = data.find(d => d.name === payload.value)?.isCurrent;
              return (
                <text 
                  x={x} 
                  y={y} 
                  dy={4} 
                  textAnchor="end" 
                  fill={isCurrent ? "#2563eb" : "#374151"}
                  fontWeight={isCurrent ? "600" : "normal"}
                  fontSize={12}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            name="Taxa de eficácia" 
            dataKey="eficacia" 
            fill="#4caf50" 
            radius={[0, 4, 4, 0]}
            background={{ fill: '#eee' }}
          />
          <Bar 
            name="Tempo de resposta (semanas)" 
            dataKey="tempo" 
            fill="#ff9800" 
            radius={[0, 4, 4, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RaceComparisonChart;
