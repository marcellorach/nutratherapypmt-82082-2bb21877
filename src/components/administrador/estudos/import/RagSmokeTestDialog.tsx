import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FlaskConical, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmokeResult {
  query: string;
  topSimilarity: number;
  avgTop5: number;
  hits: Array<{ similarity: number; studyId: string; preview: string }>;
  error?: string;
}

interface SmokeResponse {
  verdict: 'pass' | 'marginal' | 'fail';
  avgTopSimilarity: number;
  chunkCount: number;
  embeddingModel: string;
  taskType: string;
  results: SmokeResult[];
}

const VERDICT_META = {
  pass: {
    icon: CheckCircle2,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    label: 'PASS — índice legacy compatível',
    desc: 'Vetores antigos respondem bem ao novo encoder. Re-vetorização NÃO é necessária.',
  },
  marginal: {
    icon: AlertTriangle,
    color: 'text-amber-800 bg-amber-50 border-amber-200',
    label: 'MARGINAL — qualidade reduzida',
    desc: 'Recall aceitável mas abaixo do ideal. Re-vetorização recomendada mas não urgente.',
  },
  fail: {
    icon: XCircle,
    color: 'text-red-700 bg-red-50 border-red-200',
    label: 'FAIL — espaço vetorial incompatível',
    desc: 'Vetores antigos retornam scores próximos de ruído. Re-vetorização necessária (Etapa 3).',
  },
} as const;

function simBar(sim: number) {
  const pct = Math.max(0, Math.min(1, sim)) * 100;
  const color =
    sim >= 0.55 ? 'bg-emerald-500' : sim >= 0.4 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded bg-slate-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-600 w-12">
        {sim.toFixed(3)}
      </span>
    </div>
  );
}

const RagSmokeTestDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SmokeResponse | null>(null);
  const { toast } = useToast();

  const runTest = async () => {
    setLoading(true);
    setData(null);
    try {
      const { data: resp, error } = await supabase.functions.invoke(
        'test-rag-similarity',
        { body: {} },
      );
      if (error) throw error;
      setData(resp as SmokeResponse);
    } catch (e) {
      toast({
        title: 'Erro no smoke test',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next && !data && !loading) runTest();
  };

  const verdict = data ? VERDICT_META[data.verdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        onClick={() => handleOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 border-indigo-300 text-indigo-800 hover:bg-indigo-50"
        title="Testa empiricamente se o índice vetorial legado é compatível com o novo encoder (Etapa 1: não-destrutivo)"
      >
        <FlaskConical className="h-4 w-4" />
        Testar similaridade RAG
      </Button>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Smoke test do índice vetorial
          </DialogTitle>
          <DialogDescription>
            Roda 5 queries semânticas conhecidas contra o índice atual usando o
            novo encoder (gemini-embedding-001 @ 768d, RETRIEVAL_QUERY) e mede a
            similaridade retornada. Operação somente-leitura.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Embedding queries e consultando o índice…
          </div>
        )}

        {data && verdict && VerdictIcon && (
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${verdict.color}`}>
              <div className="flex items-start gap-3">
                <VerdictIcon className="h-6 w-6 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">{verdict.label}</div>
                  <div className="text-sm mt-1">{verdict.desc}</div>
                  <div className="text-xs mt-2 opacity-80">
                    Avg top-similarity = <strong>{data.avgTopSimilarity.toFixed(3)}</strong>
                    {' · '}
                    {data.chunkCount} chunks no índice
                    {' · '}
                    {data.embeddingModel}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {data.results.map((r, idx) => (
                <div key={idx} className="border rounded-md p-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">
                        {r.query}
                      </div>
                      {r.error ? (
                        <Badge variant="destructive" className="mt-1">
                          {r.error}
                        </Badge>
                      ) : (
                        <div className="text-xs text-slate-500 mt-1">
                          top {r.hits.length} resultados · avg {r.avgTop5.toFixed(3)}
                        </div>
                      )}
                    </div>
                    {!r.error && simBar(r.topSimilarity)}
                  </div>
                  {!r.error && r.hits[0] && (
                    <div className="mt-2 pl-3 border-l-2 border-slate-200 text-xs text-slate-600 italic">
                      “{r.hits[0].preview}…”
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-500 border-t pt-3">
              <strong>Limiares:</strong> ≥ 0,55 PASS (espaços alinhados) · 0,40–0,55
              MARGINAL · &lt; 0,40 FAIL (encoders incompatíveis)
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={runTest} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FlaskConical className="h-4 w-4 mr-2" />
            )}
            Rodar novamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RagSmokeTestDialog;