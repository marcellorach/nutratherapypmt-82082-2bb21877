import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, TestTube2, Stethoscope, Dog, CalendarDays } from 'lucide-react';

type PetRow = {
  id: string;
  name: string;
  breed: string;
  sex: string;
  age_years: number;
  weight_kg: number;
  notes: string | null;
  created_at: string;
};

type PetConditionRow = {
  id: string;
  condition_name: string;
  severity: string | null;
  status: string;
  diagnosis_date: string | null;
  origin: string;
};

type PetExamRow = {
  id: string;
  exam_type: string;
  exam_date: string | null;
  flags_abnormal: string[] | null;
  results: Record<string, any> | null;
};

type PetDetail = {
  profile: PetRow | null;
  conditions: PetConditionRow[];
  exams: PetExamRow[];
};

interface Props {
  cohortId: string | null;
  cohortName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatSex = (sex: string, t: (key: string) => string) => {
  if (sex === 'female') return t('prioritization.syntheticExplorer.sex.female');
  if (sex === 'male') return t('prioritization.syntheticExplorer.sex.male');
  return sex;
};

const formatDate = (value: string | null, locale: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US');
};

const renderResultValue = (value: any) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    const parts = [
      value.value !== undefined ? `${value.value}` : null,
      value.unit ? `${value.unit}` : null,
      value.ref_min !== undefined || value.ref_max !== undefined
        ? `(ref ${value.ref_min ?? '?'}–${value.ref_max ?? '?'})`
        : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' ') : JSON.stringify(value);
  }
  return String(value);
};

