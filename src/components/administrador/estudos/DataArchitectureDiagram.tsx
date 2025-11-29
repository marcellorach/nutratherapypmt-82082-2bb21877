import React from 'react';
import { useTranslation } from 'react-i18next';

const DataArchitectureDiagram: React.FC = () => {
  const { t } = useTranslation();

  // Entity types with colors
  const sourceEntities = [
    { id: 'nutraceutical', label: t('studies.dataArchitecture.entities.nutraceutical'), color: 'hsl(var(--chart-2))' },
    { id: 'drug', label: t('studies.dataArchitecture.entities.drug'), color: 'hsl(var(--chart-4))' },
    { id: 'breed', label: t('studies.dataArchitecture.entities.breed'), color: 'hsl(var(--chart-5))' },
  ];

  const targetEntities = [
    { id: 'condition', label: t('studies.dataArchitecture.entities.condition'), color: 'hsl(var(--chart-1))' },
    { id: 'mechanism', label: t('studies.dataArchitecture.entities.mechanism'), color: 'hsl(var(--chart-3))' },
    { id: 'species', label: t('studies.dataArchitecture.entities.species'), color: 'hsl(var(--primary))' },
  ];

  const relations = [
    t('studies.dataArchitecture.relations.treats'),
    t('studies.dataArchitecture.relations.modulates'),
    t('studies.dataArchitecture.relations.prevents'),
    t('studies.dataArchitecture.relations.affects'),
  ];

  return (
    <div className="w-full">
      <svg viewBox="0 0 600 280" className="w-full h-auto" aria-label={t('studies.dataArchitecture.title')}>
        {/* Background */}
        <rect width="600" height="280" fill="transparent" />
        
        {/* Column Labels */}
        <text x="80" y="24" textAnchor="middle" className="fill-muted-foreground text-xs font-medium">
          {t('studies.dataArchitecture.sourceLabel')}
        </text>
        <text x="300" y="24" textAnchor="middle" className="fill-muted-foreground text-xs font-medium">
          {t('studies.dataArchitecture.predicateLabel')}
        </text>
        <text x="520" y="24" textAnchor="middle" className="fill-muted-foreground text-xs font-medium">
          {t('studies.dataArchitecture.targetLabel')}
        </text>

        {/* Source Entities Column */}
        {sourceEntities.map((entity, index) => (
          <g key={entity.id}>
            <rect 
              x="20" 
              y={45 + index * 70} 
              width="120" 
              height="50" 
              rx="8" 
              fill={entity.color}
              fillOpacity="0.15"
              stroke={entity.color}
              strokeWidth="2"
            />
            <text 
              x="80" 
              y={75 + index * 70} 
              textAnchor="middle" 
              className="fill-foreground text-sm font-medium"
            >
              {entity.label}
            </text>
          </g>
        ))}

        {/* Relations/Predicates Column */}
        <rect 
          x="230" 
          y="45" 
          width="140" 
          height="190" 
          rx="12" 
          fill="hsl(var(--muted))"
          fillOpacity="0.5"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
        <text 
          x="300" 
          y="70" 
          textAnchor="middle" 
          className="fill-primary text-sm font-semibold"
        >
          Predicates
        </text>
        {relations.map((relation, index) => (
          <text 
            key={relation}
            x="300" 
            y={100 + index * 32} 
            textAnchor="middle" 
            className="fill-muted-foreground text-xs"
          >
            {relation}
          </text>
        ))}

        {/* Target Entities Column */}
        {targetEntities.map((entity, index) => (
          <g key={entity.id}>
            <rect 
              x="460" 
              y={45 + index * 70} 
              width="120" 
              height="50" 
              rx="8" 
              fill={entity.color}
              fillOpacity="0.15"
              stroke={entity.color}
              strokeWidth="2"
            />
            <text 
              x="520" 
              y={75 + index * 70} 
              textAnchor="middle" 
              className="fill-foreground text-sm font-medium"
            >
              {entity.label}
            </text>
          </g>
        ))}

        {/* Connection Lines - Source to Predicates */}
        {sourceEntities.map((entity, index) => (
          <line 
            key={`src-${entity.id}`}
            x1="140" 
            y1={70 + index * 70} 
            x2="230" 
            y2={140}
            stroke={entity.color}
            strokeWidth="1.5"
            strokeOpacity="0.4"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Connection Lines - Predicates to Target */}
        {targetEntities.map((entity, index) => (
          <line 
            key={`tgt-${entity.id}`}
            x1="370" 
            y1={140}
            x2="460" 
            y2={70 + index * 70} 
            stroke={entity.color}
            strokeWidth="1.5"
            strokeOpacity="0.4"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Arrow Marker Definition */}
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon 
              points="0 0, 10 3.5, 0 7" 
              fill="hsl(var(--muted-foreground))"
              fillOpacity="0.5"
            />
          </marker>
        </defs>
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
