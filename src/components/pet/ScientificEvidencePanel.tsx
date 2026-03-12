import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FlaskConical } from 'lucide-react';
import NutraceuticalTag from '@/components/administrador/tags/NutraceuticalTag';
import ConditionTag from '@/components/administrador/tags/ConditionTag';
import { cn } from '@/lib/utils';

interface TripletEvidence {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  evidenceLevel: string;
  studyCount?: number;
}

interface ScientificEvidencePanelProps {
  triplets: TripletEvidence[];
}

const predicateBadgeColors: Record<string, string> = {
  TREATS: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
  PREVENTS: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  AMELIORATES: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
  INHIBITS: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  MODULATES: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  ACTIVATES: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
};

const predicateSymbols: Record<string, string> = {
  TREATS: '→',
  PREVENTS: '→',
  AMELIORATES: '→',
  INHIBITS: '⊣',
  MODULATES: '- -→',
  ACTIVATES: '→',
};

const ScientificEvidencePanel: React.FC<ScientificEvidencePanelProps> = ({ triplets }) => {
  const { t } = useTranslation();

  if (!triplets || triplets.length === 0) return null;

  const getBadgeVariant = (level: string) => {
    if (level === 'KG-backed') return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          {t('petProfile.evidence.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.evidence.description')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {triplets.map((triplet, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 text-sm flex-wrap"
            >
              <FlaskConical className="h-3.5 w-3.5 text-primary shrink-0" />
              <NutraceuticalTag
                name={triplet.subject}
                score={triplet.confidence}
                showScore={false}
              />
              <Badge variant="outline" className={cn('text-[10px] px-1.5 shrink-0', predicateBadgeColors[triplet.predicate] || '')}>
                {predicateSymbols[triplet.predicate] || '→'} {triplet.predicate}
              </Badge>
              <ConditionTag
                condition={triplet.object}
                score={0}
                showScore={false}
              />
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {triplet.studyCount && (
                  <span className="text-[10px] text-muted-foreground">
                    {triplet.studyCount} {t('petProfile.evidence.studies')}
                  </span>
                )}
                <Badge variant={getBadgeVariant(triplet.evidenceLevel)} className="text-[10px] px-1.5">
                  {triplet.evidenceLevel}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(triplet.confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScientificEvidencePanel;
