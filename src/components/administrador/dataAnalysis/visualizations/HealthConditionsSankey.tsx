
import React, { useState } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Sankey, Tooltip } from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Info
} from "lucide-react";

interface SankeyNode {
  name: string;
  category: string;
  value?: number;
  itemStyle?: {
    color: string;
  };
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  sourceName?: string;
  targetName?: string;
}

interface HealthConditionsSankeyProps {
  height?: number;
}

// Cores base para as categorias
const CATEGORY_COLORS = {
  species: '#3b82f6',      // Azul
  breed: '#10b981',        // Verde
  condition: '#f59e0b',    // Amarelo
  severity: '#ef4444'      // Vermelho
};

// Mock data para o diagrama Sankey
const generateSankeyData = () => {
  const nodes: SankeyNode[] = [
    // Espécies
    { name: 'Cães', category: 'species', itemStyle: { color: CATEGORY_COLORS.species } },
    { name: 'Gatos', category: 'species', itemStyle: { color: CATEGORY_COLORS.species } },
    
    // Raças principais
    { name: 'SRD (Cães)', category: 'breed', itemStyle: { color: CATEGORY_COLORS.breed } },
    { name: 'Golden', category: 'breed', itemStyle: { color: CATEGORY_COLORS.breed } },
    { name: 'Bulldog Francês', category: 'breed', itemStyle: { color: CATEGORY_COLORS.breed } },
    { name: 'SRD (Gatos)', category: 'breed', itemStyle: { color: CATEGORY_COLORS.breed } },
    { name: 'Siamês', category: 'breed', itemStyle: { color: CATEGORY_COLORS.breed } },
    { name: 'Outras Raças', category: 'breed', itemStyle: { color: CATEGORY_COLORS.breed } },
    
    // Condições
    { name: 'Saudável', category: 'condition', itemStyle: { color: '#4caf50' } },
    { name: 'Artrite', category: 'condition', itemStyle: { color: CATEGORY_COLORS.condition } },
    { name: 'Obesidade', category: 'condition', itemStyle: { color: CATEGORY_COLORS.condition } },
    { name: 'Problemas Cardíacos', category: 'condition', itemStyle: { color: CATEGORY_COLORS.condition } },
    { name: 'Alergias', category: 'condition', itemStyle: { color: CATEGORY_COLORS.condition } },
    { name: 'Problemas Renais', category: 'condition', itemStyle: { color: CATEGORY_COLORS.condition } },
    { name: 'Diabetes', category: 'condition', itemStyle: { color: CATEGORY_COLORS.condition } },
    
    // Severidade
    { name: 'Leve', category: 'severity', itemStyle: { color: '#66bb6a' } },
    { name: 'Moderada', category: 'severity', itemStyle: { color: '#ffb74d' } },
    { name: 'Grave', category: 'severity', itemStyle: { color: '#ef5350' } }
  ];

  const links: SankeyLink[] = [
    // Cães para raças
    { source: 0, target: 2, value: 650 },
    { source: 0, target: 3, value: 230 },
    { source: 0, target: 4, value: 180 },
    { source: 0, target: 7, value: 500 },
    
    // Gatos para raças
    { source: 1, target: 5, value: 540 },
    { source: 1, target: 6, value: 110 },
    { source: 1, target: 7, value: 80 },
    
    // SRD (Cães) para condições
    { source: 2, target: 8, value: 200 },
    { source: 2, target: 9, value: 120 },
    { source: 2, target: 10, value: 150 },
    { source: 2, target: 11, value: 80 },
    { source: 2, target: 12, value: 100 },
    
    // Golden para condições
    { source: 3, target: 8, value: 50 },
    { source: 3, target: 9, value: 70 },
    { source: 3, target: 11, value: 60 },
    { source: 3, target: 12, value: 50 },
    
    // Bulldog Francês para condições
    { source: 4, target: 8, value: 35 },
    { source: 4, target: 12, value: 75 },
    { source: 4, target: 13, value: 40 },
    { source: 4, target: 14, value: 30 },
    
    // SRD (Gatos) para condições
    { source: 5, target: 8, value: 190 },
    { source: 5, target: 10, value: 120 },
    { source: 5, target: 13, value: 130 },
    { source: 5, target: 14, value: 100 },
    
    // Siamês para condições
    { source: 6, target: 8, value: 40 },
    { source: 6, target: 13, value: 40 },
    { source: 6, target: 14, value: 30 },
    
    // Outras raças para condições
    { source: 7, target: 8, value: 180 },
    { source: 7, target: 9, value: 90 },
    { source: 7, target: 10, value: 110 },
    { source: 7, target: 11, value: 80 },
    { source: 7, target: 12, value: 60 },
    { source: 7, target: 13, value: 30 },
    { source: 7, target: 14, value: 30 },
    
    // Condições para severidade
    { source: 9, target: 15, value: 80 }, // Artrite Leve
    { source: 9, target: 16, value: 150 }, // Artrite Moderada
    { source: 9, target: 17, value: 50 }, // Artrite Grave
    
    { source: 10, target: 15, value: 130 }, // Obesidade Leve
    { source: 10, target: 16, value: 180 }, // Obesidade Moderada
    { source: 10, target: 17, value: 70 }, // Obesidade Grave
    
    { source: 11, target: 15, value: 40 }, // Problemas Cardíacos Leve
    { source: 11, target: 16, value: 100 }, // Problemas Cardíacos Moderada
    { source: 11, target: 17, value: 80 }, // Problemas Cardíacos Grave
    
    { source: 12, target: 15, value: 130 }, // Alergias Leve
    { source: 12, target: 16, value: 110 }, // Alergias Moderada
    { source: 12, target: 17, value: 45 }, // Alergias Grave
    
    { source: 13, target: 15, value: 60 }, // Problemas Renais Leve
    { source: 13, target: 16, value: 90 }, // Problemas Renais Moderada
    { source: 13, target: 17, value: 90 }, // Problemas Renais Grave
    
    { source: 14, target: 15, value: 35 }, // Diabetes Leve
    { source: 14, target: 16, value: 70 }, // Diabetes Moderada
    { source: 14, target: 17, value: 55 }, // Diabetes Grave
  ];

  // Adicionar nomes de origem e destino para o tooltip
  links.forEach(link => {
    link.sourceName = nodes[link.source].name;
    link.targetName = nodes[link.target].name;
  });

  return { nodes, links };
};

