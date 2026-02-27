import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna, ArrowDown } from 'lucide-react';

interface PathwayStep {
  label: string;
  type: 'compound' | 'mechanism' | 'effect' | 'outcome';
}

interface PathwayChain {
  condition: string;
  steps: PathwayStep[];
}

interface BiologicalPathwayProps {
  pathways: PathwayChain[];
}

const stepColors: Record<string, string> = {
  compound: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  mechanism: 'bg-blue-50 border-blue-200 text-blue-800',
  effect: 'bg-amber-50 border-amber-200 text-amber-800',
  outcome: 'bg-purple-50 border-purple-200 text-purple-800',
};

const stepLabels: Record<string, string> = {
  compound: 'L0',
  mechanism: 'L2',
  effect: 'L3',
  outcome: 'L4',
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
                    <div
                      className={`w-full rounded-md border px-3 py-1.5 text-xs text-center ${stepColors[step.type]}`}
                    >
                      <span className="opacity-50 mr-1">[{stepLabels[step.type]}]</span>
                      {step.label}
                    </div>
                    {sIdx < pathway.steps.length - 1 && (
                      <ArrowDown className="h-3 w-3 text-muted-foreground my-0.5" />
                    )}
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
