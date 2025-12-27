import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Calculator, FileText, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { EvidenceConflict, EvidenceClaimDB } from '@/hooks/useEvidenceConflicts';
import { useCanonicalResolutions, CreateResolutionInput } from '@/hooks/useCanonicalResolutions';
import { calculateWeightedCanonicalValue } from '@/services/conflict-detection-service';
import { toast } from 'sonner';

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: EvidenceConflict;
  claims: EvidenceClaimDB[];
  onResolved?: () => void;
}

type ResolutionType = 'single_study' | 'weighted_average' | 'context_specific' | 'manual_value';

export function ResolutionDialog({
  open,
  onOpenChange,
  conflict,
  claims,
  onResolved,
}: ResolutionDialogProps) {
  const { t } = useTranslation();
  const { createResolution } = useCanonicalResolutions();

  const [resolutionType, setResolutionType] = useState<ResolutionType>('weighted_average');
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>(claims.map(c => c.id));
  const [rationale, setRationale] = useState('');
  const [manualValues, setManualValues] = useState({
    dose_min: '',
    dose_max: '',
    dose_unit: claims[0]?.dose_unit || 'mg/kg',
    dose_frequency: claims[0]?.dose_frequency || 'daily',
    notes: '',
  });

  const selectedClaims = claims.filter(c => selectedClaimIds.includes(c.id));
  
  // Calculate preview of weighted values
  const weightedPreview = calculateWeightedCanonicalValue(
    selectedClaims.map(c => ({
      id: c.id,
      subject_name: c.subject_name,
      subject_type: c.subject_type,
      predicate: c.predicate,
      object_name: c.object_name,
      object_type: c.object_type,
      species_context: c.species_context || [],
      study_id: c.study_id,
      study_quality_score: c.study_quality_score,
      study_year: c.study_year,
      dose_value: c.dose_value,
      dose_min: c.dose_min,
      dose_max: c.dose_max,
      dose_unit: c.dose_unit,
      dose_frequency: c.dose_frequency,
      dose_duration: c.dose_duration,
      dose_route: c.dose_route,
      extraction_confidence: c.extraction_confidence,
      triplet_id: c.triplet_id,
    }))
  );

  const handleSubmit = async () => {
    if (!rationale.trim()) {
      toast.error(t('conflicts.resolution.rationaleRequired'));
      return;
    }

    let canonicalValue: CreateResolutionInput['canonicalValue'];

    if (resolutionType === 'manual_value') {
      canonicalValue = {
        dose_min: manualValues.dose_min ? parseFloat(manualValues.dose_min) : undefined,
        dose_max: manualValues.dose_max ? parseFloat(manualValues.dose_max) : undefined,
        dose_unit: manualValues.dose_unit || undefined,
        dose_frequency: manualValues.dose_frequency || undefined,
        notes: manualValues.notes || undefined,
      };
    } else if (resolutionType === 'single_study' && selectedClaimIds.length === 1) {
      const claim = claims.find(c => c.id === selectedClaimIds[0])!;
      canonicalValue = {
        dose_min: claim.dose_min ?? claim.dose_value ?? undefined,
        dose_max: claim.dose_max ?? claim.dose_value ?? undefined,
        dose_unit: claim.dose_unit || undefined,
        dose_frequency: claim.dose_frequency || undefined,
      };
    } else {
      canonicalValue = {
        dose_min: weightedPreview.dose_min ?? undefined,
        dose_max: weightedPreview.dose_max ?? undefined,
        dose_unit: weightedPreview.dose_unit || undefined,
        dose_frequency: weightedPreview.dose_frequency || undefined,
      };
    }

    try {
      await createResolution.mutateAsync({
        subjectName: conflict.subject_name,
        subjectType: conflict.subject_type,
        predicate: conflict.predicate,
        objectName: conflict.object_name,
        objectType: conflict.object_type,
        speciesContext: conflict.species_context,
        resolutionType,
        canonicalValue,
        sourceStudyIds: selectedClaims.map(c => c.study_id).filter(Boolean) as string[],
        sourceClaimIds: selectedClaimIds,
        rationale,
        conflictId: conflict.id,
      });

      toast.success(t('conflicts.resolution.success'));
      onOpenChange(false);
      onResolved?.();
    } catch (error) {
      console.error('Failed to create resolution:', error);
      toast.error(t('conflicts.resolution.error'));
    }
  };

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaimIds(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            {t('conflicts.resolution.title')}
          </DialogTitle>
          <DialogDescription>
            {conflict.subject_name} → {conflict.predicate} → {conflict.object_name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Resolution Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('conflicts.resolution.typeLabel')}
              </Label>
              <RadioGroup value={resolutionType} onValueChange={(v) => setResolutionType(v as ResolutionType)}>
                <div className="grid gap-3">
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="single_study" className="mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{t('conflicts.resolution.types.singleStudy')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('conflicts.resolution.types.singleStudyDesc')}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="weighted_average" className="mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        <span className="font-medium">{t('conflicts.resolution.types.weightedAverage')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('conflicts.resolution.types.weightedAverageDesc')}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="manual_value" className="mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        <span className="font-medium">{t('conflicts.resolution.types.manualValue')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('conflicts.resolution.types.manualValueDesc')}
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Claims Selection */}
            {resolutionType !== 'manual_value' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t('conflicts.resolution.selectStudies')}
                </Label>
                <div className="space-y-2">
                  {claims.map(claim => (
                    <label 
                      key={claim.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedClaimIds.includes(claim.id)}
                        onCheckedChange={() => toggleClaimSelection(claim.id)}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className="font-medium">{claim.study_year || 'Unknown'}</span>
                          {claim.study_quality_score && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              ★ {claim.study_quality_score}
                            </Badge>
                          )}
                          {claim.species_context && claim.species_context.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {claim.species_context.join(', ')}
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-sm">
                          {claim.dose_min !== null && claim.dose_max !== null 
                            ? `${claim.dose_min}-${claim.dose_max}`
                            : claim.dose_value ?? '-'
                          } {claim.dose_unit || ''}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Weighted Preview */}
                {resolutionType === 'weighted_average' && selectedClaimIds.length > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">
                      {t('conflicts.resolution.calculatedValue')}:
                    </p>
                    <p className="font-mono">
                      {weightedPreview.dose_min ?? '-'} - {weightedPreview.dose_max ?? '-'} {weightedPreview.dose_unit || ''}
                      {weightedPreview.dose_frequency && ` (${weightedPreview.dose_frequency})`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Manual Value Input */}
            {resolutionType === 'manual_value' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dose_min">{t('conflicts.resolution.doseMin')}</Label>
                    <Input
                      id="dose_min"
                      type="number"
                      value={manualValues.dose_min}
                      onChange={e => setManualValues(prev => ({ ...prev, dose_min: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dose_max">{t('conflicts.resolution.doseMax')}</Label>
                    <Input
                      id="dose_max"
                      type="number"
                      value={manualValues.dose_max}
                      onChange={e => setManualValues(prev => ({ ...prev, dose_max: e.target.value }))}
                      placeholder="200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dose_unit">{t('conflicts.resolution.doseUnit')}</Label>
                    <Input
                      id="dose_unit"
                      value={manualValues.dose_unit}
                      onChange={e => setManualValues(prev => ({ ...prev, dose_unit: e.target.value }))}
                      placeholder="mg/kg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dose_frequency">{t('conflicts.resolution.doseFrequency')}</Label>
                    <Input
                      id="dose_frequency"
                      value={manualValues.dose_frequency}
                      onChange={e => setManualValues(prev => ({ ...prev, dose_frequency: e.target.value }))}
                      placeholder="daily"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('conflicts.resolution.notes')}</Label>
                  <Input
                    id="notes"
                    value={manualValues.notes}
                    onChange={e => setManualValues(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('conflicts.resolution.notesPlaceholder')}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Rationale */}
            <div className="space-y-2">
              <Label htmlFor="rationale" className="text-sm font-medium">
                {t('conflicts.resolution.rationale')} *
              </Label>
              <Textarea
                id="rationale"
                value={rationale}
                onChange={e => setRationale(e.target.value)}
                placeholder={t('conflicts.resolution.rationalePlaceholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('conflicts.resolution.rationaleHint')}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createResolution.isPending || !rationale.trim()}
          >
            <Check className="h-4 w-4 mr-2" />
            {createResolution.isPending 
              ? t('common.saving') 
              : t('conflicts.resolution.confirm')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
