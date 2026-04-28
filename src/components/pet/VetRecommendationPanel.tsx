import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Edit3, AlertTriangle, Sparkles } from 'lucide-react';
import CompoundDosageSlider, { CompoundDosage } from './CompoundDosageSlider';
import { useToast } from '@/hooks/use-toast';

interface VetRecommendationPanelProps {
  compounds: CompoundDosage[];
  confidenceLevel?: 'high' | 'medium' | 'low' | 'insufficient';
  onApprove: (compounds: CompoundDosage[]) => void;
  onReject: () => void;
  petName?: string;
  petBreed?: string;
  petAge?: number;
  petConditions?: string[];
}

// Mock data generator - uses i18n keys for bilingual support
export function generateMockCompounds(t: (key: string) => string): CompoundDosage[] {
  return [
    {
      id: '1',
      name: t('petProfile.compounds.curcumin.name'),
      condition: t('petProfile.compounds.curcumin.condition'),
      dosageMin: 5,
      dosageMax: 50,
      dosageRecommended: 25,
      dosageCurrent: 25,
      unit: 'mg/kg',
      evidenceLevel: 'KG-backed',
      rationale: t('petProfile.compounds.curcumin.rationale'),
      removed: false,
      type: 'nutraceutical',
    },
    {
      id: '2',
      name: t('petProfile.compounds.nmn.name'),
      condition: t('petProfile.compounds.nmn.condition'),
      dosageMin: 50,
      dosageMax: 300,
      dosageRecommended: 150,
      dosageCurrent: 150,
      unit: 'mg',
      evidenceLevel: 'KG-backed',
      rationale: t('petProfile.compounds.nmn.rationale'),
      removed: false,
      type: 'nutraceutical',
    },
    {
      id: '3',
      name: t('petProfile.compounds.resveratrol.name'),
      condition: t('petProfile.compounds.resveratrol.condition'),
      dosageMin: 2,
      dosageMax: 20,
      dosageRecommended: 10,
      dosageCurrent: 10,
      unit: 'mg/kg',
      evidenceLevel: 'AI-suggested',
      rationale: t('petProfile.compounds.resveratrol.rationale'),
      removed: false,
      type: 'nutraceutical',
    },
    {
      id: '4',
      name: t('petProfile.compounds.omega3.name'),
      condition: t('petProfile.compounds.omega3.condition'),
      dosageMin: 20,
      dosageMax: 100,
      dosageRecommended: 50,
      dosageCurrent: 50,
      unit: 'mg/kg',
      evidenceLevel: 'KG-backed',
      rationale: t('petProfile.compounds.omega3.rationale'),
      removed: false,
      type: 'nutraceutical',
    },
    {
      id: '5',
      name: t('petProfile.compounds.rapamycin.name'),
      condition: t('petProfile.compounds.rapamycin.condition'),
      dosageMin: 0.05,
      dosageMax: 0.2,
      dosageRecommended: 0.1,
      dosageCurrent: 0.1,
      unit: 'mg/kg',
      evidenceLevel: 'clinical-experience',
      rationale: t('petProfile.compounds.rapamycin.rationale'),
      removed: false,
      type: 'drug',
    },
  ];
}

const confidenceStyles: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  low: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300' },
  insufficient: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
};

const VetRecommendationPanel: React.FC<VetRecommendationPanelProps> = ({
  compounds: initialCompounds,
  confidenceLevel = 'medium',
  onApprove,
  onReject,
  petName,
  petBreed,
  petAge,
  petConditions,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [compounds, setCompounds] = useState<CompoundDosage[]>(initialCompounds);

  useEffect(() => {
    setCompounds(initialCompounds);
  }, [initialCompounds]);

  const handleDosageChange = (id: string, newDosage: number) => {
    setCompounds(prev => prev.map(c => c.id === id ? { ...c, dosageCurrent: newDosage } : c));
  };

  const handleRemove = (id: string) => {
    setCompounds(prev => prev.map(c => c.id === id ? { ...c, removed: true } : c));
  };

  const handleRestore = (id: string) => {
    setCompounds(prev => prev.map(c => c.id === id ? { ...c, removed: false, dosageCurrent: c.dosageRecommended } : c));
  };

  const activeCompounds = compounds.filter(c => !c.removed);
  const hasModifications = compounds.some(c => c.removed || c.dosageCurrent !== c.dosageRecommended);
  const style = confidenceStyles[confidenceLevel] || confidenceStyles.medium;

  const handleApprove = () => {
    onApprove(compounds);
    toast({
      title: t('petProfile.recommendation.approvedTitle'),
      description: t('petProfile.recommendation.approvedDesc', { count: activeCompounds.length }),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('petProfile.recommendation.stackTitle')}
          </CardTitle>
          <Badge variant="outline" className={`text-xs ${style.bg} ${style.text}`}>
            {t(`petProfile.recommendation.confidence.${confidenceLevel}`)}
          </Badge>
        </div>
        {petName && (
          <p className="text-xs text-muted-foreground">
            {t('petProfile.recommendation.stackDescription', { name: petName, count: activeCompounds.length })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {compounds.map(compound => (
          <CompoundDosageSlider
            key={compound.id}
            compound={compound}
            onChange={handleDosageChange}
            onRemove={handleRemove}
            onRestore={handleRestore}
            petName={petName}
            petBreed={petBreed}
            petAge={petAge}
            petConditions={petConditions}
          />
        ))}

        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('petProfile.recommendation.disclaimer')}
          </p>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button
            className="flex-1 gap-2"
            variant={hasModifications ? 'outline' : 'default'}
            onClick={handleApprove}
          >
            {hasModifications ? (
              <>
                <Edit3 className="h-4 w-4" />
                {t('petProfile.recommendation.approveModified')}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {t('petProfile.recommendation.approve')}
              </>
            )}
          </Button>
          <Button variant="destructive" className="gap-2" onClick={onReject}>
            <XCircle className="h-4 w-4" />
            {t('petProfile.recommendation.reject')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VetRecommendationPanel;
