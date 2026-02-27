import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, FlaskConical } from 'lucide-react';

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
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 text-sm"
            >
              <FlaskConical className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium">{triplet.subject}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                {triplet.predicate}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-medium">{triplet.object}</span>
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
