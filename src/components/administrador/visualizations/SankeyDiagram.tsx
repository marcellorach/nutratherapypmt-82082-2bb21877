
import React, { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';

interface SankeyNode {
  name: string;
  category: string;
  value?: number;
  color?: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color?: string;
  labelText?: string;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyDiagramProps {
  data: SankeyData;
  height?: number;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ data, height = 400 }) => {
  // Preparar cores baseadas na categoria
  const processedData = useMemo(() => {
    if (!data || !data.nodes || !data.links) {
      return { nodes: [], links: [] };
    }

    // Atribuir cores baseadas na categoria do nó
    const coloredNodes = data.nodes.map((node) => {
      let color;
      switch (node.category) {
        case 'nutraceutico':
          color = '#3b82f6'; // Azul para nutracêuticos
          break;
        case 'condicao':
          color = '#10b981'; // Verde para condições de saúde
          break;
        case 'efeito':
          color = '#f59e0b'; // Âmbar para efeitos
          break;
        default:
          color = '#6b7280'; // Cinza para outros
      }
      
      return {
        ...node,
        color: node.color || color,
      };
    });

    // Processar links para usar cores dos nós ou definir cores específicas
    const coloredLinks = data.links.map((link) => {
      return {
        ...link,
        color: link.color || `rgba(59, 130, 246, 0.4)`, // Cor padrão azul transparente
      };
    });

    return { nodes: coloredNodes, links: coloredLinks };
  }, [data]);

  const CustomTooltip = ({ payload }: any) => {
    if (!payload || !payload.length) return null;
    
    const item = payload[0];
    if (!item || !item.payload) return null;
    
    // Verificações de segurança para source e target
    const source = item.payload.source;
    const target = item.payload.target;
    const value = item.payload.value;
    
    if (!source || !target) return null;
    
    return (
      <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
        <p className="text-sm font-medium">
          <span className="text-blue-600">{source.name}</span>
          <span className="mx-1">→</span>
          <span className="text-green-600">{target.name}</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Eficácia: <span className="font-medium">{value}</span>
          {item.payload.labelText && <span className="block mt-1">{item.payload.labelText}</span>}
        </p>
      </div>
    );
  };

  if (!processedData.nodes.length || !processedData.links.length) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Não há dados suficientes para exibir o diagrama</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={processedData}
          nodePadding={30}
          nodeWidth={15}
          linkCurvature={0.5}
          iterations={64}
          node={{
            stroke: '#fff',
            strokeWidth: 1,
          }}
          link={{
            stroke: '#ddd',
          }}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Tooltip content={CustomTooltip} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

export default SankeyDiagram;
