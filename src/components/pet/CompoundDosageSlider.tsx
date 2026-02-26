import React from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, RotateCcw, FlaskConical, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompoundDosage {
  id: string;
  name: string;
  condition: string;
  dosageMin: number;
  dosageMax: number;
  dosageRecommended: number;
  dosageCurrent: number;
  unit: string;
  evidenceLevel: 'KG-backed' | 'AI-suggested' | 'clinical-experience';
  rationale: string;
  removed: boolean;
  type: 'nutraceutical' | 'drug';
}

interface CompoundDosageSliderProps {
  compound: CompoundDosage;
  onChange: (id: string, newDosage: number) => void;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}

const evidenceBadgeStyles: Record<string, string> = {
  'KG-backed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'AI-suggested': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'clinical-experience': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const CompoundDosageSlider: React.FC<CompoundDosageSliderProps> = ({
  compound,
  onChange,
  onRemove,
  onRestore,
}) => {
  const { t } = useTranslation();
  const {
    id, name, condition, dosageMin, dosageMax, dosageRecommended,
    dosageCurrent, unit, evidenceLevel, rationale, removed, type,
  } = compound;

  const isModified = dosageCurrent !== dosageRecommended;
  const recommendedPercent = ((dosageRecommended - dosageMin) / (dosageMax - dosageMin)) * 100;

  if (removed) {
    return (
      <div className="flex items-center justify-between p-3 border border-dashed rounded-lg opacity-50 bg-muted/30">
        <div className="flex items-center gap-2">
          {type === 'nutraceutical' ? (
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Pill className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm line-through text-muted-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">→ {condition}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRestore(id)} className="h-7 text-xs gap-1">
          <RotateCcw className="h-3 w-3" />
          {t('petProfile.recommendation.restore')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {type === 'nutraceutical' ? (
            <FlaskConical className="h-4 w-4 text-emerald-600" />
          ) : (
            <Pill className="h-4 w-4 text-blue-600" />
          )}
          <span className="font-medium text-sm">{name}</span>
          <span className="text-xs text-muted-foreground">→ {condition}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', evidenceBadgeStyles[evidenceLevel])}>
            {evidenceLevel}
          </Badge>
          {isModified && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {t('petProfile.recommendation.modified')}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(id)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-xs text-muted-foreground mb-3 pl-6">{rationale}</p>

      {/* Slider */}
      <div className="relative px-1">
        {/* Recommended marker */}
        <div
          className="absolute -top-1 z-10 flex flex-col items-center pointer-events-none"
          style={{ left: `calc(${recommendedPercent}% - 1px)` }}
        >
          <div className="w-0.5 h-3 bg-emerald-500 rounded-full" />
        </div>

        <Slider
          min={dosageMin}
          max={dosageMax}
          step={Math.max(0.1, (dosageMax - dosageMin) / 100)}
          value={[dosageCurrent]}
          onValueChange={([v]) => onChange(id, Math.round(v * 10) / 10)}
          className="my-2"
        />

        {/* Labels */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
          <span>{dosageMin} {unit}</span>
          <span className="text-emerald-600 font-medium">
            {t('petProfile.recommendation.recommended')}: {dosageRecommended} {unit}
          </span>
          <span>{dosageMax} {unit}</span>
        </div>

        {/* Current value */}
        <div className="text-center mt-1">
          <span className={cn(
            "text-sm font-semibold",
            isModified ? "text-orange-600" : "text-foreground"
          )}>
            {dosageCurrent} {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompoundDosageSlider;
