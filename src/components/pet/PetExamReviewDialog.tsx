import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Analyte = { value: number | string | null; unit: string | null; ref_min: number | null; ref_max: number | null; flag: string | null };

interface Props {
  examId: string;
  petId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApproved?: () => void;
}

export default function PetExamReviewDialog({ examId, petId, open, onOpenChange, onApproved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examType, setExamType] = useState('');
  const [examDate, setExamDate] = useState('');
  const [labName, setLabName] = useState('');
  const [comments, setComments] = useState('');
  const [consultationId, setConsultationId] = useState<string>('none');
  const [consultations, setConsultations] = useState<Array<{ id: string; consultation_date: string; chief_complaint: string | null }>>([]);
  const [results, setResults] = useState<Array<[string, Analyte]>>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: exam }, { data: cons }] = await Promise.all([
        supabase.from('pet_exams').select('exam_type, exam_date, lab_name, clinical_comments, results, consultation_id').eq('id', examId).single(),
        supabase.from('pet_consultations').select('id, consultation_date, chief_complaint').eq('pet_id', petId).order('consultation_date', { ascending: false }),
      ]);
      if (cancelled) return;
      setExamType(exam?.exam_type ?? '');
      setExamDate(exam?.exam_date ?? '');
      setLabName(exam?.lab_name ?? '');
      setComments(exam?.clinical_comments ?? '');
      setConsultationId(exam?.consultation_id ?? 'none');
      setResults(Object.entries((exam?.results ?? {}) as Record<string, Analyte>));
      setConsultations(cons ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, examId, petId]);

  const updateAnalyte = (i: number, field: keyof Analyte, val: any) => {
    setResults((prev) => {
      const copy = [...prev];
      const [k, v] = copy[i];
      copy[i] = [k, { ...v, [field]: val === '' ? null : val }];
      return copy;
    });
  };
  const renameAnalyte = (i: number, name: string) => {
    setResults((prev) => prev.map(([k, v], idx) => (idx === i ? [name, v] : [k, v])));
  };
  const removeAnalyte = (i: number) => setResults((prev) => prev.filter((_, idx) => idx !== i));
  const addAnalyte = () => setResults((prev) => [...prev, ['Novo analito', { value: null, unit: null, ref_min: null, ref_max: null, flag: null }]]);

  const computeFlag = (v: Analyte): Analyte => {
    const num = typeof v.value === 'number' ? v.value : Number(String(v.value ?? '').replace(',', '.'));
    if (!Number.isFinite(num)) return { ...v, flag: v.flag ?? null };
    if (v.ref_max != null && num > v.ref_max) return { ...v, flag: 'high' };
    if (v.ref_min != null && num < v.ref_min) return { ...v, flag: 'low' };
    if (v.ref_min != null || v.ref_max != null) return { ...v, flag: 'normal' };
    return v;
  };

  const save = async (approve: boolean) => {
    setSaving(true);
    try {
      const dict: Record<string, Analyte> = {};
      const flags: string[] = [];
      for (const [k, vRaw] of results) {
        if (!k.trim()) continue;
        const v = computeFlag(vRaw);
        dict[k.trim()] = v;
        if (v.flag === 'high' || v.flag === 'low') flags.push(k.trim());
      }
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase.from('pet_exams').update({
        exam_type: examType || 'Exame',
        exam_date: examDate || null,
        lab_name: labName || null,
        clinical_comments: comments || null,
        consultation_id: consultationId === 'none' ? null : consultationId,
        results: dict,
        flags_abnormal: flags,
        approved: approve,
        approved_at: approve ? new Date().toISOString() : null,
        approved_by: approve ? userId : null,
      }).eq('id', examId);
      if (error) throw error;
      toast.success(approve ? 'Exame aprovado e salvo no histórico' : 'Alterações salvas');
      onApproved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar e aprovar exame</DialogTitle>
          <DialogDescription>
            Edite os campos extraídos pela IA e vincule a consulta correta antes de salvar no histórico.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo de exame</Label>
                <Input value={examType} onChange={(e) => setExamType(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Data do exame</Label>
                <Input type="date" value={examDate ?? ''} onChange={(e) => setExamDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Laboratório</Label>
                <Input value={labName} onChange={(e) => setLabName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Vincular à consulta</Label>
                <Select value={consultationId} onValueChange={setConsultationId}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vínculo</SelectItem>
                    {consultations.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.consultation_date}{c.chief_complaint ? ` — ${c.chief_complaint.slice(0, 40)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Comentários clínicos</Label>
              <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Analitos ({results.length})</Label>
                <Button size="sm" variant="outline" onClick={addAnalyte}>+ Adicionar</Button>
              </div>
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-12 gap-2 p-2 text-[10px] uppercase text-muted-foreground bg-muted/40">
                  <span className="col-span-3">Analito</span>
                  <span className="col-span-2">Valor</span>
                  <span className="col-span-2">Unidade</span>
                  <span className="col-span-2">Min</span>
                  <span className="col-span-2">Max</span>
                  <span className="col-span-1"></span>
                </div>
                {results.map(([name, v], i) => {
                  const computed = computeFlag(v);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 p-2 items-center text-xs">
                      <Input className="col-span-3 h-8" value={name} onChange={(e) => renameAnalyte(i, e.target.value)} />
                      <div className="col-span-2 flex items-center gap-1">
                        <Input className="h-8" value={v.value ?? ''} onChange={(e) => updateAnalyte(i, 'value', e.target.value)} />
                        {computed.flag === 'high' && <Badge variant="destructive" className="text-[9px]">↑</Badge>}
                        {computed.flag === 'low' && <Badge variant="destructive" className="text-[9px]">↓</Badge>}
                      </div>
                      <Input className="col-span-2 h-8" value={v.unit ?? ''} onChange={(e) => updateAnalyte(i, 'unit', e.target.value)} />
                      <Input className="col-span-2 h-8" type="number" value={v.ref_min ?? ''} onChange={(e) => updateAnalyte(i, 'ref_min', e.target.value === '' ? null : Number(e.target.value))} />
                      <Input className="col-span-2 h-8" type="number" value={v.ref_max ?? ''} onChange={(e) => updateAnalyte(i, 'ref_max', e.target.value === '' ? null : Number(e.target.value))} />
                      <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8" onClick={() => removeAnalyte(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                {results.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3 text-center">Nenhum analito extraído.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button variant="secondary" onClick={() => save(false)} disabled={saving || loading}>Salvar rascunho</Button>
          <Button onClick={() => save(true)} disabled={saving || loading}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar e salvar no histórico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}