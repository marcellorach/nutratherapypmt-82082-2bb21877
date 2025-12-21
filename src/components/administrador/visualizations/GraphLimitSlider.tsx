import React from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Gauge } from 'lucide-react';

interface GraphLimitSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

// Preset values for quick selection
const PRESETS = [
  { value: 100, label: '100', description: 'Fast - minimal data' },
  { value: 500, label: '500', description: 'Balanced - recommended' },
  { value: 1000, label: '1K', description: 'Detailed - may slow down' },
  { value: 2000, label: '2K', description: 'Full - for powerful machines' },
  { value: 5000, label: '5K', description: 'Maximum - requires good hardware' },
];

export const GraphLimitSlider: React.FC<GraphLimitSliderProps> = ({
  value,
  onChange,
  min = 50,
  max = 5000,
  step = 50,
}) => {
  const { t } = useTranslation();

  const getPerformanceIndicator = (val: number): { color: string; text: string } => {
    if (val <= 200) return { color: 'bg-green-500', text: t('knowledgeGraph.limit.fast', 'Fast') };
    if (val <= 500) return { color: 'bg-emerald-500', text: t('knowledgeGraph.limit.balanced', 'Balanced') };
    if (val <= 1000) return { color: 'bg-amber-500', text: t('knowledgeGraph.limit.moderate', 'Moderate') };
    if (val <= 2000) return { color: 'bg-orange-500', text: t('knowledgeGraph.limit.slow', 'Slow') };
    return { color: 'bg-red-500', text: t('knowledgeGraph.limit.heavy', 'Heavy') };
  };

  const performance = getPerformanceIndicator(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">
            {t('knowledgeGraph.limit.title', 'Edge Limit')}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{t('knowledgeGraph.limit.tooltip', 'Controls how many edges are loaded from Neo4j. Higher values show more data but may slow down the visualization.')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {value.toLocaleString()}
          </Badge>
          <Badge className={`${performance.color} text-white text-[10px]`}>
            {performance.text}
          </Badge>
        </div>
      </div>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      {/* Preset buttons */}
      <div className="flex items-center gap-1 pt-1">
        {PRESETS.map((preset) => (
          <TooltipProvider key={preset.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onChange(preset.value)}
                  className={`
                    px-2 py-0.5 text-xs rounded border transition-colors
                    ${value === preset.value 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }
                  `}
                >
                  {preset.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{preset.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default GraphLimitSlider;
