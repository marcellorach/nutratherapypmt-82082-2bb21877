import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, RefreshCw } from 'lucide-react';

type Run = {
  id: string;
  label: string | null;
  status: string;
  verifier_model_id: string;
  n_triplets: number;
  n_controls: number;
  started_at: string | null;
  finished_at: string | null;
  sampling_strategy: any;
  stratification_snapshot: any;
  summary: any;
  created_at: string;
};

type Verification = {
  id: string;
  run_id: string;
  triplet_id: string | null;
  control_id: string | null;
  verifier_model_id: string;
  verdict: 'keep' | 'correct' | 'discard' | 'unverifiable';
  rationale: string | null;
  confidence: number | null;
  expected_verdict: string | null;
  matched_expected: boolean | null;
  tool_choice_used: boolean | null;
  abstain_reason: string | null;
  chunk_recall_method: string;
  recall_similarity_top: number | null;
  recalled_chunks: any;
  source_chunk_ids: string[];
  raw_response: any;
  latency_ms: number | null;
  cost_estimate: number | null;
  created_at: string;
};

const VERDICT_COLOR: Record<string, string> = {
  keep: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  correct: 'bg-amber-100 text-amber-800 border-amber-300',
  discard: 'bg-red-100 text-red-800 border-red-300',
  unverifiable: 'bg-slate-100 text-slate-700 border-slate-300',
};

