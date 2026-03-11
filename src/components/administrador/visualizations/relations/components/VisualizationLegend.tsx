
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// SVG symbols for biological notation
const ArrowSymbol: React.FC<{ color: string; dashed?: boolean }> = ({ color, dashed }) => (
  <svg width="36" height="12" viewBox="0 0 36 12" className="flex-shrink-0">
    <line x1="2" y1="6" x2="26" y2="6" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 2' : undefined} />
    <polygon points="26,2 34,6 26,10" fill={color} />
  </svg>
);

const BarSymbol: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="12" viewBox="0 0 36 12" className="flex-shrink-0">
    <line x1="2" y1="6" x2="26" y2="6" stroke={color} strokeWidth="2" />
    <line x1="28" y1="1" x2="28" y2="11" stroke={color} strokeWidth="3" />
  </svg>
);

const DoubleArrowSymbol: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="12" viewBox="0 0 36 12" className="flex-shrink-0">
    <polygon points="2,6 8,2 8,10" fill={color} />
    <line x1="8" y1="6" x2="28" y2="6" stroke={color} strokeWidth="2" />
    <polygon points="28,2 34,6 28,10" fill={color} />
  </svg>
);

const LineSymbol: React.FC<{ color: string }> = ({ color }) => (
  <svg width="36" height="12" viewBox="0 0 36 12" className="flex-shrink-0">
    <line x1="2" y1="6" x2="34" y2="6" stroke={color} strokeWidth="2" />
  </svg>
);

const VisualizationLegend: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <TooltipProvider delayDuration={100}>
      <div className="mt-4 bg-muted/50 rounded-lg border p-4">
        <div className="text-sm font-medium mb-3">{t('relations.legend.title')}</div>
        
        {/* Node types */}
        <div className="flex flex-wrap gap-3 text-xs mb-3">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#3b82f6' }} />
            <span>{t('relations.legend.nutraceutical')}</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#22c55e' }} />
            <span>{t('relations.legend.healthCondition')}</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#a855f7' }} />
            <span>{t('relations.legend.scientificStudy')}</span>
          </div>
        </div>

        {/* Biological relationship notation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <ArrowSymbol color="#22c55e" />
                <span>{t('relations.legend.activation', 'Ativação')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t('relations.legend.activationDesc', 'Ativa, promove, trata ou suporta')}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <BarSymbol color="#dc2626" />
                <span>{t('relations.legend.inhibition', 'Inibição')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t('relations.legend.inhibitionDesc', 'Inibe, bloqueia ou suprime')}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <ArrowSymbol color="#f97316" dashed />
                <span>{t('relations.legend.modulation', 'Modulação')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t('relations.legend.modulationDesc', 'Modula ou regula')}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <DoubleArrowSymbol color="#3b82f6" />
                <span>{t('relations.legend.binding', 'Ligação')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t('relations.legend.bindingDesc', 'Liga-se a receptor ou molécula')}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <ArrowSymbol color="#a855f7" dashed />
                <span>{t('relations.legend.participation', 'Participação')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t('relations.legend.participationDesc', 'Participa em, leva a, causa')}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <LineSymbol color="#eab308" />
                <span>{t('relations.legend.association', 'Associação')}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t('relations.legend.associationDesc', 'Sinônimo, é um tipo de, relacionado a')}</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Efficacy levels */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">{t('relations.legend.high')}</Badge>
            <span className="mx-1">→</span>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">{t('relations.legend.low')}</Badge>
            <span className="ml-1">{t('relations.legend.efficacyLevel')}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VisualizationLegend;
