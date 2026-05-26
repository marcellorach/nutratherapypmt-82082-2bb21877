import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen, Sparkles, ExternalLink, FlaskConical } from 'lucide-react';
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

const InsightDrillDownDialog: React.FC<Props> = ({ insight, open, onOpenChange }) => {
  const [pets, setPets] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
        const [{ data: condData }, { data: examData }] = await Promise.all([
          supabase.from('pet_conditions').select('pet_id, condition_name, severity, status').in('pet_id', petIds),
          supabase.from('pet_exams').select('pet_id, exam_type, flags_abnormal').in('pet_id', petIds),
        ]);
        setConditions(condData ?? []);
        setExams(examData ?? []);
      } else {
        setConditions([]); setExams([]);
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
                  <h5 className="text-xs font-semibold mb-2">Pets que sustentam ({matchingPets.length})</h5>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-white border-b">
                        <tr className="text-left text-muted-foreground">
                          <th className="py-1">Nome</th><th>Raça</th><th>Idade</th><th>Sexo</th><th>Peso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchingPets.slice(0, 100).map((p) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-1">{p.name ?? p.id.slice(0, 8)}</td>
                            <td>{p.breed}</td><td>{p.age_years}a</td><td>{p.sex}</td><td>{p.weight_kg}kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {matchingPets.length > 100 && <p className="text-[10px] text-muted-foreground italic pt-1">+ {matchingPets.length - 100} pets…</p>}
                  </div>
                </CardContent>
              </Card>

              {insight.originality_evidence && (
                <Card className="border-purple-200 bg-purple-50/40">
                  <CardContent className="p-3 space-y-2">
                    <h5 className="text-xs font-semibold flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-purple-700" />
                      Originalidade na literatura
                      <Badge variant="outline" className="text-[10px]">
                        {insight.originality_status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        via {insight.originality_evidence?.provider}
                      </span>
                    </h5>
                    <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{insight.originality_evidence?.answer}</p>
                    {(insight.originality_evidence?.citations ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                        {insight.originality_evidence.citations.map((c: string, i: number) => (
                          <a key={i} href={c} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-700 hover:underline flex items-center gap-0.5">
                            <ExternalLink className="h-2.5 w-2.5" /> [{i + 1}]
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsightDrillDownDialog;