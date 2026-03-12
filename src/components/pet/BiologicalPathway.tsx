import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna, ArrowDown } from 'lucide-react';

interface PathwayStep {
  label: string;
  type: 'compound' | 'mechanism' | 'effect' | 'outcome' | 'contraindication';
  predicate?: string;
}

interface PathwayChain {
  condition: string;
  steps: PathwayStep[];
}

interface BiologicalPathwayProps {
  pathways: PathwayChain[];
}

const stepColors: Record<string, string> = {
  compound: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  mechanism: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  effect: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  outcome: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  contraindication: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const stepLabels: Record<string, string> = {
  compound: 'L0',
  mechanism: 'L2',
  effect: 'L3',
  outcome: 'L4',
  contraindication: '⚠',
};

const predicateArrowColors: Record<string, string> = {
  inibe: 'text-red-500',
  bloqueia: 'text-red-500',
  contraindica: 'text-red-600',
  agrava: 'text-red-400',
  modula: 'text-orange-500',
  ativa: 'text-blue-500',
  estimula: 'text-blue-500',
  aumenta: 'text-blue-400',
  trata: 'text-emerald-500',
  previne: 'text-emerald-500',
  melhora: 'text-emerald-400',
  alivia: 'text-emerald-400',
  suporta: 'text-green-500',
  reduz: 'text-orange-400',
  causa: 'text-red-400',
};

const predicateSymbols: Record<string, string> = {
  inibe: '⊣',
  bloqueia: '⊣',
  contraindica: '⊘',
  agrava: '↑!',
  modula: '- -→',
  ativa: '→',
  estimula: '→',
  aumenta: '↑',
  trata: '→',
  previne: '→',
  melhora: '→',
  alivia: '→',
  suporta: '→',
  reduz: '↓',
  causa: '→!',
};

const BiologicalPathway: React.FC<BiologicalPathwayProps> = ({ pathways }) => {
  const { t } = useTranslation();

  if (!pathways || pathways.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Dna className="h-4 w-4" />
          {t('petProfile.pathway.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.pathway.description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pathways.map((pathway, pIdx) => (
            <div key={pIdx} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {pathway.condition}
              </p>
              <div className="flex flex-col items-center gap-0">
                {pathway.steps.map((step, sIdx) => (
                  <React.Fragment key={sIdx}>
                    {/* Predicate arrow between steps */}
                    {sIdx > 0 && step.predicate && (
                      <div className={`flex items-center gap-1 my-0.5 ${predicateArrowColors[step.predicate] || 'text-muted-foreground'}`}>
                        <span className="text-[10px] font-mono">
                          {predicateSymbols[step.predicate] || '→'}
                        </span>
                        <span className="text-[9px] font-medium uppercase tracking-wide">
                          [{step.predicate}]
                        </span>
                      </div>
                    )}
                    {sIdx > 0 && !step.predicate && (
                      <ArrowDown className="h-3 w-3 text-muted-foreground my-0.5" />
                    )}
                    <div
                      className={`w-full rounded-md border px-3 py-1.5 text-xs text-center ${stepColors[step.type]}`}
                    >
                      <span className="opacity-50 mr-1">[{stepLabels[step.type]}]</span>
                      {step.label}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BiologicalPathway;
