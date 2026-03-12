import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FlaskConical, AlertTriangle, Sparkles } from 'lucide-react';
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

interface SynergisticCompound {
  compound: string;
  conditionsTreated: string[];
  score?: number;
}

interface ScientificEvidencePanelProps {
  triplets: TripletEvidence[];
  synergisticCompounds?: SynergisticCompound[];
}

const predicateBadgeColors: Record<string, string> = {
  TREATS: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
  PREVENTS: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  AMELIORATES: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
  INHIBITS: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  MODULATES: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  ACTIVATES: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  CONTRAINDICATES: 'bg-red-200 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-200',
  CAUSES: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  AGGRAVATES: 'bg-red-100 text-red-600 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  SUPPORTS: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  ALLEVIATES: 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
  BLOCKS: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  STIMULATES: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  REDUCES: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  INCREASES: 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  INTERACTS_WITH: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const predicateSymbols: Record<string, string> = {
  TREATS: '→',
  PREVENTS: '→',
  AMELIORATES: '→',
  INHIBITS: '⊣',
  MODULATES: '- -→',
  ACTIVATES: '→',
  CONTRAINDICATES: '⊘',
  CAUSES: '→!',
  AGGRAVATES: '↑!',
  SUPPORTS: '→',
  ALLEVIATES: '→',
  BLOCKS: '⊣',
  STIMULATES: '→',
  REDUCES: '↓',
  INCREASES: '↑',
  INTERACTS_WITH: '⟷',
};

const CONTRAINDICATION_PREDICATES = ['CONTRAINDICATES', 'AGGRAVATES', 'CAUSES'];
const TREATMENT_PREDICATES = ['TREATS', 'PREVENTS', 'AMELIORATES', 'SUPPORTS', 'ALLEVIATES'];

const ScientificEvidencePanel: React.FC<ScientificEvidencePanelProps> = ({ triplets, synergisticCompounds }) => {
  const { t } = useTranslation();

  if ((!triplets || triplets.length === 0) && (!synergisticCompounds || synergisticCompounds.length === 0)) return null;

  const treatmentTriplets = triplets.filter(t => !CONTRAINDICATION_PREDICATES.includes(t.predicate));
  const contraindicationTriplets = triplets.filter(t => CONTRAINDICATION_PREDICATES.includes(t.predicate));

  const getBadgeVariant = (level: string) => {
    if (level === 'KG-backed') return 'default';
    return 'secondary';
  };

  const renderTripletRow = (triplet: TripletEvidence, idx: number) => (
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
  );

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
      <CardContent className="space-y-4">
        {/* Treatment Triplets */}
        {treatmentTriplets.length > 0 && (
          <div className="space-y-2">
            {treatmentTriplets.map((triplet, idx) => renderTripletRow(triplet, idx))}
          </div>
        )}

        {/* Contraindications Section */}
        {contraindicationTriplets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">
                {t('petProfile.evidence.contraindications', 'Contraindicações')}
              </span>
            </div>
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
              {contraindicationTriplets.map((triplet, idx) => renderTripletRow(triplet, idx))}
            </div>
          </div>
        )}

        {/* Synergistic Treatments Section */}
        {synergisticCompounds && synergisticCompounds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {t('petProfile.evidence.synergistic', 'Tratamentos Sinérgicos')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {t('petProfile.evidence.synergisticDesc', 'Compostos que tratam 2+ condições simultaneamente')}
              </span>
            </div>
            <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-2">
              {synergisticCompounds.map((compound, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm flex-wrap">
                  <NutraceuticalTag name={compound.compound} score={compound.score || 0.8} showScore={false} />
                  <span className="text-[10px] text-muted-foreground">→</span>
                  {compound.conditionsTreated.map((cond, cIdx) => (
                    <ConditionTag key={cIdx} condition={cond} score={0} showScore={false} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScientificEvidencePanel;
