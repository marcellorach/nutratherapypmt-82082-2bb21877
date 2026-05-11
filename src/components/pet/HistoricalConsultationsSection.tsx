import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpHint } from '@/components/ui/help-hint';
import type { ConsultationBundle } from '@/services/pet-consultation-writer';

export type DraftConsultation = ConsultationBundle & { localId: string };

interface Props {
  consultations: DraftConsultation[];
  onChange: (next: DraftConsultation[]) => void;
}

const newDraft = (): DraftConsultation => ({
  localId: crypto.randomUUID(),
  consultation_date: new Date().toISOString().slice(0, 10),
  chief_complaint: '',
  conditions: [],
  medications: [],
  exams: [],
});

const HistoricalConsultationsSection: React.FC<Props> = ({ consultations, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const update = (id: string, patch: Partial<DraftConsultation>) => {
    onChange(consultations.map((c) => (c.localId === id ? { ...c, ...patch } : c)));
  };
  const remove = (id: string) => onChange(consultations.filter((c) => c.localId !== id));

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-md">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/40"
        >
          <span className="flex items-center gap-2">
            {t('petRegistration.form.historicalConsultations.title', {
              defaultValue: 'Consultas anteriores',
            })}
            {consultations.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{consultations.length}</Badge>
            )}
            <HelpHint
              title={t('petRegistration.form.historicalConsultations.helpTitle', {
                defaultValue: 'Por que registrar consultas anteriores?',
              })}
            >
              {t('petRegistration.form.historicalConsultations.helpBody', {
                defaultValue:
                  'O MedGraphRAG usa a última consulta com peso 1.0 (CURRENT_STATE) e as anteriores com peso 0.4 (CLINICAL_TRAJECTORY) para detectar progressão. Quanto mais histórico, mais precisa a inferência.',
              })}
            </HelpHint>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 pt-0 space-y-3">
        {consultations.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t('petRegistration.form.historicalConsultations.empty', {
              defaultValue: 'Nenhuma consulta anterior. Adicione uma para construir o histórico clínico.',
            })}
          </p>
        )}
        {consultations.map((c, idx) => (
          <div key={c.localId} className="border rounded-md p-3 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                {t('petRegistration.form.historicalConsultations.itemTitle', {
                  defaultValue: 'Consulta {{n}}',
                  n: idx + 1,
                })}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(c.localId)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.date', { defaultValue: 'Data' })}
                </Label>
                <Input
                  type="date"
                  value={c.consultation_date}
                  onChange={(e) => update(c.localId, { consultation_date: e.target.value })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.weight', { defaultValue: 'Peso (kg)' })}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={c.weight_kg_at_visit ?? ''}
                  onChange={(e) =>
                    update(c.localId, {
                      weight_kg_at_visit: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.bcs', { defaultValue: 'ECC (1-9)' })}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="9"
                  value={c.body_condition_score ?? ''}
                  onChange={(e) =>
                    update(c.localId, {
                      body_condition_score: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">
                {t('petRegistration.form.historicalConsultations.chiefComplaint', {
                  defaultValue: 'Queixa principal',
                })}
              </Label>
              <Input
                value={c.chief_complaint ?? ''}
                onChange={(e) => update(c.localId, { chief_complaint: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.assessment', {
                    defaultValue: 'Achados / Diagnóstico',
                  })}
                </Label>
                <Textarea
                  rows={2}
                  value={c.assessment ?? ''}
                  onChange={(e) => update(c.localId, { assessment: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.plan', {
                    defaultValue: 'Conduta',
                  })}
                </Label>
                <Textarea
                  rows={2}
                  value={c.plan ?? ''}
                  onChange={(e) => update(c.localId, { plan: e.target.value })}
                />
              </div>
            </div>
            {/* Lightweight quick-add: free text becomes a single condition / medication */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.conditions', {
                    defaultValue: 'Diagnósticos (separados por vírgula)',
                  })}
                </Label>
                <Input
                  className="h-8"
                  value={(c.conditions ?? []).map((x) => x.condition_name).join(', ')}
                  onChange={(e) =>
                    update(c.localId, {
                      conditions: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((name) => ({
                          condition_name: name,
                          severity: 'mild',
                          status: 'active',
                          origin: 'vet_diagnosis',
                        })),
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">
                  {t('petRegistration.form.historicalConsultations.medications', {
                    defaultValue: 'Medicações (uma por linha: nome | dose | frequência)',
                  })}
                </Label>
                <Textarea
                  rows={2}
                  value={(c.medications ?? [])
                    .map((m) => [m.medication_name, m.dosage, m.frequency].filter(Boolean).join(' | '))
                    .join('\n')}
                  onChange={(e) =>
                    update(c.localId, {
                      medications: e.target.value
                        .split('\n')
                        .map((line) => line.split('|').map((s) => s.trim()))
                        .filter((parts) => parts[0])
                        .map(([medication_name, dosage, frequency]) => ({
                          medication_name,
                          dosage,
                          frequency,
                          status: 'active',
                        })),
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...consultations, newDraft()])}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          {t('petRegistration.form.historicalConsultations.add', {
            defaultValue: 'Adicionar consulta',
          })}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default HistoricalConsultationsSection;