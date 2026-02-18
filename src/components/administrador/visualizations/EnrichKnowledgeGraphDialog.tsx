import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, CheckCircle2, XCircle, AlertCircle, Plus, X, Play } from 'lucide-react';

const DEFAULT_QUERIES = [
  "curcumin canine aging neuroprotection",
  "omega-3 fatty acids dog osteoarthritis longevity",
  "resveratrol canine cardiac aging",
  "NAD+ NMN canine geriatric supplementation",
  "probiotics gut microbiome elderly dogs"
];

const STEP_LABELS: Record<string, { pt: string; en: string }> = {
  searching: { pt: 'Buscando estudos...', en: 'Searching studies...' },
  selected_study: { pt: 'Estudo selecionado', en: 'Study selected' },
  downloading: { pt: 'Baixando PDF...', en: 'Downloading PDF...' },
  extracting: { pt: 'Extraindo dados com IA...', en: 'Extracting data with AI...' },
  generating_triplets: { pt: 'Gerando triplets...', en: 'Generating triplets...' },
  auto_approving: { pt: 'Auto-aprovando triplets...', en: 'Auto-approving triplets...' },
  consolidating: { pt: 'Consolidando grafo...', en: 'Consolidating graph...' },
  syncing_neo4j: { pt: 'Sincronizando Neo4j...', en: 'Syncing Neo4j...' },
};

interface QueryResult {
  query: string;
  status: string;
  title?: string;
  tripletsGenerated?: number;
  tripletsApproved?: number;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnrichKnowledgeGraphDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'pt' ? 'pt' : 'en';

  const [queries, setQueries] = useState<string[]>([...DEFAULT_QUERIES]);
  const [newQuery, setNewQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [currentQueryIndex, setCurrentQueryIndex] = useState(-1);
  const [currentStep, setCurrentStep] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleStart = async () => {
    setRunning(true);
    setLogs([]);
    setResults([]);
    setSummary(null);
    setCurrentQueryIndex(0);

    abortRef.current = new AbortController();

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-knowledge-graph`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ queries, autoApproveThreshold: 70 }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        addLog(`❌ Error: ${resp.status} ${resp.statusText}`);
        setRunning(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(currentEvent, data);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addLog(`❌ ${String(err)}`);
      }
    } finally {
      setRunning(false);
    }
  };

  const handleSSEEvent = (event: string, data: any) => {
    switch (event) {
      case 'start':
        addLog(`🚀 ${t('enrich.log.starting', { count: data.totalQueries })}`);
        break;
      case 'query_start':
        setCurrentQueryIndex(data.index);
        addLog(`\n📋 Query ${data.index + 1}: "${data.query}"`);
        break;
      case 'step': {
        const label = STEP_LABELS[data.step]?.[lang] || data.step;
        setCurrentStep(data.step);
        addLog(`  ⏳ ${label}${data.title ? ` - ${data.title}` : ''}`);
        break;
      }
      case 'step_complete': {
        const label = STEP_LABELS[data.step]?.[lang] || data.step;
        const extra = data.count != null ? ` (${data.count})` : data.found != null ? ` (${data.found})` : data.approved != null ? ` (${data.approved})` : '';
        addLog(`  ✅ ${label}${extra}`);
        break;
      }
      case 'step_error':
        addLog(`  ⚠️ ${data.step}: ${data.error?.slice(0, 120)}`);
        break;
      case 'query_complete':
        setResults(prev => [...prev, data]);
        if (data.status === 'success') {
          addLog(`  🎉 "${data.title?.slice(0, 60)}..." → ${data.tripletsGenerated} triplets, ${data.tripletsApproved} approved`);
        } else {
          addLog(`  ❌ ${data.status}: ${data.title || data.error || ''}`);
        }
        break;
      case 'complete':
        setSummary(data);
        addLog(`\n✅ ${t('enrich.log.complete', { studies: data.totalStudiesProcessed, triplets: data.totalTripletsCreated, approved: data.totalTripletsApproved })}`);
        break;
      case 'error':
        addLog(`❌ ${data.message}`);
        break;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setRunning(false);
    addLog('🛑 Cancelled');
  };

  const addQuery = () => {
    if (newQuery.trim() && !queries.includes(newQuery.trim())) {
      setQueries(prev => [...prev, newQuery.trim()]);
      setNewQuery('');
    }
  };

  const removeQuery = (idx: number) => {
    setQueries(prev => prev.filter((_, i) => i !== idx));
  };

  const progress = queries.length > 0 && currentQueryIndex >= 0
    ? Math.round(((currentQueryIndex + (currentStep ? 0.5 : 0)) / queries.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={running ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('enrich.title', 'Enrich Knowledge Graph')}
          </DialogTitle>
          <DialogDescription>
            {t('enrich.description', 'Search, download, extract, and auto-approve real scientific studies to enrich the knowledge graph.')}
          </DialogDescription>
        </DialogHeader>

        {/* Queries list */}
        {!running && !summary && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t('enrich.queries', 'Search Queries')}</p>
            <div className="space-y-1.5">
              {queries.map((q, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="font-mono text-xs">{i + 1}</Badge>
                  <span className="flex-1 truncate">{q}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeQuery(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t('enrich.addQuery', 'Add custom query...')}
                value={newQuery}
                onChange={e => setNewQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuery()}
                className="h-8 text-sm"
              />
              <Button variant="outline" size="sm" onClick={addQuery} disabled={!newQuery.trim()}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress */}
        {running && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('enrich.progress', 'Processing query {{current}} of {{total}}', { current: currentQueryIndex + 1, total: queries.length })}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{summary.totalStudiesProcessed}</p>
              <p className="text-xs text-muted-foreground">{t('enrich.summary.studies', 'Studies')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{summary.totalTripletsCreated}</p>
              <p className="text-xs text-muted-foreground">{t('enrich.summary.triplets', 'Triplets')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{summary.totalTripletsApproved}</p>
              <p className="text-xs text-muted-foreground">{t('enrich.summary.approved', 'Approved')}</p>
            </div>
          </div>
        )}

        {/* Results badges */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {results.map((r, i) => (
              <Badge key={i} variant={r.status === 'success' ? 'default' : 'destructive'} className="text-xs gap-1">
                {r.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {r.title?.slice(0, 30) || r.query.slice(0, 20)}...
              </Badge>
            ))}
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] bg-muted/30 rounded-lg p-3">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          </ScrollArea>
        )}

        <DialogFooter>
          {!running && !summary && (
            <Button onClick={handleStart} disabled={queries.length === 0} className="gap-2">
              <Play className="h-4 w-4" />
              {t('enrich.start', 'Start Enrichment')}
            </Button>
          )}
          {running && (
            <Button variant="destructive" onClick={handleCancel} className="gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          {summary && (
            <Button onClick={() => onOpenChange(false)}>
              {t('common.close', 'Close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
