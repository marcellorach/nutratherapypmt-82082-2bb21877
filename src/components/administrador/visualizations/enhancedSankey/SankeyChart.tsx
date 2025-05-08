
import React from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import SankeyTooltip from '../sankey/SankeyTooltip';
import { SankeyData } from '../sankey/types';

interface SankeyChartProps {
  data: SankeyData;  // Dados já convertidos para o formato correto
  height: number;
  scale: number;
  onNodeClick: (e: any) => void;
  onLinkClick: (e: any) => void;
}

const SankeyChart: React.FC<SankeyChartProps> = ({ 
  data, 
  height, 
  scale,
  onNodeClick,
  onLinkClick
}) => {
  return (
    <div 
      className="overflow-auto relative border rounded-lg bg-white" 
      style={{ 
        height: height || 500, 
        transition: 'transform 0.3s ease'
      }}
    >
      <div
        className="min-w-full min-h-full"
        style={{
          transformOrigin: 'center center',
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease'
        }}
      >
        <ResponsiveContainer width="100%" height={height || 500}>
          <Sankey
            data={data}
            nodeWidth={20}
            nodePadding={50}
            linkCurvature={0.5}
            iterations={64}
            node={{
              stroke: "#fff",
              strokeWidth: 1,
              onClick: onNodeClick,
              className: "cursor-pointer hover:opacity-80 transition-opacity"
            }}
            link={{
              stroke: "#77c878",
              strokeWidth: 2,
              fillOpacity: 0.8,
              onClick: onLinkClick,
              className: "cursor-pointer hover:opacity-80 transition-opacity"
            }}
            margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
          >
            <Tooltip content={<SankeyTooltip enhanced />} />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SankeyChart;