function fmtPct(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function RunsList({ onSelect }: { onSelect: (run: Run) => void }) {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('triplet_verification_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setRuns((data ?? []) as Run[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading && !runs) return <Skeleton className="h-64 w-full" />;
  if (!runs || runs.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Nenhum run de verificação ainda. Use a edge function{' '}
        <code className="px-1 bg-muted rounded">triplet-verification-runner</code>{' '}
        para criar o primeiro.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Runs de verificação independente (Bloco 2)</h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Verificador</TableHead>
            <TableHead className="text-right">Triplets</TableHead>
            <TableHead className="text-right">Controles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Specificity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((r) => (
            <TableRow
              key={r.id}
              className="cursor-pointer hover:bg-muted/40"
              onClick={() => onSelect(r)}
            >
              <TableCell className="text-xs">
                {new Date(r.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-xs font-mono">{r.label ?? r.id.slice(0, 8)}</TableCell>
              <TableCell className="text-xs">{r.verifier_model_id}</TableCell>
              <TableCell className="text-right">{r.n_triplets}</TableCell>
              <TableCell className="text-right">{r.n_controls}</TableCell>
              <TableCell>
                <Badge variant="outline">{r.status}</Badge>
              </TableCell>
              <TableCell className="text-right text-xs">
                {fmtPct(r.summary?.control_specificity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function RunDetail({ run, onBack }: { run: Run; onBack: () => void }) {
  const [rows, setRows] = useState<Verification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all'); // all | triplet | control
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('triplet_verifications')
        .select('*')
        .eq('run_id', run.id)
        .order('created_at', { ascending: true });
      setRows((data ?? []) as Verification[]);
      setLoading(false);
    })();
  }, [run.id]);

  const layers = useMemo(() => {
    if (!rows) return [];
    const s = new Set<string>();
    rows.forEach((r) => {
      const l = r.raw_response?.layer;
      if (l) s.add(l);
    });
    return Array.from(s);
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (verdictFilter !== 'all' && r.verdict !== verdictFilter) return false;
      if (kindFilter === 'triplet' && !r.triplet_id) return false;
      if (kindFilter === 'control' && !r.control_id) return false;
      if (layerFilter !== 'all' && r.raw_response?.layer !== layerFilter) return false;
      return true;
    });
  }, [rows, verdictFilter, kindFilter, layerFilter]);

  const strat = run.stratification_snapshot ?? {};
  const summary = run.summary ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="text-xs text-muted-foreground">
          Run <span className="font-mono">{run.id.slice(0, 8)}</span> ·{' '}
          {new Date(run.created_at).toLocaleString()}
        </div>
      </div>

      <Card className="p-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="Verificador" value={run.verifier_model_id} mono />
          <Stat label="Tool" value={strat?.tool_choice?.function ?? '—'} mono />
          <Stat label="Top-K chunks" value={String(strat?.top_k_chunks ?? '—')} />
          <Stat label="Control specificity" value={fmtPct(summary?.control_specificity)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t">
          <KvBlock title="Triplets por banda" obj={strat?.triplets_by_band} />
          <KvBlock title="Triplets por enriquecimento" obj={strat?.triplets_by_enrichment} />
          <KvBlock title="Controles por camada" obj={strat?.controls_by_layer} />
        </div>
        <div className="pt-2 border-t text-xs">
          <div className="font-medium mb-1">Histograma de verdicts</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary?.verdict_histogram ?? {}).map(([k, v]) => (
              <Badge key={k} variant="outline" className={VERDICT_COLOR[k] ?? ''}>
                {k}: {String(v)}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <FilterSelect label="Tipo" value={kindFilter} onChange={setKindFilter} options={[
            { v: 'all', l: 'Todos' },
            { v: 'triplet', l: 'Triplets' },
            { v: 'control', l: 'Controles' },
          ]} />
          <FilterSelect label="Verdict" value={verdictFilter} onChange={setVerdictFilter} options={[
            { v: 'all', l: 'Todos' },
            { v: 'keep', l: 'keep' },
            { v: 'correct', l: 'correct' },
            { v: 'discard', l: 'discard' },
            { v: 'unverifiable', l: 'unverifiable' },
          ]} />
          {layers.length > 0 && (
            <FilterSelect label="Camada" value={layerFilter} onChange={setLayerFilter} options={[
              { v: 'all', l: 'Todas' },
              ...layers.map((l) => ({ v: l, l })),
            ]} />
          )}
          <div className="text-xs text-muted-foreground ml-auto">
            {filtered.length} / {rows?.length ?? 0}
          </div>
        </div>

        {loading && <Skeleton className="h-40 w-full" />}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead>Esperado</TableHead>
              <TableHead className="text-right">Conf.</TableHead>
              <TableHead className="text-right">Sim. top</TableHead>
              <TableHead>Recall</TableHead>
              <TableHead>Abstain</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Razão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <React.Fragment key={r.id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <TableCell className="text-xs">
                    {r.control_id ? (
                      <Badge variant="outline">control · {r.raw_response?.layer ?? '—'}</Badge>
                    ) : (
                      <Badge variant="outline">triplet · {r.raw_response?.band ?? '—'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={VERDICT_COLOR[r.verdict]}>{r.verdict}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.expected_verdict ? (
                      <span className={r.matched_expected ? 'text-emerald-600' : 'text-red-600'}>
                        {r.expected_verdict} {r.matched_expected ? '✓' : '✗'}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-xs">{r.confidence ?? '—'}</TableCell>
                  <TableCell className="text-right text-xs">{fmtPct(r.recall_similarity_top)}</TableCell>
                  <TableCell className="text-xs">{r.chunk_recall_method}</TableCell>
                  <TableCell className="text-xs">{r.abstain_reason ?? '—'}</TableCell>
                  <TableCell className="text-xs">{r.tool_choice_used ? '✓' : '✗'}</TableCell>
                  <TableCell className="text-xs max-w-md truncate">{r.rationale ?? ''}</TableCell>
                </TableRow>
                {expandedId === r.id && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-muted/30">
                      <ExpandedRow row={r} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={mono ? 'font-mono' : 'font-medium'}>{value}</div>
    </div>
  );
}

function KvBlock({ title, obj }: { title: string; obj: any }) {
  const entries = obj && typeof obj === 'object' ? Object.entries(obj) : [];
  return (
    <div>
      <div className="font-medium mb-1">{title}</div>
      {entries.length === 0 ? (
        <div className="text-muted-foreground">—</div>
      ) : (
        <div className="space-y-0.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ExpandedRow({ row }: { row: Verification }) {
  const chunks = Array.isArray(row.recalled_chunks) ? row.recalled_chunks : [];
  return (
    <div className="p-3 space-y-3 text-xs">
      <div>
        <div className="font-semibold mb-1">Rationale do verificador</div>
        <div className="whitespace-pre-wrap bg-background p-2 rounded border">
          {row.rationale || <span className="text-muted-foreground">(vazio)</span>}
        </div>
      </div>
      <div>
        <div className="font-semibold mb-1">Chunks recuperados ({chunks.length})</div>
        {chunks.length === 0 ? (
          <div className="text-muted-foreground">Nenhum chunk foi recuperado para este item.</div>
        ) : (
          <div className="space-y-2">
            {chunks.map((c: any) => (
              <div
                key={c.chunk_id ?? c.idx}
                className={`p-2 rounded border ${c.supported ? 'border-emerald-400 bg-emerald-50/50' : 'border-muted bg-background'}`}
              >
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>#{c.idx} · {c.method} · sim {c.similarity != null ? (c.similarity * 100).toFixed(1) + '%' : '—'}</span>
                  <span className="font-mono">{(c.chunk_id ?? '').slice(0, 8)}</span>
                </div>
                <div className="whitespace-pre-wrap">{c.snippet}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
        <div>latency: {row.latency_ms ?? '—'} ms</div>
        <div>cost: ${(row.cost_estimate ?? 0).toFixed(5)}</div>
        <div>model: <span className="font-mono">{row.verifier_model_id}</span></div>
        <div>tool_choice: {row.tool_choice_used ? 'forçado ✓' : 'falhou ✗'}</div>
      </div>
    </div>
  );
}

const VerificationRunsTab: React.FC = () => {
  const [selected, setSelected] = useState<Run | null>(null);
  return (
    <div className="p-4">
      {selected ? (
        <RunDetail run={selected} onBack={() => setSelected(null)} />
      ) : (
        <RunsList onSelect={setSelected} />
      )}
    </div>
  );
};

export default VerificationRunsTab;