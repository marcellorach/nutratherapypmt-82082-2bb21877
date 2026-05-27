import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, FlaskConical, ChevronDown, ChevronRight, Pill, Activity, Microscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Insight {
  id: string;
  cohort_id: string | null;
  title: string;
  summary: string;
  signals: string[] | null;
  evidence: any;
  confidence: number;
  source_model?: string | null;
  originality_status?: string;
  originality_checked_at?: string | null;
  originality_evidence?: any;
}

interface Props {
  insight: Insight | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

const formatLabValue = (v: any): { text: string; abnormal: boolean; ref?: string } => {
  if (v === null || v === undefined) return { text: '—', abnormal: false };
  if (typeof v !== 'object') return { text: String(v), abnormal: false };
  const value = v.value ?? v.result ?? v.val;
  const unit = v.unit ?? v.units ?? '';
  const rawMin = v.ref_min ?? v.refMin ?? v.min;
  const rawMax = v.ref_max ?? v.refMax ?? v.max;
  const refMin = rawMin != null && !Number.isNaN(Number(rawMin)) ? Number(rawMin) : null;
  const refMax = rawMax != null && !Number.isNaN(Number(rawMax)) ? Number(rawMax) : null;
  if (value === undefined) return { text: JSON.stringify(v).slice(0, 40), abnormal: false };
  const num = Number(value);
  let abnormal = false;
  if (!Number.isNaN(num)) {
    if (refMin != null && num < refMin) abnormal = true;
    if (refMax != null && num > refMax) abnormal = true;
  }
  // Only emit the reference range when at least one bound is numeric (qualitative tests like cytology have no range)
  const ref = refMin != null || refMax != null ? `ref ${refMin ?? '−∞'}–${refMax ?? '+∞'}` : undefined;
  return { text: `${value}${unit ? ' ' + unit : ''}`, abnormal, ref };
};

const InsightDrillDownDialog: React.FC<Props> = ({ insight, open, onOpenChange }) => {
  const [pets, setPets] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPet, setExpandedPet] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !insight) return;
    setLoading(true);
    (async () => {
      let petQuery = supabase.from('pet_profiles').select('id, name, breed, sex, age_years, weight_kg, cohort_id').eq('is_synthetic', true);
      if (insight.cohort_id) petQuery = petQuery.eq('cohort_id', insight.cohort_id);
      const { data: petsData } = await petQuery.limit(500);
      const petIds = (petsData ?? []).map((p: any) => p.id);
      setPets(petsData ?? []);

      if (petIds.length) {
        const [{ data: condData }, { data: examData }, { data: medData }] = await Promise.all([
          supabase.from('pet_conditions').select('pet_id, condition_name, severity, status').in('pet_id', petIds),
          supabase.from('pet_exams').select('pet_id, exam_type, exam_date, flags_abnormal, results, clinical_comments, lab_name').in('pet_id', petIds),
          supabase.from('pet_medications').select('pet_id, medication_name, dosage, frequency, status').in('pet_id', petIds),
        ]);
        setConditions(condData ?? []);
        setExams(examData ?? []);
        setMedications(medData ?? []);
      } else {
        setConditions([]); setExams([]); setMedications([]);
      }
      setLoading(false);
    })();
  }, [open, insight?.id]);

  const signals = useMemo(() => (insight?.signals ?? []).map((s) => s.toLowerCase()), [insight]);

  // Pets that match: at least one condition OR exam-flag containing a signal token
  const matchingPets = useMemo(() => {
    if (!signals.length) return pets;
    const matchIds = new Set<string>();
    conditions.forEach((c) => {
      const text = c.condition_name?.toLowerCase() ?? '';
      if (signals.some((s) => text.includes(s) || s.includes(text.slice(0, 6)))) matchIds.add(c.pet_id);
    });
    exams.forEach((e) => {
      (e.flags_abnormal ?? []).forEach((f: string) => {
        const ft = f.toLowerCase();
        if (signals.some((s) => ft.includes(s) || s.includes(ft.slice(0, 6)))) matchIds.add(e.pet_id);
      });
    });
    const filtered = pets.filter((p) => matchIds.has(p.id));
    return filtered.length ? filtered : pets;
  }, [pets, conditions, exams, signals]);

  const byBreed = useMemo(() => {
    const m: Record<string, number> = {};
    matchingPets.forEach((p) => { m[p.breed] = (m[p.breed] ?? 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([breed, n]) => ({ breed, n }));
  }, [matchingPets]);

  const byAge = useMemo(() => {
    const buckets = { '0-3a': 0, '4-7a': 0, '8-11a': 0, '12+a': 0 };
    matchingPets.forEach((p) => {
      const a = Number(p.age_years);
      if (a <= 3) buckets['0-3a']++; else if (a <= 7) buckets['4-7a']++; else if (a <= 11) buckets['8-11a']++; else buckets['12+a']++;
    });
    return Object.entries(buckets).map(([bucket, n]) => ({ bucket, n }));
  }, [matchingPets]);

  const bySeverity = useMemo(() => {
    const petSet = new Set(matchingPets.map((p) => p.id));
    const m: Record<string, number> = { mild: 0, moderate: 0, severe: 0 };
    conditions.filter((c) => petSet.has(c.pet_id)).forEach((c) => {
      const s = c.severity ?? 'mild';
      m[s] = (m[s] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).filter((x) => x.value > 0);
  }, [matchingPets, conditions]);

  const topFlags = useMemo(() => {
    const petSet = new Set(matchingPets.map((p) => p.id));
    const m: Record<string, number> = {};
    exams.filter((e) => petSet.has(e.pet_id)).forEach((e) => {
      (e.flags_abnormal ?? []).forEach((f: string) => { m[f] = (m[f] ?? 0) + 1; });
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([flag, n]) => ({ flag, n }));
  }, [matchingPets, exams]);

  if (!insight) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <FlaskConical className="h-4 w-4 mt-1 text-primary shrink-0" />
            <span>{insight.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Card className="bg-muted/40">
            <CardContent className="p-3 space-y-2">
              <p className="text-sm leading-relaxed">{insight.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] font-mono">confiança {Math.round((insight.confidence ?? 0) * 100)}%</Badge>
                {insight.source_model && <Badge variant="outline" className="text-[10px] font-mono">{insight.source_model}</Badge>}
                {(insight.signals ?? []).map((s, i) => <Badge key={i} variant="outline" className="text-[10px] bg-white">{s}</Badge>)}
              </div>
              {insight.evidence && Object.keys(insight.evidence).length > 0 && (
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-muted-foreground">Evidência quantitativa (raw)</summary>
                  <pre className="text-[10px] bg-white p-2 rounded border mt-1 overflow-x-auto">{JSON.stringify(insight.evidence, null, 2)}</pre>
                </details>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Estratificação dos {matchingPets.length} pets que sustentam este insight
                  {signals.length > 0 && matchingPets.length === pets.length && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-300 text-amber-800">
                      filtro de signals sem match → mostrando cohort inteiro
                    </Badge>
                  )}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <h5 className="text-xs font-semibold mb-2">Distribuição por raça</h5>
                    {byBreed.length === 0 ? <p className="text-xs text-muted-foreground italic">sem dados</p> : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={byBreed} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="breed" width={120} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="n" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <h5 className="text-xs font-semibold mb-2">Distribuição por idade</h5>
                    {byAge.every((b) => b.n === 0) ? <p className="text-xs text-muted-foreground italic">sem dados</p> : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={byAge}>
                          <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="n" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <h5 className="text-xs font-semibold mb-2">Severidade das condições</h5>
                    {bySeverity.length === 0 ? <p className="text-xs text-muted-foreground italic">sem dados</p> : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={bySeverity} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }}>
                            {bySeverity.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <h5 className="text-xs font-semibold mb-2">Top flags laboratoriais</h5>
                    {topFlags.length === 0 ? <p className="text-xs text-muted-foreground italic">sem dados</p> : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={topFlags} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="flag" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip />
                          <Bar dataKey="n" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-3">
                  <h5 className="text-xs font-semibold mb-2">
                    Pets que sustentam ({matchingPets.length}) — clique para expandir e ver dados reais
                  </h5>
                  <div className="max-h-[420px] overflow-y-auto divide-y border rounded">
                    {matchingPets.slice(0, 200).map((p) => {
                      const petConds = conditions.filter((c) => c.pet_id === p.id);
                      const petExams = exams.filter((e) => e.pet_id === p.id);
                      const petMeds = medications.filter((m) => m.pet_id === p.id);
                      const isOpen = expandedPet === p.id;
                      return (
                        <div key={p.id} className="bg-white">
                          <button
                            type="button"
                            onClick={() => setExpandedPet(isOpen ? null : p.id)}
                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[11px] hover:bg-muted/40"
                          >
                            {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                            <span className="font-medium w-28 truncate">{p.name ?? p.id.slice(0, 8)}</span>
                            <span className="w-32 truncate text-muted-foreground">{p.breed}</span>
                            <span className="w-12 text-muted-foreground">{p.age_years}a</span>
                            <span className="w-14 text-muted-foreground">{p.sex}</span>
                            <span className="w-16 text-muted-foreground">{p.weight_kg}kg</span>
                            <div className="ml-auto flex items-center gap-1">
                              {petConds.length > 0 && <Badge variant="outline" className="text-[9px] bg-rose-50 border-rose-200 text-rose-700">{petConds.length} cond</Badge>}
                              {petExams.length > 0 && <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-700">{petExams.length} exames</Badge>}
                              {petMeds.length > 0 && <Badge variant="outline" className="text-[9px] bg-indigo-50 border-indigo-200 text-indigo-700">{petMeds.length} med</Badge>}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="bg-muted/30 px-4 py-2 space-y-3 text-[11px]">
                              {/* Conditions */}
                              <div>
                                <div className="font-semibold flex items-center gap-1 mb-1 text-rose-800">
                                  <Activity className="h-3 w-3" /> Condições diagnosticadas ({petConds.length})
                                </div>
                                {petConds.length === 0 ? (
                                  <p className="italic text-muted-foreground pl-4">nenhuma condição registrada</p>
                                ) : (
                                  <ul className="space-y-0.5 pl-4">
                                    {petConds.map((c, i) => (
                                      <li key={i} className="flex flex-wrap gap-1.5 items-center">
                                        <span>• {c.condition_name}</span>
                                        {c.severity && <Badge variant="outline" className="text-[9px]">{c.severity}</Badge>}
                                        {c.status && <Badge variant="outline" className="text-[9px] bg-white">{c.status}</Badge>}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* Exams */}
                              <div>
                                <div className="font-semibold flex items-center gap-1 mb-1 text-amber-800">
                                  <Microscope className="h-3 w-3" /> Exames laboratoriais ({petExams.length})
                                </div>
                                {petExams.length === 0 ? (
                                  <p className="italic text-muted-foreground pl-4">nenhum exame registrado</p>
                                ) : (
                                  <div className="space-y-2 pl-4">
                                    {petExams.map((e, i) => {
                                      const resultEntries = e.results && typeof e.results === 'object'
                                        ? Object.entries(e.results).slice(0, 12) : [];
                                      return (
                                        <div key={i} className="border-l-2 border-amber-200 pl-2">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-medium">{e.exam_type}</span>
                                            {e.exam_date && <span className="text-muted-foreground text-[10px]">{e.exam_date}</span>}
                                            {e.lab_name && <Badge variant="outline" className="text-[9px]">{e.lab_name}</Badge>}
                                          </div>
                                          {(e.flags_abnormal ?? []).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {e.flags_abnormal.map((f: string, k: number) => (
                                                <Badge key={k} variant="outline" className="text-[9px] bg-rose-50 border-rose-200 text-rose-700">⚠ {f}</Badge>
                                              ))}
                                            </div>
                                          )}
                                          {resultEntries.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-0.5 mt-1 text-[10px]">
                                              {resultEntries.map(([k, v]) => {
                                                const f = formatLabValue(v);
                                                return (
                                                  <div key={k} className="truncate" title={f.ref ?? ''}>
                                                    <span className="text-muted-foreground">{k}:</span>{' '}
                                                    <span className={`font-mono ${f.abnormal ? 'text-rose-700 font-semibold' : ''}`}>{f.text}</span>
                                                    {f.ref && <span className="text-muted-foreground/70 ml-1">({f.ref})</span>}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                          {e.clinical_comments && (
                                            <p className="text-[10px] italic text-muted-foreground mt-1">"{e.clinical_comments}"</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Medications */}
                              <div>
                                <div className="font-semibold flex items-center gap-1 mb-1 text-indigo-800">
                                  <Pill className="h-3 w-3" /> Medicações ({petMeds.length})
                                </div>
                                {petMeds.length === 0 ? (
                                  <p className="italic text-muted-foreground pl-4">nenhuma medicação</p>
                                ) : (
                                  <ul className="space-y-0.5 pl-4">
                                    {petMeds.map((m, i) => (
                                      <li key={i} className="flex flex-wrap gap-1.5 items-center">
                                        <span>• {m.medication_name}</span>
                                        {m.dosage && <span className="text-muted-foreground">{m.dosage}</span>}
                                        {m.frequency && <span className="text-muted-foreground">— {m.frequency}</span>}
                                        {m.status && <Badge variant="outline" className="text-[9px]">{m.status}</Badge>}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {matchingPets.length > 200 && <p className="text-[10px] text-muted-foreground italic p-2">+ {matchingPets.length - 200} pets…</p>}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-1">
                    Todos os dados acima vêm diretamente das tabelas <code>pet_conditions</code>, <code>pet_exams</code> e <code>pet_medications</code> — nada é simulado.
                  </p>
                </CardContent>
              </Card>

              <p className="text-[10px] text-muted-foreground italic text-center pt-1">
                Para evidências da literatura científica, clique no badge de originalidade no card do insight.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsightDrillDownDialog;