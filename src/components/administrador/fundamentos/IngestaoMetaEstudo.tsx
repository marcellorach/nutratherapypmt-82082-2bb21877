import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Sparkles, Upload, FileText, CheckCircle2, Trash2, AlertTriangle,
  Circle, XCircle, ChevronDown, X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Claim { claim: string; quote?: string; weight?: number }
interface SuggestedLink {
  rule_id: string;
  relation: 'supports' | 'contradicts' | 'modulates_weight' | 'inspires';
  weight?: number;
  quote?: string;
  rationale?: string;
  _enabled?: boolean;
}
interface LessonItem {
  statement: string;
  quote?: string;
  weight?: number;
  applies_to?: string;
}
interface ProposedRule {
  proposed_title: string;
  category?: string;
  enunciado: string;
  justification_quote?: string;
  suggested_application?: string;
  confidence?: number;
  _action?: 'promote' | 'discard' | null;
}
interface Draft {
  title: string;
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  source_url?: string;
  pdf_storage_path?: string;
  kind: string;
  summary?: string;
  key_claims: Claim[];
  suggested_links: SuggestedLink[];
  architectural_patterns?: LessonItem[];
  methodological_recipes?: LessonItem[];
  vocabularies_standards?: LessonItem[];
  quantitative_parameters?: LessonItem[];
  anti_patterns_pitfalls?: LessonItem[];
  evaluation_metrics?: LessonItem[];
  open_questions?: LessonItem[];
  proposed_rules?: ProposedRule[];
}

type TraceStatus = 'pending' | 'running' | 'success' | 'error';
interface TraceLine {
  stage: string;
  label: string;
  status: TraceStatus;
  detail?: string;
  duration_ms?: number;
}
interface FailureInfo { stage: string; message: string; options?: string[] }

const STAGES: Array<{ key: string; label: string }> = [
  { key: 'upload', label: 'Upload do documento' },
  { key: 'extraction', label: 'Extração de texto / anexo do PDF' },
  { key: 'rules_catalog', label: 'Catálogo de Regras-Core carregado' },
  { key: 'llm_analysis', label: 'Análise pelo Gemini 3 Pro' },
  { key: 'structuring', label: 'Rascunho estruturado pronto' },
];

const ACCEPT = '.pdf,.md,.txt,.docx,application/pdf,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_BYTES = 20 * 1024 * 1024;

const RELATION_COLOR: Record<string, string> = {
  supports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contradicts: 'bg-red-50 text-red-700 border-red-200',
  modulates_weight: 'bg-blue-50 text-blue-700 border-blue-200',
  inspires: 'bg-purple-50 text-purple-700 border-purple-200',
};

const LESSON_SECTIONS: Array<{ key: keyof Draft; label: string; tone: string }> = [
  { key: 'architectural_patterns',  label: 'Padrões arquiteturais',       tone: 'border-l-purple-400' },
  { key: 'methodological_recipes',  label: 'Receitas metodológicas',      tone: 'border-l-blue-400' },
  { key: 'vocabularies_standards',  label: 'Vocabulários e padrões',      tone: 'border-l-cyan-400' },
  { key: 'quantitative_parameters', label: 'Parâmetros quantitativos',    tone: 'border-l-emerald-400' },
  { key: 'anti_patterns_pitfalls',  label: 'Anti-padrões / armadilhas',   tone: 'border-l-red-400' },
  { key: 'evaluation_metrics',      label: 'Métricas de avaliação',       tone: 'border-l-amber-400' },
  { key: 'open_questions',          label: 'Perguntas em aberto',         tone: 'border-l-slate-400' },
];

function StatusIcon({ status }: { status: TraceStatus }) {
  if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === 'error') return <XCircle className="h-3.5 w-3.5 text-red-600" />;
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />;
}

interface Props { onSaved?: () => void }