const CohortPatientsDialog: React.FC<Props> = ({ cohortId, cohortName, open, onOpenChange }) => {
  const { t, i18n } = useTranslation();
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PetDetail>({ profile: null, conditions: [], exams: [] });

  useEffect(() => {
    if (!open || !cohortId) return;

    const loadPets = async () => {
      setLoadingList(true);
      const { data, error } = await supabase
        .from('pet_profiles')
        .select('id, name, breed, sex, age_years, weight_kg, notes, created_at')
        .eq('cohort_id', cohortId)
        .eq('is_synthetic', true)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: t('prioritization.syntheticExplorer.errors.loadListTitle'),
          description: error.message,
          variant: 'destructive',
        });
        setPets([]);
        setSelectedPetId(null);
      } else {
        const rows = (data ?? []) as PetRow[];
        setPets(rows);
        setSelectedPetId((current) => current && rows.some((pet) => pet.id === current) ? current : rows[0]?.id ?? null);
      }
      setLoadingList(false);
    };

    loadPets();
  }, [open, cohortId, t]);

  useEffect(() => {
    if (!open || !selectedPetId) {
      setDetail({ profile: null, conditions: [], exams: [] });
      return;
    }

    const loadDetail = async () => {
      setLoadingDetail(true);
      const [profileRes, conditionsRes, examsRes] = await Promise.all([
        supabase
          .from('pet_profiles')
          .select('id, name, breed, sex, age_years, weight_kg, notes, created_at')
          .eq('id', selectedPetId)
          .single(),
        supabase
          .from('pet_conditions')
          .select('id, condition_name, severity, status, diagnosis_date, origin')
          .eq('pet_id', selectedPetId)
          .order('diagnosis_date', { ascending: false }),
        supabase
          .from('pet_exams')
          .select('id, exam_type, exam_date, flags_abnormal, results')
          .eq('pet_id', selectedPetId)
          .order('exam_date', { ascending: false }),
      ]);

      if (profileRes.error) {
        toast({
          title: t('prioritization.syntheticExplorer.errors.loadDetailTitle'),
          description: profileRes.error.message,
          variant: 'destructive',
        });
        setDetail({ profile: null, conditions: [], exams: [] });
      } else {
        setDetail({
          profile: profileRes.data as PetRow,
          conditions: (conditionsRes.data ?? []) as PetConditionRow[],
          exams: ((examsRes.data ?? []) as PetExamRow[]).map((exam) => ({
            ...exam,
            results: exam.results && typeof exam.results === 'object' && !Array.isArray(exam.results)
              ? (exam.results as Record<string, any>)
              : null,
          })),
        });
      }

      setLoadingDetail(false);
    };

    loadDetail();
  }, [open, selectedPetId, t]);

  const filteredPets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pets;
    return pets.filter((pet) =>
      [pet.id, pet.name, pet.breed].some((value) => value.toLowerCase().includes(term)),
    );
  }, [pets, search]);

  useEffect(() => {
    if (!filteredPets.length) {
      setSelectedPetId(null);
      return;
    }
    if (!selectedPetId || !filteredPets.some((pet) => pet.id === selectedPetId)) {
      setSelectedPetId(filteredPets[0].id);
    }
  }, [filteredPets, selectedPetId]);

  const selected = detail.profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[88vh] overflow-hidden p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>{t('prioritization.syntheticExplorer.title')}</DialogTitle>
          <DialogDescription>
            {t('prioritization.syntheticExplorer.subtitle', {
              cohort: cohortName ?? '—',
              count: pets.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-r min-h-0 flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('prioritization.syntheticExplorer.searchPlaceholder')}
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {t('prioritization.syntheticExplorer.listCount', {
                  shown: filteredPets.length,
                  total: pets.length,
                })}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {loadingList && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('prioritization.syntheticExplorer.loadingList')}
                  </div>
                )}

                {!loadingList && filteredPets.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground border rounded-md bg-muted/30">
                    {t('prioritization.syntheticExplorer.emptyList')}
                  </div>
                )}

                {filteredPets.map((pet) => {
                  const active = pet.id === selectedPetId;
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(pet.id)}
                      className={`w-full text-left rounded-md border p-3 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm text-foreground">{pet.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground mt-1">{pet.id}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {pet.age_years}a
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {pet.breed} · {formatSex(pet.sex, t)} · {pet.weight_kg} kg
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <ScrollArea className="min-h-0">
            <div className="p-4 md:p-6 space-y-4">
              {loadingDetail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('prioritization.syntheticExplorer.loadingDetail')}
                </div>
              )}

              {!loadingDetail && !selected && (
                <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                  {t('prioritization.syntheticExplorer.emptyDetail')}
                </div>
              )}

              {!loadingDetail && selected && (
                <>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{selected.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{selected.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selected.breed}</Badge>
                      <Badge variant="outline">{formatSex(selected.sex, t)}</Badge>
                      <Badge variant="outline">{selected.age_years}a</Badge>
                      <Badge variant="outline">{selected.weight_kg} kg</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-md border p-3 bg-card">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Dog className="h-4 w-4 text-primary" />
                        {t('prioritization.syntheticExplorer.profileTitle')}
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <div>{t('prioritization.syntheticExplorer.profile.breed')}: <span className="text-foreground">{selected.breed}</span></div>
                        <div>{t('prioritization.syntheticExplorer.profile.sex')}: <span className="text-foreground">{formatSex(selected.sex, t)}</span></div>
                        <div>{t('prioritization.syntheticExplorer.profile.age')}: <span className="text-foreground">{selected.age_years}a</span></div>
                        <div>{t('prioritization.syntheticExplorer.profile.weight')}: <span className="text-foreground">{selected.weight_kg} kg</span></div>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 bg-card">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        {t('prioritization.syntheticExplorer.metadataTitle')}
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <div>{t('prioritization.syntheticExplorer.metadata.createdAt')}: <span className="text-foreground">{formatDate(selected.created_at, i18n.language)}</span></div>
                        <div>{t('prioritization.syntheticExplorer.metadata.conditions')}: <span className="text-foreground">{detail.conditions.length}</span></div>
                        <div>{t('prioritization.syntheticExplorer.metadata.exams')}: <span className="text-foreground">{detail.exams.length}</span></div>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 bg-card">
                      <div className="text-sm font-medium">{t('prioritization.syntheticExplorer.notesTitle')}</div>
                      <p className="mt-3 text-sm text-muted-foreground break-words">
                        {selected.notes || t('prioritization.syntheticExplorer.noNotes')}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border p-4 bg-card">
                    <div className="flex items-center gap-2 text-sm font-medium mb-3">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      {t('prioritization.syntheticExplorer.conditionsTitle')}
                    </div>
                    {detail.conditions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('prioritization.syntheticExplorer.noConditions')}</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.conditions.map((condition) => (
                          <div key={condition.id} className="rounded-md border p-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="font-medium text-sm">{condition.condition_name}</div>
                              <div className="flex flex-wrap gap-2">
                                {condition.severity && <Badge variant="outline">{condition.severity}</Badge>}
                                <Badge variant="outline">{condition.status}</Badge>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {t('prioritization.syntheticExplorer.conditionMeta', {
                                origin: condition.origin,
                                date: formatDate(condition.diagnosis_date, i18n.language),
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border p-4 bg-card">
                    <div className="flex items-center gap-2 text-sm font-medium mb-3">
                      <TestTube2 className="h-4 w-4 text-primary" />
                      {t('prioritization.syntheticExplorer.examsTitle')}
                    </div>
                    {detail.exams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('prioritization.syntheticExplorer.noExams')}</p>
                    ) : (
                      <div className="space-y-3">
                        {detail.exams.map((exam) => (
                          <div key={exam.id} className="rounded-md border p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div>
                                <div className="font-medium text-sm">{exam.exam_type}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t('prioritization.syntheticExplorer.examDate', {
                                    date: formatDate(exam.exam_date, i18n.language),
                                  })}
                                </div>
                              </div>
                              {exam.flags_abnormal && exam.flags_abnormal.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                  {exam.flags_abnormal.map((flag) => (
                                    <Badge key={flag} variant="outline" className="text-[10px]">
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {exam.results && Object.keys(exam.results).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(exam.results).map(([key, value]) => (
                                  <div key={key} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                                    <div className="text-xs uppercase text-muted-foreground">{key}</div>
                                    <div className="mt-1 text-foreground break-words">{renderResultValue(value)}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{t('prioritization.syntheticExplorer.noStructuredResults')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <div className="px-6 py-3 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('prioritization.syntheticExplorer.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CohortPatientsDialog;