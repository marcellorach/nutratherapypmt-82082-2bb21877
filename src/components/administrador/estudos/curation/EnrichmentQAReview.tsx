import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ThumbsUp, ThumbsDown, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface QASample {
  id: string;
  triplet_id: string;
  batch_id: string;
  ai_evidence_level: string | null;
  ai_intensity: number | null;
  ai_confidence: number | null;
  ai_rationale: string | null;
  human_overall_ok: boolean | null;
  human_evidence_level_ok: boolean | null;
  human_intensity_ok: boolean | null;
  human_notes: string | null;
  reviewed_at: string | null;
  // Joined triplet info
  triplet?: {
    subject_name: string;
    predicate: string;
    object_name: string;
    extraction_confidence: number | null;
  };
}

interface BatchStats {
  batch_id: string;
  total: number;
  reviewed: number;
  approved: number;
  approval_rate: number;
}

export const EnrichmentQAReview: React.FC = () => {
  const [samples, setSamples] = useState<QASample[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [batches, setBatches] = useState<BatchStats[]>([]);

  const loadSamples = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('enrichment_qa_samples')
      .select(`*, triplet:triplet_extractions(subject_name, predicate, object_name, extraction_confidence)`)
      .is('reviewed_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setSamples((data as any) ?? []);

    // Aggregate batch stats
    const { data: all } = await supabase
      .from('enrichment_qa_samples')
      .select('batch_id, human_overall_ok, reviewed_at')
      .order('created_at', { ascending: false });
    if (all) {
      const map = new Map<string, BatchStats>();
      for (const s of all as any[]) {
        const b = map.get(s.batch_id) ?? { batch_id: s.batch_id, total: 0, reviewed: 0, approved: 0, approval_rate: 0 };
        b.total++;
        if (s.reviewed_at) {
          b.reviewed++;
          if (s.human_overall_ok) b.approved++;
        }
        b.approval_rate = b.reviewed ? b.approved / b.reviewed : 0;
        map.set(s.batch_id, b);
      }
      setBatches(Array.from(map.values()).slice(0, 5));
    }
    setLoading(false);
  };

  useEffect(() => { loadSamples(); }, []);

  const generateBatch = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrichment-qa-sample', {
        body: { sampleSize: 50 },
      });
      if (error) throw error;
      toast.success(`Lote QA criado: ${data?.enriched ?? 0} triplets enriquecidos`);
      await loadSamples();
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao gerar amostra');
    } finally {
      setGenerating(false);
    }
  };

  const review = async (id: string, overallOk: boolean, evOk = overallOk, intOk = overallOk, notes = '') => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('enrichment_qa_samples').update({
      human_overall_ok: overallOk,
      human_evidence_level_ok: evOk,
      human_intensity_ok: intOk,
      human_notes: notes,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      setSamples(prev => prev.filter(s => s.id !== id));
      toast.success(overallOk ? 'Aprovado ✓' : 'Rejeitado ✗');
      // refresh stats only
      const { data: all } = await supabase
        .from('enrichment_qa_samples')
        .select('batch_id, human_overall_ok, reviewed_at')
        .order('created_at', { ascending: false });
      if (all) {
        const map = new Map<string, BatchStats>();
        for (const s of all as any[]) {
          const b = map.get(s.batch_id) ?? { batch_id: s.batch_id, total: 0, reviewed: 0, approved: 0, approval_rate: 0 };
          b.total++;
          if (s.reviewed_at) { b.reviewed++; if (s.human_overall_ok) b.approved++; }
          b.approval_rate = b.reviewed ? b.approved / b.reviewed : 0;
          map.set(s.batch_id, b);
        }
        setBatches(Array.from(map.values()).slice(0, 5));
      }
    }
  };

  const lastBatch = batches[0];
  const gateOpen = lastBatch && lastBatch.reviewed >= 30 && lastBatch.approval_rate >= 0.85;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> QA de Enriquecimento por IA
          </CardTitle>
          <CardDescription>
            Antes de rodar o backfill em massa, valide manualmente uma amostra estratificada para medir a taxa de acerto da IA.
            Liberação do backfill: ≥30 amostras revisadas com ≥85% de aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={generateBatch} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar nova amostra (50 triplets)
            </Button>
            {gateOpen ? (
              <Badge className="bg-green-600 self-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Backfill liberado</Badge>
            ) : (
              <Badge variant="outline" className="self-center"><AlertTriangle className="h-3 w-3 mr-1" /> Backfill bloqueado</Badge>
            )}
          </div>

          {batches.length > 0 && (
            <div className="grid gap-2">
              {batches.map(b => (
                <div key={b.batch_id} className="text-xs flex items-center justify-between p-2 rounded border">
                  <code className="text-muted-foreground">{b.batch_id.slice(0, 8)}…</code>
                  <span>{b.reviewed}/{b.total} revisados</span>
                  <Badge variant={b.approval_rate >= 0.85 ? 'default' : 'secondary'}>
                    {(b.approval_rate * 100).toFixed(0)}% acerto
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pendentes de revisão ({samples.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {!loading && samples.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum item pendente. Gere uma nova amostra para começar.</p>
          )}
          {samples.map(s => (
            <SampleRow key={s.id} sample={s} onReview={review} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const SampleRow: React.FC<{ sample: QASample; onReview: (id: string, ok: boolean, evOk?: boolean, intOk?: boolean, notes?: string) => void }> = ({ sample, onReview }) => {
  const [notes, setNotes] = useState('');
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm">
          <strong>{sample.triplet?.subject_name}</strong>
          <span className="text-muted-foreground"> — {sample.triplet?.predicate} → </span>
          <strong>{sample.triplet?.object_name}</strong>
        </div>
        <Badge variant="outline">conf extr: {sample.triplet?.extraction_confidence?.toFixed(2) ?? '—'}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Evidence level</div>
          <Badge>{sample.ai_evidence_level ?? '—'}</Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Intensity</div>
          <Badge variant="secondary">{sample.ai_intensity?.toFixed(2) ?? '—'}</Badge>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">AI self-confidence</div>
          <Badge variant={(sample.ai_confidence ?? 0) >= 0.7 ? 'default' : 'outline'}>
            {sample.ai_confidence?.toFixed(2) ?? '—'}
          </Badge>
        </div>
      </div>

      <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">{sample.ai_rationale ?? 'Sem racional.'}</div>

      <Textarea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="text-xs h-16"
      />

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => onReview(sample.id, false, false, false, notes)}>
          <ThumbsDown className="h-4 w-4 mr-1" /> Rejeitar
        </Button>
        <Button size="sm" onClick={() => onReview(sample.id, true, true, true, notes)}>
          <ThumbsUp className="h-4 w-4 mr-1" /> Aprovar
        </Button>
      </div>
    </div>
  );
};