const IngestaoMetaEstudo: React.FC<Props> = ({ onSaved }) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [curatorNotes, setCuratorNotes] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [trace, setTrace] = useState<TraceLine[]>(
    STAGES.map(s => ({ stage: s.key, label: s.label, status: 'pending' as TraceStatus }))
  );
  const [failure, setFailure] = useState<FailureInfo | null>(null);

  const setStage = (key: string, patch: Partial<TraceLine>) => {
    setTrace(prev => prev.map(t => t.stage === key ? { ...t, ...patch } : t));
  };
  const resetTrace = () => {
    setTrace(STAGES.map(s => ({ stage: s.key, label: s.label, status: 'pending' as TraceStatus })));
    setFailure(null);
  };

  const onFile = (f: File | null) => {
    if (!f) { setFile(null); return; }
    if (f.size > MAX_BYTES) {
      toast.error('Arquivo excede 20MB.');
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, []);

  const analyze = async () => {
    if (!file) {
      toast.error('Anexe um documento (PDF, .md, .txt ou .docx) para iniciar.');
      return;
    }
    setAnalyzing(true);
    setDraft(null);
    resetTrace();
    try {
      // Stage 1 — upload
      setStage('upload', { status: 'running' });
      const t0 = performance.now();
      const path = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
      const mime = file.type || (path.match(/\.(md|txt)$/i) ? 'text/plain' : 'application/pdf');
      const up = await supabase.storage.from('meta_studies_pdfs').upload(path, file, {
        upsert: false, contentType: mime,
      });
      if (up.error) {
        setStage('upload', { status: 'error', detail: up.error.message });
        throw up.error;
      }
      setStage('upload', {
        status: 'success',
        duration_ms: Math.round(performance.now() - t0),
        detail: `${file.name} · ${(file.size / 1024).toFixed(0)} KB`,
      });

      // Stages 2..5 will be reported by the edge function via `trace`
      ['extraction', 'rules_catalog', 'llm_analysis', 'structuring'].forEach(s =>
        setStage(s, { status: 'running' })
      );

      const { data, error } = await supabase.functions.invoke('extract-meta-study', {
        body: {
          source_url: sourceUrl.trim() || undefined,
          pdf_storage_path: path,
          pdf_mime: mime,
          curator_notes: curatorNotes.trim() || undefined,
        },
      });

      // supabase.functions.invoke returns a FunctionsHttpError whose `context`
      // is the raw Response — we need to parse its body to get { error, stage, options, trace }.
      let errorPayload: any = null;
      if (error) {
        const ctx: any = (error as any).context;
        try {
          if (ctx && typeof ctx.json === 'function') {
            errorPayload = await ctx.clone().json();
          } else if (ctx && typeof ctx.text === 'function') {
            errorPayload = JSON.parse(await ctx.clone().text());
          } else if (typeof ctx?.body === 'string') {
            errorPayload = JSON.parse(ctx.body);
          } else if (ctx?.body) {
            errorPayload = ctx.body;
          }
        } catch { /* noop */ }
      }

      const effective = errorPayload || data;
      if (Array.isArray(effective?.trace)) {
        effective.trace.forEach((t: any) => {
          const status: TraceStatus = t.status === 'success' ? 'success' : t.status === 'error' ? 'error' : 'pending';
          setStage(t.stage, { status, detail: t.detail, duration_ms: t.duration_ms });
        });
      }

      if (error || data?.error) {
        setTrace(prev => prev.map(t => t.status === 'running' ? { ...t, status: 'error', detail: t.detail || 'Não executado' } : t));
        const msg = (effective?.error as string) || (error as any)?.message || 'Falha desconhecida.';
        const opts: string[] | undefined = Array.isArray(effective?.options) ? effective.options : undefined;
        const stg: string = effective?.stage || 'llm_analysis';
        setFailure({ stage: stg, message: msg, options: opts });
        throw new Error(msg);
      }

      const d: Draft = {
        ...data.draft,
        source_url: sourceUrl || undefined,
        pdf_storage_path: path,
        suggested_links: (data.draft.suggested_links || []).map((l: SuggestedLink) => ({ ...l, _enabled: true })),
        proposed_rules: (data.draft.proposed_rules || []).map((p: ProposedRule) => ({ ...p, _action: null })),
      };
      setDraft(d);
      toast.success('Rascunho gerado — revise antes de aprovar.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Falha ao analisar. Veja o log de digestão.');
    } finally {
      setAnalyzing(false);
    }
  };

  const approve = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { data: inserted, error: insErr } = await supabase
        .from('meta_studies')
        .insert([{
          title: draft.title,
          authors: draft.authors || null,
          year: draft.year || null,
          journal: draft.journal || null,
          doi: draft.doi || null,
          source_url: draft.source_url || null,
          pdf_storage_path: draft.pdf_storage_path || null,
          kind: draft.kind,
          summary: draft.summary || null,
          key_claims: (draft.key_claims || []) as any,
          architectural_patterns:  (draft.architectural_patterns  || []) as any,
          methodological_recipes:  (draft.methodological_recipes  || []) as any,
          vocabularies_standards:  (draft.vocabularies_standards  || []) as any,
          quantitative_parameters: (draft.quantitative_parameters || []) as any,
          anti_patterns_pitfalls:  (draft.anti_patterns_pitfalls  || []) as any,
          evaluation_metrics:      (draft.evaluation_metrics      || []) as any,
          open_questions:          (draft.open_questions          || []) as any,
          proposed_rules:          (draft.proposed_rules          || []) as any,
          extraction_schema_version: 'v2',
          curator_notes: curatorNotes.trim() || null,
        }])
        .select('id')
        .single();
      if (insErr) throw insErr;
      const studyId = inserted.id;

      const enabledLinks = (draft.suggested_links || []).filter(l => l._enabled);
      if (enabledLinks.length) {
        const ruleIds = Array.from(new Set(enabledLinks.map(l => l.rule_id)));
        const { data: ruleRows, error: rErr } = await supabase
          .from('core_rules').select('id, rule_id').in('rule_id', ruleIds);
        if (rErr) throw rErr;
        const byCode = new Map((ruleRows || []).map((r: any) => [r.rule_id, r.id]));
        const rows = enabledLinks
          .filter(l => byCode.has(l.rule_id))
          .map(l => ({
            rule_id: byCode.get(l.rule_id),
            meta_study_id: studyId,
            relation: l.relation,
            weight: typeof l.weight === 'number' ? Math.min(1, Math.max(0, l.weight)) : 1.0,
            quote: l.quote || null,
            notes: l.rationale || null,
          }));
        if (rows.length) {
          const { error: evErr } = await supabase.from('core_rule_evidence').insert(rows);
          if (evErr) throw evErr;
        }
      }

      // Promote any proposed_rules the curator marked as 'promote' into core_rules
      // with origin='deductive' and provenance back to this meta-study.
      const toPromote = (draft.proposed_rules || []).filter(p => p._action === 'promote');
      if (toPromote.length) {
        const { data: existing } = await supabase
          .from('core_rules').select('rule_id').order('rule_id', { ascending: false }).limit(1);
        let nextN = 1;
        const lastCode = existing?.[0]?.rule_id;
        if (lastCode && /^RC-\d+$/.test(lastCode)) {
          nextN = parseInt(lastCode.slice(3), 10) + 1;
        }
        const { data: userData } = await supabase.auth.getUser();
        const rows = toPromote.map((p, idx) => ({
          rule_id: `RC-${String(nextN + idx).padStart(3, '0')}`,
          title: p.proposed_title.slice(0, 200),
          category: p.category || 'uncategorized',
          status: 'active',
          version: '1.0.0',
          justification: p.enunciado,
          application: p.suggested_application || null,
          runtime_effect: 'doc_only',
          origin: 'deductive',
          proposed_from_meta_study: studyId,
          promoted_at: new Date().toISOString(),
          promoted_by: userData?.user?.id ?? null,
        }));
        const { error: rcErr } = await supabase.from('core_rules').insert(rows as any);
        if (rcErr) {
          console.warn('Falha ao promover RCs propostas:', rcErr);
          toast.warning(`Meta-estudo salvo, mas ${toPromote.length} RC(s) propostas não foram promovidas: ${rcErr.message}`);
        } else {
          toast.success(`${toPromote.length} nova(s) RC(s) deduzida(s) promovida(s).`);
        }
      }

      toast.success('Meta-estudo aprovado e vinculado.');
      setDraft(null); setFile(null); setSourceUrl(''); setCuratorNotes(''); resetTrace();
      onSaved?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-3 text-xs text-muted-foreground flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
          <span>
            Ingestão <b>NÃO grava direto</b>: a IA produz um rascunho, você revisa/edita os
            vínculos com Regras-Core sugeridos e aprova manualmente. Estudos aqui são <b>arquiteturais</b>
            {' '}(governança do pipeline), não clínicos.
          </span>
        </CardContent>
      </Card>

      {!draft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" /> Novo meta-estudo
            </CardTitle>
            <CardDescription>
              Anexe o documento-fonte (PDF, .md, .txt ou .docx). Opcionalmente acrescente notas
              do curador para orientar a IA. Processado por <b>Gemini 3 Pro</b>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropzone — required */}
            <div>
              <Label className="text-xs flex items-center gap-1">
                <Upload className="h-3 w-3" /> Documento-fonte <span className="text-red-600">*</span>
              </Label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`mt-1 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-purple-500 bg-purple-50/50' : 'border-muted-foreground/30 hover:border-muted-foreground/60'
                }`}
                onClick={() => document.getElementById('meta-file-input')?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground text-xs">· {(file.size / 1024).toFixed(0)} KB</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <Upload className="h-5 w-5 mx-auto mb-1.5 opacity-60" />
                    <div>Arraste o arquivo aqui ou <span className="text-purple-700 font-medium">clique para selecionar</span></div>
                    <div className="text-[10px] mt-1">PDF, .md, .txt, .docx · até 20MB</div>
                  </div>
                )}
                <input
                  id="meta-file-input"
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={e => onFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* Curator notes */}
            <div>
              <Label className="text-xs">Notas do curador <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                value={curatorNotes}
                onChange={e => setCuratorNotes(e.target.value)}
                placeholder="Diretrizes para a IA sobre este paper: como ponderar, claims a ignorar, RCs já cobertas, contexto histórico, etc. Aceita markdown."
                className="min-h-24 text-xs"
                maxLength={4000}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {curatorNotes.length}/4000 — injetado no prompt como contexto vinculante, não como conteúdo do estudo.
              </p>
            </div>

            {/* Optional metadata */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1 select-none">
                <ChevronDown className="h-3 w-3" /> Metadados adicionais (opcional)
              </summary>
              <div className="mt-2 pl-4">
                <Label className="text-xs">DOI / URL da fonte</Label>
                <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://doi.org/..." />
              </div>
            </details>

            <Button onClick={analyze} disabled={analyzing || !file}>
              {analyzing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analisando…</> : <><Sparkles className="h-4 w-4 mr-1" /> Analisar com IA</>}
            </Button>

            {/* Digestion log */}
            <div className="border rounded-md p-3 bg-muted/20">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Log de digestão
              </div>
              <ol className="space-y-1.5">
                {trace.map((t, i) => (
                  <li key={t.stage} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5"><StatusIcon status={t.status} /></span>
                    <span className="text-muted-foreground font-mono w-4">{i + 1}.</span>
                    <div className="flex-1">
                      <div className={`font-medium ${t.status === 'error' ? 'text-red-700' : t.status === 'success' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {t.label}
                        {typeof t.duration_ms === 'number' && (
                          <span className="ml-2 text-[10px] text-muted-foreground">{t.duration_ms}ms</span>
                        )}
                      </div>
                      {t.detail && (
                        <div className={`text-[11px] mt-0.5 ${t.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {t.detail}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {failure?.options && failure.options.length > 0 && (
                <div className="mt-3 border border-amber-300 bg-amber-50 rounded p-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Opções para contornar (sem descartar parte do estudo)
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-900">
                    {failure.options.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {draft && (
        <Card className="border-l-4 border-l-purple-400">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Rascunho — revise antes de aprovar
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                <Trash2 className="h-3 w-3 mr-1" /> Descartar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Título</Label>
                <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div><Label className="text-xs">Autores</Label>
                <Input value={draft.authors || ''} onChange={e => setDraft({ ...draft, authors: e.target.value })} /></div>
              <div><Label className="text-xs">Ano</Label>
                <Input type="number" value={draft.year || ''} onChange={e => setDraft({ ...draft, year: parseInt(e.target.value) || undefined })} /></div>
              <div><Label className="text-xs">Journal</Label>
                <Input value={draft.journal || ''} onChange={e => setDraft({ ...draft, journal: e.target.value })} /></div>
              <div><Label className="text-xs">DOI</Label>
                <Input value={draft.doi || ''} onChange={e => setDraft({ ...draft, doi: e.target.value })} /></div>
              <div className="col-span-2">
                <Label className="text-xs">Tipo</Label>
                <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="architectural">architectural</SelectItem>
                    <SelectItem value="translational">translational</SelectItem>
                    <SelectItem value="methodological">methodological</SelectItem>
                    <SelectItem value="inspiration">inspiration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Resumo</Label>
                <Textarea value={draft.summary || ''} onChange={e => setDraft({ ...draft, summary: e.target.value })} className="min-h-20 text-xs" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide">Claims-chave ({draft.key_claims.length})</Label>
              <ul className="space-y-1 mt-1 text-xs">
                {draft.key_claims.map((c, i) => (
                  <li key={i} className="border rounded px-2 py-1.5">
                    <div className="font-medium">{c.claim}</div>
                    {c.quote && <div className="text-muted-foreground italic mt-0.5">"{c.quote}"</div>}
                    {typeof c.weight === 'number' && <Badge variant="outline" className="text-[10px] mt-1">w={c.weight}</Badge>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Lições estruturadas (schema v2) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Lições estruturadas ({LESSON_SECTIONS.reduce((n, s) => n + ((draft as any)[s.key]?.length || 0), 0)})
              </Label>
              {LESSON_SECTIONS.map(section => {
                const items = ((draft as any)[section.key] || []) as LessonItem[];
                if (!items.length) return null;
                return (
                  <details key={String(section.key)} className={`border-l-2 ${section.tone} pl-2`} open={items.length <= 3}>
                    <summary className="cursor-pointer text-xs font-medium select-none">
                      {section.label} <span className="text-muted-foreground">({items.length})</span>
                    </summary>
                    <ul className="space-y-1 mt-1.5 text-xs">
                      {items.map((it, i) => (
                        <li key={i} className="border rounded px-2 py-1.5">
                          <div className="font-medium">{it.statement}</div>
                          {it.quote && <div className="text-muted-foreground italic mt-0.5">"{it.quote}"</div>}
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {typeof it.weight === 'number' && <Badge variant="outline" className="text-[10px]">w={it.weight}</Badge>}
                            {it.applies_to && <Badge variant="outline" className="text-[10px]">→ {it.applies_to}</Badge>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
              {LESSON_SECTIONS.every(s => !((draft as any)[s.key]?.length)) && (
                <p className="text-[11px] text-muted-foreground italic">
                  Nenhuma lição estruturada extraída — o paper pode ser denso demais para uma única passada ou o schema v2 ainda não foi aplicado. Considere re-digerir.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Vínculos sugeridos com Regras-Core ({draft.suggested_links.filter(l => l._enabled).length}/{draft.suggested_links.length})
              </Label>
              {draft.suggested_links.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-1">Nenhum vínculo sugerido — você ainda pode aprovar o meta-estudo isoladamente.</p>
              ) : (
                <ul className="space-y-1.5 mt-1 text-xs">
                  {draft.suggested_links.map((l, i) => (
                    <li key={i} className={`border rounded px-2 py-1.5 ${l._enabled ? '' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="checkbox" checked={!!l._enabled}
                          onChange={e => {
                            const copy = [...draft.suggested_links];
                            copy[i] = { ...copy[i], _enabled: e.target.checked };
                            setDraft({ ...draft, suggested_links: copy });
                          }} />
                        <Badge variant="outline" className="font-mono">{l.rule_id}</Badge>
                        <Badge className={RELATION_COLOR[l.relation]}>{l.relation}</Badge>
                        <Badge variant="outline" className="text-[10px]">w={l.weight ?? 1}</Badge>
                      </div>
                      {l.quote && <div className="text-muted-foreground italic mt-1">"{l.quote}"</div>}
                      {l.rationale && <div className="text-muted-foreground mt-0.5">— {l.rationale}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* RCs deduzidas propostas pelo paper */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-purple-600" />
                Novas Regras-Core propostas ({(draft.proposed_rules || []).length})
                <span className="text-[10px] font-normal text-muted-foreground normal-case">
                  — deduzidas deste paper, origem='deductive'
                </span>
              </Label>
              {(draft.proposed_rules || []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-1">
                  A IA não propôs novas regras — todas as lições já mapearam para RCs existentes (ou o paper é mais ilustrativo do que normativo).
                </p>
              ) : (
                <ul className="space-y-1.5 mt-1 text-xs">
                  {(draft.proposed_rules || []).map((p, i) => (
                    <li key={i} className={`border rounded px-2 py-2 ${p._action === 'promote' ? 'border-emerald-400 bg-emerald-50/40' : p._action === 'discard' ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">PROPOSTA</Badge>
                        {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                        {typeof p.confidence === 'number' && <Badge variant="outline" className="text-[10px]">conf={p.confidence.toFixed(2)}</Badge>}
                      </div>
                      <div className="font-medium">{p.proposed_title}</div>
                      <div className="text-muted-foreground mt-0.5">{p.enunciado}</div>
                      {p.justification_quote && <div className="text-muted-foreground italic mt-1">"{p.justification_quote}"</div>}
                      {p.suggested_application && (
                        <div className="text-[11px] mt-1"><span className="text-muted-foreground">Aplicação sugerida:</span> <code className="text-[10px]">{p.suggested_application}</code></div>
                      )}
                      <div className="flex gap-1.5 mt-2">
                        <Button
                          size="sm"
                          variant={p._action === 'promote' ? 'default' : 'outline'}
                          className="h-6 text-[11px]"
                          onClick={() => {
                            const copy = [...(draft.proposed_rules || [])];
                            copy[i] = { ...copy[i], _action: copy[i]._action === 'promote' ? null : 'promote' };
                            setDraft({ ...draft, proposed_rules: copy });
                          }}
                        >
                          {p._action === 'promote' ? '✓ Promover para nova RC' : 'Promover para nova RC'}
                        </Button>
                        <Button
                          size="sm"
                          variant={p._action === 'discard' ? 'secondary' : 'ghost'}
                          className="h-6 text-[11px]"
                          onClick={() => {
                            const copy = [...(draft.proposed_rules || [])];
                            copy[i] = { ...copy[i], _action: copy[i]._action === 'discard' ? null : 'discard' };
                            setDraft({ ...draft, proposed_rules: copy });
                          }}
                        >
                          {p._action === 'discard' ? '✓ Descartar' : 'Descartar'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                Não marcadas serão salvas no meta-estudo como candidatas (campo <code>proposed_rules</code>) sem virar RC ativa — você pode promovê-las depois.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={approve} disabled={saving || !draft.title}>
                {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Salvando…</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar e salvar</>}
              </Button>
              <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IngestaoMetaEstudo;