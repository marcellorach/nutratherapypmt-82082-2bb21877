import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface OriginalityBreakdown {
  queries?: {
    pubmed_query?: string;
    google_scholar_query?: string;
    semantic_query?: string;
    keywords?: string[];
  };
  internal?: {
    hits: number;
    max_similarity: number;
    top: { study_id: string; title: string | null; similarity: number }[];
    status: 'ok' | 'error';
    error?: string;
  };
  pubmed?: {
    hits: number;
    top: { pmid: string; title: string }[];
    status: 'ok' | 'error';
    error?: string;
  };
  perplexity?: {
    citations: string[];
    status: 'ok' | 'error' | 'disabled';
    error?: string;
  };
  scoring?: {
    score: number | null;
    internal_score: number | null;
    pubmed_score: number | null;
    perplexity_score: number | null;
  };
  google_scholar_url?: string;
}

interface Props {
  suggestionId: string | null;
  title: string;
  rationale?: string;
  criteria?: Record<string, any>;
  score: number | null;
  status: string | null;
  breakdown: OriginalityBreakdown | null;
  onUpdated: (score: number | null, status: string, breakdown: OriginalityBreakdown) => void;
}

function labelFor(score: number | null): { label: string; cls: string } {
  if (score == null) return { label: 'Verificando…', cls: 'bg-gray-100 text-gray-600 border-gray-300' };
  if (score >= 60) return { label: 'Originalidade alta', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
  if (score >= 30) return { label: 'Originalidade média', cls: 'bg-amber-50 text-amber-800 border-amber-300' };
  return { label: 'Já bem estudado', cls: 'bg-red-50 text-red-700 border-red-300' };
}

const CohortOriginalityBadge: React.FC<Props> = ({
  suggestionId, title, rationale, criteria, score, status, breakdown, onUpdated,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePerplexity, setUsePerplexity] = useState(false);

  const pending = score == null && status !== 'error';
  const errored = status === 'error';
  const { label, cls } = labelFor(score);

  const recheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-cohort-originality', {
        body: {
          suggestion_id: suggestionId,
          title,
          rationale,
          suggested_criteria: criteria,
          use_perplexity: usePerplexity,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onUpdated(data?.score ?? null, data?.status ?? 'ok', data?.breakdown ?? null);
    } catch (e) {
      console.error('recheck failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${cls} hover:opacity-80`}
          title="Ver detalhamento da busca de originalidade"
        >
          {pending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : errored ? <AlertTriangle className="h-2.5 w-2.5" /> : <Search className="h-2.5 w-2.5" />}
          <span className="font-medium">{label}</span>
          {score != null && <span className="font-mono">{score}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-3 text-xs" align="end">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Verificação de originalidade
            </h5>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={recheck} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Re-rodar
            </Button>
          </div>

          {pending && !loading && (
            <p className="text-gray-600 italic">Aguardando a busca terminar… (geralmente 5–10s)</p>
          )}
          {errored && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Busca falhou em todas as fontes. Re-rode para tentar de novo.
            </div>
          )}

          {breakdown && (
            <>
              {/* Sources */}
              <div className="space-y-1.5">
                <SourceRow
                  name="Base interna"
                  status={breakdown.internal?.status}
                  hits={breakdown.internal?.hits ?? 0}
                  extra={breakdown.internal && breakdown.internal.hits > 0 ? `máx sim ${breakdown.internal.max_similarity}` : undefined}
                />
                <SourceRow
                  name="PubMed"
                  status={breakdown.pubmed?.status}
                  hits={breakdown.pubmed?.hits ?? 0}
                />
                <SourceRow
                  name="Perplexity (academic)"
                  status={breakdown.perplexity?.status}
                  hits={breakdown.perplexity?.citations.length ?? 0}
                />
              </div>

              {/* Top similar */}
              {(breakdown.internal?.top?.length || breakdown.pubmed?.top?.length) ? (
                <div className="border-t pt-2">
                  <div className="text-[10px] font-semibold text-gray-700 mb-1">Estudos mais próximos</div>
                  <ul className="space-y-1">
                    {breakdown.internal?.top?.map((s) => (
                      <li key={`int-${s.study_id}`} className="text-[10px] text-gray-700">
                        <span className="font-mono text-gray-500">[base · {s.similarity}]</span>{' '}
                        {s.title ?? s.study_id.slice(0, 8)}
                      </li>
                    ))}
                    {breakdown.pubmed?.top?.map((p) => (
                      <li key={`pm-${p.pmid}`} className="text-[10px]">
                        <span className="font-mono text-gray-500">[PMID {p.pmid}]</span>{' '}
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`}
                          target="_blank" rel="noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          {p.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Queries used */}
              {breakdown.queries && (
                <div className="border-t pt-2 space-y-1">
                  <div className="text-[10px] font-semibold text-gray-700">Queries usadas</div>
                  {breakdown.queries.pubmed_query && (
                    <div className="text-[10px]">
                      <span className="text-gray-500">PubMed:</span>{' '}
                      <code className="bg-gray-50 px-1 rounded break-all">{breakdown.queries.pubmed_query}</code>
                    </div>
                  )}
                  {breakdown.google_scholar_url && (
                    <a
                      href={breakdown.google_scholar_url}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:underline"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      Validar manualmente no Google Scholar
                    </a>
                  )}
                </div>
              )}

              {/* Score breakdown */}
              {breakdown.scoring && (
                <div className="border-t pt-2 grid grid-cols-3 gap-1 text-[10px]">
                  <ScoreCell label="Interna" v={breakdown.scoring.internal_score} />
                  <ScoreCell label="PubMed" v={breakdown.scoring.pubmed_score} />
                  <ScoreCell label="Perplexity" v={breakdown.scoring.perplexity_score} />
                </div>
              )}
            </>
          )}

          {/* Perplexity toggle */}
          <div className="border-t pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id={`pplx-${suggestionId}`}
              checked={usePerplexity}
              onChange={(e) => setUsePerplexity(e.target.checked)}
              className="h-3 w-3"
            />
            <label htmlFor={`pplx-${suggestionId}`} className="text-[10px] text-gray-700 cursor-pointer">
              Usar Perplexity (busca expandida — custo ~$0.005)
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

function SourceRow({ name, status, hits, extra }: { name: string; status?: string; hits: number; extra?: string }) {
  if (status === 'disabled') {
    return (
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{name}</span><span className="italic">desligado</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex items-center justify-between text-[10px] text-red-600">
        <span><AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />{name}</span><span>indisponível</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-gray-700">
        <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5 text-emerald-600" />
        {name}
      </span>
      <span className="font-mono text-gray-600">{hits} {hits === 1 ? 'hit' : 'hits'}{extra ? ` · ${extra}` : ''}</span>
    </div>
  );
}

function ScoreCell({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="bg-gray-50 rounded px-1.5 py-1 text-center">
      <div className="text-gray-500">{label}</div>
      <div className="font-mono font-semibold">{v == null ? '—' : Math.round(v)}</div>
    </div>
  );
}

export default CohortOriginalityBadge;