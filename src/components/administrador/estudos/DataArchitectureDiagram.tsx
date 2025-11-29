import React from 'react';
import { useTranslation } from 'react-i18next';

interface DataArchitectureDiagramProps {
  compact?: boolean;
}

const DataArchitectureDiagram: React.FC<DataArchitectureDiagramProps> = ({ compact = false }) => {
  const { t } = useTranslation();

  // Node definitions - adjusted for compact mode
  const scale = compact ? 0.7 : 1;
  const nodes = [
    { id: 'nutraceutical', x: 100 * scale, y: 100 * scale, color: 'hsl(var(--chart-2))', example: 'Curcuma' },
    { id: 'condition', x: 280 * scale, y: 100 * scale, color: 'hsl(var(--chart-1))', example: 'Arthritis' },
    { id: 'mechanism', x: 190 * scale, y: 35 * scale, color: 'hsl(var(--chart-3))', example: 'Anti-inflammatory' },
  ];

  const fullNodes = [
    ...nodes,
    { id: 'breed', x: 280, y: 200, color: 'hsl(var(--chart-5))', example: 'Labrador' },
    { id: 'species', x: 420, y: 100, color: 'hsl(var(--primary))', example: 'Canine' },
  ];

  const displayNodes = compact ? nodes : fullNodes;

  // Edge definitions
  const edges = compact ? [
    { from: 'nutraceutical', to: 'condition', label: t('studies.dataArchitecture.relations.treats'), curveDir: 0 },
    { from: 'nutraceutical', to: 'mechanism', label: t('studies.dataArchitecture.relations.modulates'), curveDir: -20 },
  ] : [
    { from: 'nutraceutical', to: 'condition', label: t('studies.dataArchitecture.relations.treats'), curveDir: 0 },
    { from: 'nutraceutical', to: 'mechanism', label: t('studies.dataArchitecture.relations.modulates'), curveDir: -30 },
    { from: 'breed', to: 'condition', label: t('studies.dataArchitecture.relations.predisposedTo'), curveDir: 20 },
    { from: 'condition', to: 'species', label: t('studies.dataArchitecture.relations.affects'), curveDir: 0 },
  ];

  const getNode = (id: string) => displayNodes.find(n => n.id === id)!;

  const getCurvedPath = (fromId: string, toId: string, curveOffset: number) => {
    const from = getNode(fromId);
    const to = getNode(toId);
    if (!from || !to) return '';
    const nodeWidth = compact ? 35 : 55;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2 + curveOffset;
    return `M ${from.x + nodeWidth} ${from.y} Q ${midX} ${midY} ${to.x - nodeWidth} ${to.y}`;
  };

  const getLabelPosition = (fromId: string, toId: string, curveOffset: number) => {
    const from = getNode(fromId);
    const to = getNode(toId);
    if (!from || !to) return { x: 0, y: 0 };
    return {
      x: (from.x + to.x) / 2 + (compact ? 15 : 25),
      y: (from.y + to.y) / 2 + curveOffset * 0.6
    };
  };

  const viewBox = compact ? "0 0 280 150" : "0 0 520 280";
  const nodeWidth = compact ? 70 : 110;
  const nodeHeight = compact ? 36 : 56;
  const fontSize = compact ? 8 : 11;
  const exampleFontSize = compact ? 7 : 10;

  return (
    <div className="w-full">
      <svg viewBox={viewBox} className="w-full h-auto" aria-label={t('studies.dataArchitecture.title')}>
        <rect width="100%" height="100%" fill="transparent" />
        
        <defs>
          <marker 
            id={`arrowhead-graph${compact ? '-compact' : ''}`}
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

        {/* Edges */}
        {edges.map((edge, index) => {
          const labelPos = getLabelPosition(edge.from, edge.to, edge.curveDir);
          const path = getCurvedPath(edge.from, edge.to, edge.curveDir);
          if (!path) return null;
          return (
            <g key={`edge-${index}`}>
              <path
                d={path}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={compact ? 1 : 1.5}
                strokeOpacity="0.5"
                markerEnd={`url(#arrowhead-graph${compact ? '-compact' : ''})`}
              />
              <rect
                x={labelPos.x - (compact ? 22 : 30)}
                y={labelPos.y - (compact ? 8 : 10)}
                width={compact ? 44 : 60}
                height={compact ? 12 : 16}
                rx="4"
                fill="hsl(var(--background))"
                fillOpacity="0.9"
              />
              <text
                x={labelPos.x}
                y={labelPos.y + (compact ? 1 : 2)}
                textAnchor="middle"
                className="fill-muted-foreground font-medium"
                style={{ fontSize: compact ? '7px' : '9px' }}
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {displayNodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x - nodeWidth / 2}
              y={node.y - nodeHeight / 2}
              width={nodeWidth}
              height={nodeHeight}
              rx={compact ? 6 : 10}
              fill={node.color}
              fillOpacity="0.12"
              stroke={node.color}
              strokeWidth={compact ? 1.5 : 2}
            />
            <text
              x={node.x}
              y={node.y - (compact ? 2 : 6)}
              textAnchor="middle"
              className="fill-foreground font-semibold"
              style={{ fontSize: `${fontSize}px` }}
            >
              {t(`studies.dataArchitecture.entities.${node.id}`)}
            </text>
            <text
              x={node.x}
              y={node.y + (compact ? 10 : 12)}
              textAnchor="middle"
              className="fill-muted-foreground italic"
              style={{ fontSize: `${exampleFontSize}px` }}
            >
              {t(`studies.dataArchitecture.examples.${node.id}`)}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend - only show in full mode */}
      {!compact && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium text-foreground">💡 Triplet: </span>
            {t('studies.dataArchitecture.tripletExplanation')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataArchitectureDiagram;
