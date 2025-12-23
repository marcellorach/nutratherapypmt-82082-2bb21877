import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Paleta de cores dos nós sincronizada com KnowledgeGraph3D.tsx
const NODE_COLORS: Record<string, string> = {
  nutraceutical: '#22c55e',
  compound: '#eab308',
  drug: '#3b82f6',
  condition: '#f97316',
  disease: '#991b1b',
  mechanism: '#1e3a5f',
  effect: '#06b6d4',
  biological_effect: '#71717a',
};

interface EdgeCategory {
  labelKey: string;
  descriptionKey: string;
  types: string[];
  symbol: 'arrow' | 'bar' | 'double' | 'line';
  color: string;
  dashed: boolean;
}

// Categorias de relações biológicas com símbolos padrão
const EDGE_CATEGORIES: Record<string, EdgeCategory> = {
  activation: {
    labelKey: 'legend.edges.activation',
    descriptionKey: 'legend.edgeDescriptions.activation',
    types: ['ACTIVATES', 'PROMOTES', 'TRIGGERS', 'UPREGULATES', 'INDUCES', 'TREATS', 'SUPPORTS'],
    symbol: 'arrow',
    color: '#22c55e',
    dashed: false,
  },
  inhibition: {
    labelKey: 'legend.edges.inhibition',
    descriptionKey: 'legend.edgeDescriptions.inhibition',
    types: ['INHIBITS', 'BLOCKS', 'DOWNREGULATES', 'SUPPRESSES', 'WORSENS', 'CONTRAINDICATED_FOR'],
    symbol: 'bar',
    color: '#dc2626',
    dashed: false,
  },
  modulation: {
    labelKey: 'legend.edges.modulation',
    descriptionKey: 'legend.edgeDescriptions.modulation',
    types: ['MODULATES', 'REGULATES'],
    symbol: 'arrow',
    color: '#f97316',
    dashed: true,
  },
  binding: {
    labelKey: 'legend.edges.binding',
    descriptionKey: 'legend.edgeDescriptions.binding',
    types: ['BINDS_TO'],
    symbol: 'double',
    color: '#3b82f6',
    dashed: false,
  },
  participation: {
    labelKey: 'legend.edges.participation',
    descriptionKey: 'legend.edgeDescriptions.participation',
    types: ['PARTICIPATES_IN', 'LEADS_TO', 'CAUSES'],
    symbol: 'arrow',
    color: '#a855f7',
    dashed: true,
  },
  association: {
    labelKey: 'legend.edges.association',
    descriptionKey: 'legend.edgeDescriptions.association',
    types: ['HAS_SYNONYM', 'IS_A', 'PREDISPOSED_TO', 'RELATED_TO'],
    symbol: 'line',
    color: '#eab308',
    dashed: false,
  },
};

interface BiologicalLegendProps {
  className?: string;
  compact?: boolean;
  showNodes?: boolean;
  showEdges?: boolean;
}

// Componente SVG para seta de ativação →
const ArrowSymbol: React.FC<{ color: string; dashed?: boolean }> = ({ color, dashed }) => (
  <svg width="40" height="12" viewBox="0 0 40 12" className="flex-shrink-0">
    <line
      x1="2"
      y1="6"
      x2="30"
      y2="6"
      stroke={color}
      strokeWidth="2"
      strokeDasharray={dashed ? '4 2' : undefined}
    />
    <polygon points="30,2 38,6 30,10" fill={color} />
  </svg>
);

// Componente SVG para barra de inibição ⊣
const BarSymbol: React.FC<{ color: string }> = ({ color }) => (
  <svg width="40" height="12" viewBox="0 0 40 12" className="flex-shrink-0">
    <line x1="2" y1="6" x2="30" y2="6" stroke={color} strokeWidth="2" />
    <line x1="32" y1="1" x2="32" y2="11" stroke={color} strokeWidth="3" />
  </svg>
);

// Componente SVG para seta dupla ⟷
const DoubleArrowSymbol: React.FC<{ color: string }> = ({ color }) => (
  <svg width="40" height="12" viewBox="0 0 40 12" className="flex-shrink-0">
    <polygon points="2,6 8,2 8,10" fill={color} />
    <line x1="8" y1="6" x2="32" y2="6" stroke={color} strokeWidth="2" />
    <polygon points="32,2 38,6 32,10" fill={color} />
  </svg>
);

// Componente SVG para linha simples ——
const LineSymbol: React.FC<{ color: string }> = ({ color }) => (
  <svg width="40" height="12" viewBox="0 0 40 12" className="flex-shrink-0">
    <line x1="2" y1="6" x2="38" y2="6" stroke={color} strokeWidth="2" />
  </svg>
);

// Renderiza o símbolo apropriado
const EdgeSymbol: React.FC<{ category: typeof EDGE_CATEGORIES[keyof typeof EDGE_CATEGORIES] }> = ({ category }) => {
  switch (category.symbol) {
    case 'arrow':
      return <ArrowSymbol color={category.color} dashed={category.dashed} />;
    case 'bar':
      return <BarSymbol color={category.color} />;
    case 'double':
      return <DoubleArrowSymbol color={category.color} />;
    case 'line':
      return <LineSymbol color={category.color} />;
    default:
      return <ArrowSymbol color={category.color} />;
  }
};

const BiologicalLegend: React.FC<BiologicalLegendProps> = ({
  className = '',
  compact = false,
  showNodes = true,
  showEdges = true,
}) => {
  const { t } = useTranslation();

  const nodeEntries = Object.entries(NODE_COLORS);
  const edgeEntries = Object.entries(EDGE_CATEGORIES);

  if (compact) {
    return (
      <TooltipProvider delayDuration={100}>
        <div className={`flex flex-wrap gap-2 text-xs bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 ${className}`}>
          {showNodes && nodeEntries.map(([type, color]) => (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-slate-600 cursor-help">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="capitalize">{t(`legend.nodes.${type}`, type)}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{t(`legend.nodeDescriptions.${type}`)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {showEdges && edgeEntries.map(([key, category]) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-slate-600 cursor-help">
                  <EdgeSymbol category={category} />
                  <span>{t(category.labelKey, key)}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{t(category.descriptionKey)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={`bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-slate-200 shadow-sm ${className}`}>
        {showNodes && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              {t('legend.nodesTitle', 'Nós')}
            </h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {nodeEntries.map(([type, color]) => (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 cursor-help hover:text-slate-900 transition-colors">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-300" 
                        style={{ backgroundColor: color }} 
                      />
                      <span className="capitalize">{t(`legend.nodes.${type}`, type)}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{t(`legend.nodeDescriptions.${type}`)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {showEdges && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              {t('legend.edgesTitle', 'Relações')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
              {edgeEntries.map(([key, category]) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-2 text-xs text-slate-600 cursor-help hover:text-slate-900 transition-colors">
                      <EdgeSymbol category={category} />
                      <span>{t(category.labelKey, key)}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{t(category.descriptionKey)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default BiologicalLegend;
