import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ExternalLink, AlertTriangle, CheckCircle2, Info, Database, Globe, Microscope, ChevronDown, ChevronUp, FlaskConical, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingGapFillTriplets } from '@/hooks/useKgEvidenceGapFill';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EvidenceGapLogPanel, { type GapLogEntry } from './EvidenceGapLogPanel';

interface EvidenceGapCardProps {
  petId: string;
  yearsGained: number;
  hasCoverage: boolean; // true if at least one condition is KG-covered
  /** Called when the gap-fill returns at least one new pending triplet, so the
   *  parent (DigitalTwinDog) can auto-enable the "preview pending" toggle and
   *  invalidate the trajectory query. */
  onTripletsAdded?: (count: number) => void;
}

const EvidenceGapCard: React.FC<EvidenceGapCardProps> = ({ petId, yearsGained, hasCoverage, onTripletsAdded }) => {
  const { t } = useTranslation();
  const { userRoles } = useAuth();
  const isAdmin = (userRoles || []).includes('admin');
  const { data: pendingCount, refetch } = usePendingGapFillTriplets();
  const [isSearching, setIsSearching] = useState(false);
  const [gapLog, setGapLog] = useState<GapLogEntry[]>([]);
  const logIdRef = useRef(0);
  const [lastResult, setLastResult] = useState<null | {
    pairs_searched: number;
    studies_added: number;
    triplets_pending: number;
    discovery_notes?: string[];
    details?: any[];
    message?: string;
  }>(null);

  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

  const toggleDetail = (idx: number) => {
    setExpandedDetails(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Efficacy color helper
  const efficacyColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 3) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 2) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    if (score >= 1) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    return 'text-muted-foreground bg-muted';
  };

  const efficacyLabel = (score: number) => {
    if (score >= 4) return t('evidenceGap.efficacy.strong', 'Strong');
    if (score >= 3) return t('evidenceGap.efficacy.moderate', 'Moderate');
    if (score >= 2) return t('evidenceGap.efficacy.preliminary', 'Preliminary');
    if (score >= 1) return t('evidenceGap.efficacy.anecdotal', 'Anecdotal');
    return t('evidenceGap.efficacy.none', 'None');
  };

  // Compute source breakdown from details
  const sourceBreakdown = lastResult?.details
    ? (() => {
        const byProvider: Record<string, { total: number; ok: number; noEvidence: number; failed: number }> = {};
        for (const d of lastResult.details) {
          const prov = d.provider || 'unknown';
          if (!byProvider[prov]) byProvider[prov] = { total: 0, ok: 0, noEvidence: 0, failed: 0 };
          byProvider[prov].total++;
          if (d.status === 'ok' || d.status === 'dry_run') byProvider[prov].ok++;
          else if (d.status === 'no_evidence' || d.status === 'no_records' || d.status === 'no_pubmed_results') byProvider[prov].noEvidence++;
          else byProvider[prov].failed++;
        }
        return byProvider;
      })()
    : null;

  const appendLog = useCallback((level: GapLogEntry['level'], message: string) => {
    setGapLog(prev => [...prev.slice(-299), {
      id: `gl-${++logIdRef.current}`,
      timestamp: Date.now(),
      level,
      message,
    }]);
  }, []);

  const mapEventToLog = useCallback((ev: any) => {
    switch (ev.type) {
      case 'start':
        appendLog('info', `▶ ${t('evidenceGap.log.starting', { pet_id: ev.pet_id?.slice(0, 8) })}`);
        break;
      case 'config':
        appendLog('info', `⚙ Perplexity: ${ev.hasPerplexity ? '✓' : '✗'} | NCBI: ${ev.hasNcbi ? '✓' : '✗'} | Model: ${ev.perplexity_model}`);
        break;
      case 'loading':
        appendLog('info', `⏳ ${t('evidenceGap.log.loading', { step: ev.step })}`);
        break;
      case 'conditions_loaded':
        if (ev.count === 0) {
          appendLog('warn', `⚠ ${t('evidenceGap.log.noConditions')}`);
        } else {
          appendLog('success', `✓ ${t('evidenceGap.log.conditionsLoaded', { count: ev.count })} — ${(ev.conditions || []).join(', ')}`);
        }
        break;
      case 'snapshot_loaded':
        appendLog('info', `📋 Stack: ${ev.stack_count} ${t('evidenceGap.log.compounds')} ${ev.stack?.length ? '(' + ev.stack.join(', ') + ')' : ''}`);
        break;
      case 'compounds_matched':
        appendLog('info', `🧪 ${t('evidenceGap.log.compoundsMatched', { matched: ev.matched, total: ev.from_stack })}`);
        break;
      case 'compounds_fallback':
        appendLog('warn', `↩ ${t('evidenceGap.log.compoundsFallback', { count: ev.count })}`);
        break;
      case 'pairs_built':
        appendLog('info', `📊 ${t('evidenceGap.log.pairsBuilt', { eligible: ev.eligible, skipped: ev.skipped_existing, total: ev.total_checked })}`);
        break;
      case 'pair_start':
        appendLog('info', `🔍 [${ev.index}/${ev.total}] ${ev.compound} → ${ev.condition}`);
        break;
      case 'pair_perplexity_ok':
        appendLog('success', `✓ Perplexity: ${ev.compound} → ${ev.condition} (ef ${ev.efficacy}/5, ${ev.pmids} PMIDs)`);
        break;
      case 'pair_perplexity_empty':
        appendLog('warn', `∅ Perplexity: ${ev.compound} → ${ev.condition} — fallback PubMed`);
        break;
      case 'pair_pubmed_found':
        appendLog('info', `📚 PubMed: ${ev.pmids} articles (${ev.species})`);
        break;
      case 'pair_no_evidence':
        appendLog('warn', `∅ ${ev.compound} → ${ev.condition}: ${t('evidenceGap.log.noEvidence')}`);
        break;
      case 'pair_ok':
        appendLog('success', `✓ ${ev.compound} → ${ev.condition}: ef ${ev.efficacy}/5 via ${ev.provider} (${ev.studies} studies)`);
        break;
      case 'pair_error':
        appendLog('error', `✗ ${ev.compound} → ${ev.condition}: ${ev.error}`);
        break;
      case 'pair_dry_run':
        appendLog('info', `🏷 dry-run: ${ev.compound} → ${ev.condition} ef ${ev.efficacy}/5`);
        break;
      case 'result':
        // Final result — handled outside
        break;
      case 'error':
        appendLog('error', `✗ ${ev.message}`);
        break;
      case 'done':
        appendLog('success', `✓ ${t('evidenceGap.log.done')}`);
        break;
      default:
        appendLog('info', JSON.stringify(ev));
    }
  }, [appendLog, t]);

  // Only show for admin AND only when twin shows a low gain
  if (!isAdmin) return null;
  if (yearsGained >= 0.3) return null;

  const handleSearch = async () => {
    setLastResult(null);
    setGapLog([]);
    setIsSearching(true);
    try {
      // Use streaming fetch for real-time logging
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const anonKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl;
      const url = `${baseUrl}/functions/v1/kg-evidence-gap-fill?stream=true`;

      appendLog('info', `▶ ${t('evidenceGap.log.initiating')}`);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ pet_id: petId, max_pairs: 10 }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }

      // Read NDJSON stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResult: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.type === 'result') {
                finalResult = ev;
              } else {
                mapEventToLog(ev);
              }
            } catch { /* ignore malformed line */ }
          }
        }
        // Process remaining buffer
        if (buffer.trim()) {
          try {
            const ev = JSON.parse(buffer);
            if (ev.type === 'result') finalResult = ev;
            else mapEventToLog(ev);
          } catch { /* ignore */ }
        }
      }

      const result = finalResult || { pairs_searched: 0, studies_added: 0, triplets_pending: 0 };
      setLastResult(result);

      if ((result.pairs_searched || 0) === 0) {
        toast.warning(t('evidenceGap.toastNoPairs'));
      } else if ((result.triplets_pending || 0) === 0) {
        toast.info(t('evidenceGap.toastNoTriplets', { pairs: result.pairs_searched }));
      } else {
        toast.success(t('evidenceGap.toastSuccess', {
          studies: result.studies_added,
          triplets: result.triplets_pending,
          pairs: result.pairs_searched,
        }));
        onTripletsAdded?.(result.triplets_pending || 0);
      }
      refetch();
    } catch (e: any) {
      const msg = e?.message || (typeof e === 'string' ? e : 'unknown');
      console.error('[EvidenceGapCard] gap-fill error', e);
      appendLog('error', `✗ ${msg}`);
      const displayMsg = msg;
      setLastResult({
        pairs_searched: 0, studies_added: 0, triplets_pending: 0,
        message: displayMsg,
      });
      toast.error(t('evidenceGap.toastError', { error: displayMsg }));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {t('evidenceGap.title')}
          <Badge variant="outline" className="ml-2 text-[10px]">{t('evidenceGap.adminOnly')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert className="border-amber-300/60 bg-transparent">
          <AlertDescription className="text-sm leading-relaxed">
            {hasCoverage
              ? t('evidenceGap.explanationLowEfficacy')
              : t('evidenceGap.explanationNoCoverage')}
          </AlertDescription>
        </Alert>

        {lastResult && (
          <div className="rounded-md border bg-background p-3 text-xs space-y-2">
            <p className="font-medium flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              {t('evidenceGap.detailsTitle')}
            </p>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="text-muted-foreground">{t('evidenceGap.pairsLabel')}:</span> <strong>{lastResult.pairs_searched}</strong></div>
              <div><span className="text-muted-foreground">{t('evidenceGap.studiesLabel')}:</span> <strong>{lastResult.studies_added}</strong></div>
              <div><span className="text-muted-foreground">{t('evidenceGap.pendingLabel')}:</span> <strong>{lastResult.triplets_pending}</strong></div>
            </div>

            {/* Source breakdown */}
            {sourceBreakdown && Object.keys(sourceBreakdown).length > 0 && (
              <div className="border-t pt-2 space-y-1">
                <p className="font-medium text-[11px] flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {t('evidenceGap.sourcesConsulted')}
                </p>
                {Object.entries(sourceBreakdown).map(([prov, stats]) => (
                  <div key={prov} className="flex items-center gap-2 text-[11px]">
                    {prov === 'perplexity' ? <Microscope className="h-3 w-3 text-blue-500" /> : <Database className="h-3 w-3 text-green-500" />}
                    <span className="font-medium capitalize">{prov}</span>
                    <span className="text-muted-foreground">
                      {stats.total} {t('evidenceGap.queriesLabel')} · 
                      <span className="text-emerald-600"> {stats.ok} ✓</span> · 
                      <span className="text-amber-600"> {stats.noEvidence} ∅</span>
                      {stats.failed > 0 && <span className="text-destructive"> · {stats.failed} ✗</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {lastResult.message && (
              <p className="text-[11px] text-muted-foreground italic">{lastResult.message}</p>
            )}
            {(lastResult.discovery_notes || []).map((n, i) => (
              <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400">⚠ {n}</p>
            ))}

            {/* Detailed results per pair */}
            {(lastResult.details || []).length > 0 && (
              <div className="border-t pt-2 space-y-1.5">
                <p className="font-medium text-[11px] flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  {t('evidenceGap.resultsPerPair', 'Results per compound × condition')}
                </p>
                {(lastResult.details || []).map((d: any, i: number) => {
                  const hasRationale = d.status === 'ok' || d.status === 'dry_run';
                  const isExpanded = expandedDetails.has(i);
                  const statusOk = d.status === 'ok' || d.status === 'dry_run';
                  const statusFail = d.status === 'triplet_failed' || d.status === 'error';
                  const statusEmpty = d.status === 'no_evidence' || d.status === 'no_records' || d.status === 'no_pubmed_results';

                  return (
                    <div key={i} className={`rounded-md border p-2 text-[11px] ${statusOk ? 'border-emerald-200 dark:border-emerald-800' : statusFail ? 'border-destructive/30' : 'border-border'}`}>
                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {statusOk && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                          {statusFail && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                          {statusEmpty && <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                          <span className="font-medium truncate">{d.pair?.compound_en}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="truncate">{d.pair?.condition_en}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {d.efficacy_0_5 != null && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${efficacyColor(d.efficacy_0_5)}`}>
                              {d.efficacy_0_5}/5 {efficacyLabel(d.efficacy_0_5)}
                            </span>
                          )}
                          {d.evidence_level && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {d.evidence_level}
                            </Badge>
                          )}
                          {d.species_hint && (
                            <Badge variant={d.species_hint === 'canine' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1">
                              {d.species_hint === 'canine' ? '🐕' : '🔬'} {d.species_hint}
                            </Badge>
                          )}
                          {d.provider && (
                            <Badge variant={d.provider === 'perplexity' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1">
                              {d.provider}
                            </Badge>
                          )}
                          {hasRationale && (
                            <button onClick={() => toggleDetail(i)} className="text-muted-foreground hover:text-foreground">
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Efficacy bar */}
                      {d.efficacy_0_5 != null && d.efficacy_0_5 > 0 && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${d.efficacy_0_5 >= 4 ? 'bg-emerald-500' : d.efficacy_0_5 >= 3 ? 'bg-blue-500' : d.efficacy_0_5 >= 2 ? 'bg-amber-500' : 'bg-orange-400'}`}
                            style={{ width: `${(d.efficacy_0_5 / 5) * 100}%` }}
                          />
                        </div>
                      )}

                      {/* Error message */}
                      {d.error && (
                        <p className="mt-1 text-destructive text-[10px]">{String(d.error).slice(0, 120)}</p>
                      )}

                      {/* Expanded rationale + citations */}
                      {hasRationale && isExpanded && (
                        <div className="mt-2 space-y-1.5 text-[10px] border-t pt-1.5">
                          {/* Rationale from Gemini/Perplexity */}
                          {(d as any).rationale && (
                            <div>
                              <p className="font-medium text-muted-foreground mb-0.5">{t('evidenceGap.rationale', 'Rationale')}:</p>
                              <p className="text-foreground leading-relaxed">{(d as any).rationale}</p>
                            </div>
                          )}
                          {/* Cited PMIDs */}
                          {(d.cited_pmids || []).length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground mr-1">PMIDs:</span>
                              {(d.cited_pmids as string[]).map((pmid: string) => (
                                <a
                                  key={pmid}
                                  href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {pmid}
                                </a>
                              ))}
                            </div>
                          )}
                          {/* Cited URLs */}
                          {(d.cited_urls || []).length > 0 && (
                            <div className="flex items-start gap-1 flex-wrap">
                              <Globe className="h-3 w-3 text-muted-foreground mt-0.5" />
                              <div className="flex flex-col gap-0.5">
                                {(d.cited_urls as string[]).slice(0, 4).map((url: string, ui: number) => (
                                  <a
                                    key={ui}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate max-w-[350px]"
                                  >
                                    {url.replace(/^https?:\/\//, '').slice(0, 60)}…
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {((pendingCount || 0) > 0 || (lastResult?.triplets_pending || 0) > 0) && (
          <div className="flex items-center justify-between rounded-md border bg-background p-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{t('evidenceGap.pendingStatus', { count: pendingCount || lastResult?.triplets_pending || 0 })}</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/administrador?tab=triplet-curation">
                {t('evidenceGap.openCuration')} <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full"
          >
            {isSearching ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('evidenceGap.searching')}</>
            ) : (
              <><Search className="mr-2 h-4 w-4" /> {t('evidenceGap.button')}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('evidenceGap.disclaimer')}
          </p>
        </div>

        <EvidenceGapLogPanel
          entries={gapLog}
          isSearching={isSearching}
          onClear={() => setGapLog([])}
        />
      </CardContent>
    </Card>
  );
};

export default EvidenceGapCard;