const HealthConditionsSankey: React.FC<HealthConditionsSankeyProps> = ({ height = 400 }) => {
  const [scale, setScale] = useState(1);
  const [filter, setFilter] = useState("all");
  const [sankeyData, setSankeyData] = useState(generateSankeyData());
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    // Aqui você pode implementar a lógica para filtrar os dados do Sankey
    // Por ora, apenas reseta para os dados originais
    setSankeyData(generateSankeyData());
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{data.sourceName} → {data.targetName}</p>
          <p>Quantidade: <span className="font-medium">{data.value} pets</span></p>
          <p className="text-xs text-gray-500 mt-1">Clique para ver detalhes</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Select defaultValue="all" onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas condições</SelectItem>
              <SelectItem value="dogs">Somente cães</SelectItem>
              <SelectItem value="cats">Somente gatos</SelectItem>
              <SelectItem value="senior">Pets sênior (7+ anos)</SelectItem>
              <SelectItem value="young">Pets jovens (< 3 anos)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Reduzir">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Ampliar">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset} title="Resetar">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Espécies
        </Badge>
        <Badge className="bg-green-100 text-green-700 border-green-200">
          Raças
        </Badge>
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Condições
        </Badge>
        <Badge className="bg-red-100 text-red-700 border-red-200">
          Severidade
        </Badge>
      </div>
      
      <div 
        style={{ 
          height, 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left', 
          transition: 'transform 0.3s ease'
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            node={{ 
              stroke: "#fff",
              strokeWidth: 2,
              onClick: (nodeData) => {
                console.log('Node clicked:', nodeData);
              }
            }}
            link={{
              stroke: "#77c878",
              strokeOpacity: 0.2,
              fill: "#8884d8", 
              fillOpacity: 0.3,
              onClick: (linkData) => {
                console.log('Link clicked:', linkData);
              }
            }}
            margin={{
              left: 20,
              right: 20,
              top: 20,
              bottom: 20,
            }}
          >
            <Tooltip content={<CustomTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 flex justify-between text-xs text-gray-500 items-center">
        <span className="flex items-center">
          <Info className="h-3 w-3 mr-1" /> 
          O diagrama mostra fluxos de pets desde espécie até severidade de condições
        </span>
        <span>Escala atual: {Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
};

export default HealthConditionsSankey;
