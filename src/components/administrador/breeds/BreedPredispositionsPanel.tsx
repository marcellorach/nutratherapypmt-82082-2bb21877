import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, ExternalLink, Dna } from 'lucide-react';
import { toast } from 'sonner';
import PredispositionTag from '@/components/administrador/tags/PredispositionTag';

interface Props {
  breedId: string;
  breedName: string;
}


const BreedPredispositionsPanel: React.FC<Props> = ({ breedId, breedName }) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [riskFactor, setRiskFactor] = useState('1.5');
  const [evidenceGrade, setEvidenceGrade] = useState('moderate');

  const { data: predispositions, isLoading } = useQuery({
    queryKey: ['breed-predispositions', breedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breed_predispositions')
        .select('*, health_conditions:condition_id(id, name, name_en)')
        .eq('breed_id', breedId)
        .order('risk_factor', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: conditions } = useQuery({
    queryKey: ['health-conditions-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_conditions')
        .select('id, name, name_en')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('breed_predispositions').insert({
        breed_id: breedId,
        condition_id: selectedCondition,
        risk_factor: parseFloat(riskFactor),
        evidence_grade: evidenceGrade,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breed-predispositions', breedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-breeds'] });
      setAddOpen(false);
      setSelectedCondition('');
      toast.success(t('admin.breeds.predispositionAdded'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('breed_predispositions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breed-predispositions', breedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-breeds'] });
      toast.success(t('admin.breeds.predispositionRemoved'));
    },
  });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  // Filter out already-linked conditions
  const availableConditions = conditions?.filter(
    c => !predispositions?.some(p => (p as any).health_conditions?.id === c.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{t('admin.breeds.predispositionsFor', { breed: breedName })}</h4>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t('admin.breeds.addPredisposition')}
        </Button>
      </div>

      {predispositions && predispositions.length > 0 ? (
        <div className="space-y-2">
          {predispositions.map((pred: any) => (
            <div key={pred.id} className="p-2 bg-muted/50 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <PredispositionTag
                  conditionName={pred.health_conditions?.name || t('common.unknown')}
                  conditionNameEn={pred.health_conditions?.name_en}
                  riskFactor={pred.risk_factor}
                  evidenceGrade={pred.evidence_grade}
                  conditionId={pred.health_conditions?.id}
                  notes={pred.notes}
                  navigable
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive shrink-0"
                  onClick={() => deleteMutation.mutate(pred.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {(pred.genetic_profile || pred.genetic_profile_en || pred.inheritance_pattern || pred.prevalence_pct != null) && (
                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground pl-1">
                  {(isEn ? (pred.genetic_profile_en || pred.genetic_profile) : (pred.genetic_profile || pred.genetic_profile_en)) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border">
                      <Dna className="h-3 w-3" />
                      <span className="font-medium">{t('admin.breeds.geneticProfile')}:</span>
                      <span>{isEn ? (pred.genetic_profile_en || pred.genetic_profile) : (pred.genetic_profile || pred.genetic_profile_en)}</span>
                    </span>
                  )}
                  {pred.inheritance_pattern && (
                    <span className="px-1.5 py-0.5 rounded bg-background border">
                      <span className="font-medium">{t('admin.breeds.inheritancePattern')}:</span>{' '}
                      {t(`admin.breeds.inheritance.${pred.inheritance_pattern}`, { defaultValue: pred.inheritance_pattern })}
                    </span>
                  )}
                  {pred.prevalence_pct != null && (
                    <span className="px-1.5 py-0.5 rounded bg-background border">
                      <span className="font-medium">{t('admin.breeds.prevalence')}:</span> {pred.prevalence_pct}%
                    </span>
                  )}
                </div>
              )}
              {Array.isArray(pred.sources) && pred.sources.length > 0 && (
                <div className="pl-1 text-[11px]">
                  <span className="font-medium text-muted-foreground">{t('admin.breeds.sources')}:</span>{' '}
                  {pred.sources.map((s: any, idx: number) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary hover:underline mr-2"
                      title={s.citation || s.label}
                    >
                      {s.label || s.url}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">{t('admin.breeds.noPredispositions')}</p>
      )}

      {/* Add Predisposition Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.breeds.addPredisposition')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.breeds.form.condition')}</Label>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger><SelectValue placeholder={t('admin.breeds.form.selectCondition')} /></SelectTrigger>
                <SelectContent>
                  {availableConditions?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.name_en})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.breeds.riskFactor')}</Label>
              <Input type="number" step="0.1" min="0.1" value={riskFactor} onChange={e => setRiskFactor(e.target.value)} />
            </div>
            <div>
              <Label>{t('admin.breeds.form.evidenceGrade')}</Label>
              <Select value={evidenceGrade} onValueChange={setEvidenceGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('admin.breeds.evidenceHigh')}</SelectItem>
                  <SelectItem value="moderate">{t('admin.breeds.evidenceModerate')}</SelectItem>
                  <SelectItem value="low">{t('admin.breeds.evidenceLow')}</SelectItem>
                  <SelectItem value="preliminary">{t('admin.breeds.evidencePreliminary')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!selectedCondition || addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreedPredispositionsPanel;
