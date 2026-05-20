import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Upload, FileText, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
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
}

const RELATION_COLOR: Record<string, string> = {
  supports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contradicts: 'bg-red-50 text-red-700 border-red-200',
  modulates_weight: 'bg-blue-50 text-blue-700 border-blue-200',
  inspires: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface Props { onSaved?: () => void }

const IngestaoMetaEstudo: React.FC<Props> = ({ onSaved }) => {
  const [text, setText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  const analyze = async () => {
    if (!text.trim() && !pdfFile) {
      toast.error('Cole o texto do estudo ou anexe um PDF.');
      return;
    }
    setAnalyzing(true);
    try {
      let pdf_storage_path: string | undefined;
      if (pdfFile) {
        const path = `${Date.now()}_${pdfFile.name.replace(/[^\w.\-]/g, '_')}`;
        const up = await supabase.storage.from('meta_studies_pdfs').upload(path, pdfFile, {
          upsert: false, contentType: pdfFile.type || 'application/pdf',
        });
        if (up.error) throw up.error;
        pdf_storage_path = path;
      }
      const { data, error } = await supabase.functions.invoke('extract-meta-study', {
        body: { text: text.trim() || undefined, source_url: sourceUrl || undefined, pdf_storage_path },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const d: Draft = {
        ...data.draft,
        source_url: sourceUrl || undefined,
        pdf_storage_path,
        suggested_links: (data.draft.suggested_links || []).map((l: SuggestedLink) => ({ ...l, _enabled: true })),
      };
      setDraft(d);
      toast.success('Rascunho gerado — revise antes de aprovar.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Falha ao analisar.');
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
        }])
        .select('id')
        .single();
      if (insErr) throw insErr;
      const studyId = inserted.id;

      const enabledLinks = (draft.suggested_links || []).filter(l => l._enabled);
      if (enabledLinks.length) {
        // Resolve rule_id (text like "RC-001") -> uuid
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
      toast.success('Meta-estudo aprovado e vinculado.');
      setDraft(null); setText(''); setPdfFile(null); setSourceUrl('');
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
            (governança do pipeline), não clínicos.
          </span>
        </CardContent>
      </Card>

      {!draft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" /> Novo meta-estudo
            </CardTitle>
            <CardDescription>Cole o texto (abstract + conclusão funcionam bem) e/ou anexe o PDF. Gemini 2.5 Pro extrai e sugere vínculos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">URL da fonte (opcional)</Label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://doi.org/..." />
            </div>
            <div>
              <Label className="text-xs">Texto / .md / abstract</Label>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Cole aqui o conteúdo (mínimo ~50 caracteres). Para PDFs longos, prefira colar abstract + introdução + conclusão."
                className="min-h-40 font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{text.length} caracteres</p>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Upload className="h-3 w-3" /> PDF (opcional)</Label>
              <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
              {pdfFile && <p className="text-[10px] text-muted-foreground mt-1">{pdfFile.name} · {(pdfFile.size / 1024).toFixed(0)} KB</p>}
            </div>
            <Button onClick={analyze} disabled={analyzing}>
              {analyzing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analisando…</> : <><Sparkles className="h-4 w-4 mr-1" /> Analisar com IA</>}
            </Button>
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