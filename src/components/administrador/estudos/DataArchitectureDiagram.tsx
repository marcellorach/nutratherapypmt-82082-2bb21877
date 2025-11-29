import React from 'react';
import { useTranslation } from 'react-i18next';

const DataArchitectureDiagram: React.FC = () => {
  const { t } = useTranslation();

  // Node definitions with positions for organic graph layout
  const nodes = [
    { id: 'nutraceutical', x: 100, y: 140, color: 'hsl(var(--chart-2))', example: 'Curcuma' },
    { id: 'condition', x: 320, y: 140, color: 'hsl(var(--chart-1))', example: 'Arthritis' },
    { id: 'mechanism', x: 210, y: 50, color: 'hsl(var(--chart-3))', example: 'Anti-inflammatory' },
    { id: 'breed', x: 320, y: 250, color: 'hsl(var(--chart-5))', example: 'Labrador' },
    { id: 'species', x: 500, y: 140, color: 'hsl(var(--primary))', example: 'Canine' },
  ];

  // Edge definitions with curved paths
  const edges = [
    { from: 'nutraceutical', to: 'condition', label: t('studies.dataArchitecture.relations.treats'), curveDir: 0 },
    { from: 'nutraceutical', to: 'mechanism', label: t('studies.dataArchitecture.relations.modulates'), curveDir: -30 },
    { from: 'breed', to: 'condition', label: t('studies.dataArchitecture.relations.predisposedTo'), curveDir: 20 },
    { from: 'condition', to: 'species', label: t('studies.dataArchitecture.relations.affects'), curveDir: 0 },
  ];

  // Get node by id
  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  // Calculate curved path between two nodes
  const getCurvedPath = (fromId: string, toId: string, curveOffset: number) => {
    const from = getNode(fromId);
    const to = getNode(toId);
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2 + curveOffset;
    return `M ${from.x + 55} ${from.y} Q ${midX} ${midY} ${to.x - 55} ${to.y}`;
  };

  // Calculate label position on curve
  const getLabelPosition = (fromId: string, toId: string, curveOffset: number) => {
    const from = getNode(fromId);
    const to = getNode(toId);
    return {
      x: (from.x + to.x) / 2 + 25,
      y: (from.y + to.y) / 2 + curveOffset * 0.6
    };
  };

  return (
    <div className="w-full">
      <svg viewBox="0 0 600 320" className="w-full h-auto" aria-label={t('studies.dataArchitecture.title')}>
        {/* Background */}
        <rect width="600" height="320" fill="transparent" />
        
        {/* Arrow Marker Definition */}
        <defs>
          <marker 
            id="arrowhead-graph" 
            markerWidth="8" 
            markerHeight="6" 
            refX="7" 
            refY="3" 
            orient="auto"
          >
            <polygon 
              points="0 0, 8 3, 0 6" 
              fill="hsl(var(--muted-foreground))"
              fillOpacity="0.7"
            />
          </marker>
        </defs>

        {/* Edges - Curved connections with labels */}
        {edges.map((edge, index) => {
          const labelPos = getLabelPosition(edge.from, edge.to, edge.curveDir);
          return (
            <g key={`edge-${index}`}>
              {/* Curved path */}
              <path
                d={getCurvedPath(edge.from, edge.to, edge.curveDir)}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                strokeOpacity="0.5"
                markerEnd="url(#arrowhead-graph)"
              />
              {/* Edge label background */}
              <rect
                x={labelPos.x - 30}
                y={labelPos.y - 10}
                width="60"
                height="16"
                rx="4"
                fill="hsl(var(--background))"
                fillOpacity="0.9"
              />
              {/* Edge label text */}
              <text
                x={labelPos.x}
                y={labelPos.y + 2}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] font-medium"
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes - Rounded rectangles with entity type and example */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Node background */}
            <rect
              x={node.x - 55}
              y={node.y - 28}
              width="110"
              height="56"
              rx="10"
              fill={node.color}
              fillOpacity="0.12"
              stroke={node.color}
              strokeWidth="2"
            />
            {/* Entity type label */}
            <text
              x={node.x}
              y={node.y - 6}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold"
            >
              {t(`studies.dataArchitecture.entities.${node.id}`)}
            </text>
            {/* Example value */}
            <text
              x={node.x}
              y={node.y + 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] italic"
            >
              {t(`studies.dataArchitecture.examples.${node.id}`)}
            </text>
          </g>
        ))}

        {/* Central highlight - main triplet example */}
        <g opacity="0.6">
          <rect
            x="95"
            y="118"
            width="280"
            height="44"
            rx="22"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4 3"
            strokeOpacity="0.4"
          />
        </g>
      </svg>

      {/* Legend / Explanation */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-medium text-foreground">💡 Triplet: </span>
          {t('studies.dataArchitecture.tripletExplanation')}
        </p>
      </div>
    </div>
  );
};

export default DataArchitectureDiagram;
