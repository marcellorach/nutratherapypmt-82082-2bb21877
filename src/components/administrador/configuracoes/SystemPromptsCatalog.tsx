import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X, RotateCcw, Search, Layers3, AlertCircle, RefreshCw, FileDown, Printer, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { APP_VERSION } from '@/config/app-version';

interface SystemPrompt {
  id: string;
  prompt_key: string;
  family: string;
  function_name: string | null;
  display_name: string;
  description: string | null;
  default_content: string;
  override_content: string | null;
  has_override: boolean;
  is_active: boolean;
  variables: any;
  purpose: string | null;
  model_default: string | null;
  temperature: number | null;
  output_format: string | null;
  consumers: string[] | null;
  tags: string[] | null;
  example_input: string | null;
  last_used_at: string | null;
}

interface IntegrityCheck {
  id: string;
  app_version: string;
  manifest_count: number;
  db_count: number;
  missing_in_db: string[];
  extra_in_db: string[];
  out_of_sync: string[];
  hardcoded_outside_catalog: Array<{ function_name: string; suggested_key: string; note: string }>;
  status: 'ok' | 'drift' | 'error';
  triggered_by: string;
  checked_at: string;
}

const SystemPromptsCatalog: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [integrity, setIntegrity] = useState<IntegrityCheck | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showIntegrityDetails, setShowIntegrityDetails] = useState(false);
  const autoSyncedRef = React.useRef(false);
  const autoVerifiedRef = React.useRef(false);

  const loadIntegrity = async () => {
    const { data } = await supabase
      .from('ai_system_prompts_integrity_check')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setIntegrity(data as unknown as IntegrityCheck);
  };

  const runVerify = async (triggeredBy: 'manual' | 'auto_on_version_bump' = 'manual') => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-system-prompts', {
        body: { app_version: APP_VERSION, triggered_by: triggeredBy },
      });
      if (error) throw error;
      if ((data as any)?.check) setIntegrity((data as any).check as IntegrityCheck);
      if (triggeredBy === 'manual') {
        toast({ title: t('admin.systemPrompts.integrity.verifiedToast') });
      }
    } catch (e: any) {
      if (triggeredBy === 'manual') {
        toast({
          variant: 'destructive',
          title: t('admin.systemPrompts.integrity.verifyFailed'),
          description: e.message,
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_system_prompts')
      .select('*')
      .order('family')
      .order('display_name');
    if (error) {
      toast({ variant: 'destructive', title: t('admin.systemPrompts.toast.loadError'), description: error.message });
    } else {
      setPrompts(data as SystemPrompt[]);
    }
    setLoading(false);
    return (data as SystemPrompt[] | null) ?? [];
  };

  const runSync = async (silent = false): Promise<boolean> => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-system-prompts', { method: 'POST' });
      if (error) throw error;
      const updated = (data as any)?.updated ?? 0;
      const total = (data as any)?.total_in_manifest ?? 0;
      if (!silent) {
        toast({
          title: t('admin.systemPrompts.toast.syncedTitle'),
          description: t('admin.systemPrompts.toast.syncedDesc', { updated, total }),
        });
      }
      await load();
      return true;
    } catch (e: any) {
      if (!silent) {
        toast({ variant: 'destructive', title: t('admin.systemPrompts.toast.syncFailed'), description: e.message });
      }
      return false;
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const rows = await load();
      // Auto-sync silencioso se qualquer prompt está sem conteúdo
      if (!autoSyncedRef.current && rows.some((p) => !p.default_content && !p.override_content)) {
        autoSyncedRef.current = true;
        await runSync(true);
      }
      await loadIntegrity();
      // Verificação automática a cada subida de versão do sistema
      if (!autoVerifiedRef.current && typeof window !== 'undefined') {
        const last = localStorage.getItem('lastVerifiedAppVersion');
        if (last !== APP_VERSION) {
          autoVerifiedRef.current = true;
          localStorage.setItem('lastVerifiedAppVersion', APP_VERSION);
          await runVerify('auto_on_version_bump');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const filtered = prompts.filter(
      (p) =>
        !query ||
        p.display_name.toLowerCase().includes(query.toLowerCase()) ||
        p.prompt_key.toLowerCase().includes(query.toLowerCase()) ||
        (p.function_name ?? '').toLowerCase().includes(query.toLowerCase()) ||
        p.family.toLowerCase().includes(query.toLowerCase()) ||
        (p.tags ?? []).some((tg) => tg.toLowerCase().includes(query.toLowerCase())) ||
        (p.model_default ?? '').toLowerCase().includes(query.toLowerCase()),
    );
    const map = new Map<string, SystemPrompt[]>();
    filtered.forEach((p) => {
      if (!map.has(p.family)) map.set(p.family, []);
      map.get(p.family)!.push(p);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [prompts, query]);

  // PDF export — abre janela com HTML estilizado e dispara o diálogo "Salvar como PDF" do navegador.
  const exportPdf = (items: SystemPrompt[], filename: string) => {
    const esc = (s: string | null | undefined) =>
      String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const generatedAt = new Date().toLocaleString('pt-BR');
    const byFamily = new Map<string, SystemPrompt[]>();
    items.forEach((p) => {
      if (!byFamily.has(p.family)) byFamily.set(p.family, []);
      byFamily.get(p.family)!.push(p);
    });
    const sections = Array.from(byFamily.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fam, list]) => {
        const cards = list
          .map((p) => {
            const effective = p.override_content || p.default_content || '';
            const meta: Array<[string, string]> = [
              ['Chave', p.prompt_key],
              ['Função consumidora', (p.consumers ?? []).join(', ') || p.function_name || '—'],
              ['Modelo padrão', p.model_default || '—'],
              ['Temperatura', p.temperature == null ? '—' : String(p.temperature)],
              ['Formato de saída', p.output_format || '—'],
              ['Tags', (p.tags ?? []).join(', ') || '—'],
              ['Override ativo', p.has_override ? 'sim (conteúdo customizado pelo admin)' : 'não (default do manifest)'],
              ['Tamanho efetivo', `${effective.length} caracteres`],
            ];
            const metaRows = meta
              .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
              .join('');
            return `
              <article class="prompt">
                <h3>${esc(p.display_name)}</h3>
                ${p.purpose ? `<p class="purpose"><strong>Propósito.</strong> ${esc(p.purpose)}</p>` : ''}
                <table class="meta">${metaRows}</table>
                ${p.example_input ? `<p class="example"><strong>Exemplo de input:</strong> <code>${esc(p.example_input)}</code></p>` : ''}
                <h4>Conteúdo do prompt</h4>
                <pre>${esc(effective || '(sem conteúdo)')}</pre>
              </article>`;
          })
          .join('');
        return `<section class="family"><h2>${esc(fam)} <span class="count">(${list.length})</span></h2>${cards}</section>`;
      })
      .join('');
    const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(filename)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color:#1a1a1a; font-size:11px; line-height:1.45; }
  header.cover { border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px; }
  header.cover h1 { font-size:22px; margin:0 0 4px 0; }
  header.cover p { margin:2px 0; color:#555; font-size:11px; }
  section.family { page-break-inside: avoid; margin-top:18px; }
  section.family > h2 { font-size:14px; border-left:4px solid #4f46e5; padding-left:8px; margin:0 0 8px 0; }
  section.family .count { color:#888; font-weight:normal; font-size:11px; }
  article.prompt { border:1px solid #e2e2e2; border-radius:6px; padding:10px 12px; margin-bottom:10px; page-break-inside: avoid; }
  article.prompt h3 { font-size:13px; margin:0 0 4px 0; }
  article.prompt h4 { font-size:11px; margin:8px 0 4px; color:#444; text-transform:uppercase; letter-spacing:.04em; }
  .purpose { margin:4px 0 6px; color:#333; }
  .example { margin:6px 0; color:#444; }
  table.meta { width:100%; border-collapse:collapse; margin:4px 0 6px; }
  table.meta th { text-align:left; width:30%; font-weight:600; color:#555; padding:3px 6px; background:#f7f7f9; border:1px solid #ececf2; font-size:10px; }
  table.meta td { padding:3px 6px; border:1px solid #ececf2; font-size:10px; font-family: ui-monospace, Menlo, monospace; }
  pre { background:#0f172a; color:#e2e8f0; padding:10px 12px; border-radius:4px; font-size:9.5px; white-space:pre-wrap; word-break:break-word; font-family: ui-monospace, Menlo, monospace; }
  code { font-family: ui-monospace, Menlo, monospace; }
  footer { margin-top:20px; padding-top:8px; border-top:1px solid #ccc; color:#888; font-size:10px; }
</style></head>
<body>
  <header class="cover">
    <h1>Catálogo de System Prompts — Senex AI</h1>
    <p>Gerado em ${esc(generatedAt)} · ${items.length} prompt(s)</p>
    <p>Fonte: <code>ai_system_prompts</code> (override → default → manifest)</p>
  </header>
  ${sections}
  <footer>Senex AI · Plataforma operada pela PetMoreTime · Documento gerado automaticamente para revisão técnica/compliance.</footer>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.focus(); window.print(); }, 350); });</script>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      toast({ variant: 'destructive', title: 'Popup bloqueado', description: 'Permita popups para gerar o PDF do catálogo.' });
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const filteredFlat = useMemo(() => grouped.flatMap(([, list]) => list), [grouped]);

  const startEdit = (p: SystemPrompt) => {
    setEditingId(p.id);
    setDraft(p.override_content ?? p.default_content ?? '');
  };

  const saveOverride = async (p: SystemPrompt) => {
    const value = draft.trim() === '' ? null : draft;
    const { error } = await supabase
      .from('ai_system_prompts')
      .update({ override_content: value })
      .eq('id', p.id);
    if (error) {
      toast({ variant: 'destructive', title: t('admin.systemPrompts.toast.saveError'), description: error.message });
      return;
    }
    toast({ title: t('admin.systemPrompts.toast.savedTitle'), description: t('admin.systemPrompts.toast.savedDesc', { name: p.display_name }) });
    setEditingId(null);
    load();
  };

  const restoreDefault = async (p: SystemPrompt) => {
    const { error } = await supabase
      .from('ai_system_prompts')
      .update({ override_content: null })
      .eq('id', p.id);
    if (error) {
      toast({ variant: 'destructive', title: t('admin.systemPrompts.toast.error'), description: error.message });
      return;
    }
    toast({ title: t('admin.systemPrompts.toast.restoredTitle'), description: t('admin.systemPrompts.toast.restoredDesc', { name: p.display_name }) });
    setEditingId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <IntegrityBadge
        t={t}
        integrity={integrity}
        verifying={verifying}
        onVerify={() => runVerify('manual')}
        showDetails={showIntegrityDetails}
        onToggleDetails={() => setShowIntegrityDetails((v) => !v)}
      />
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-primary" />
                {t('admin.systemPrompts.title')}
              </CardTitle>
              <CardDescription>
                {t('admin.systemPrompts.description')}{' '}
                <code>supabase/functions/_shared/system-prompts.ts</code>.
              </CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runSync(false)}
                disabled={syncing}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {t('admin.systemPrompts.syncButton')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => exportPdf(filteredFlat, `catalogo-prompts-${new Date().toISOString().slice(0,10)}.pdf`)}
                disabled={filteredFlat.length === 0}
                title="Exportar catálogo completo em PDF (inclui contexto, modelo, formato e conteúdo)"
              >
                <FileDown className="h-3.5 w-3.5 mr-1" />
                Exportar PDF ({filteredFlat.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('admin.systemPrompts.searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">{t('admin.systemPrompts.loading')}</p>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('admin.systemPrompts.empty')}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {grouped.map(([family, list]) => (
            <AccordionItem key={family} value={family} className="border rounded-md px-3">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{family}</span>
                  <Badge variant="secondary">{list.length}</Badge>
                  {list.some((p) => p.has_override) && (
                    <Badge className="bg-amber-500 hover:bg-amber-500">{t('admin.systemPrompts.badge.overrideActive')}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {list.map((p) => {
                    const isEditing = editingId === p.id;
                    const effective = p.override_content ?? p.default_content;
                    return (
                      <Card key={p.id} className="border-border">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                {p.display_name}
                                {p.has_override && (
                                  <Badge className="bg-amber-500 hover:bg-amber-500 text-xs">{t('admin.systemPrompts.badge.override')}</Badge>
                                )}
                                {!effective && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 gap-1">
                                    <AlertCircle className="h-3 w-3" /> {t('admin.systemPrompts.badge.empty')}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                <code className="text-foreground">{p.prompt_key}</code>
                                {p.function_name && <> · {t('admin.systemPrompts.functionLabel')} <code className="text-foreground">{p.function_name}</code></>}
                              </CardDescription>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {p.model_default && (
                                  <Badge variant="outline" className="text-[10px] font-mono">{p.model_default}</Badge>
                                )}
                                {p.output_format && (
                                  <Badge variant="outline" className="text-[10px]">format: {p.output_format}</Badge>
                                )}
                                {typeof p.temperature === 'number' && (
                                  <Badge variant="outline" className="text-[10px]">temp: {p.temperature}</Badge>
                                )}
                                {(p.tags ?? []).map((tg) => (
                                  <Badge key={tg} variant="secondary" className="text-[10px]">{tg}</Badge>
                                ))}
                              </div>
                              {p.purpose && (
                                <p className="text-xs text-muted-foreground italic pt-1">{p.purpose}</p>
                              )}
                              {p.description && (
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {isEditing ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" onClick={() => saveOverride(p)}>
                                    <Save className="h-3.5 w-3.5 mr-1" /> {t('admin.systemPrompts.action.save')}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => exportPdf([p], `prompt-${p.prompt_key}.pdf`)} title="Exportar este prompt em PDF">
                                    <Printer className="h-3.5 w-3.5" />
                                  </Button>
                                  {p.has_override && (
                                    <Button size="sm" variant="ghost" onClick={() => restoreDefault(p)}>
                                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('admin.systemPrompts.action.default')}
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                                    <Edit2 className="h-3.5 w-3.5 mr-1" /> {t('admin.systemPrompts.action.edit')}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {isEditing ? (
                            <Textarea
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              rows={10}
                              className="font-mono text-xs"
                              placeholder={t('admin.systemPrompts.editorPlaceholder')}
                            />
                          ) : effective ? (
                            <ScrollArea className="h-32 bg-muted rounded-md p-3">
                              <pre className="text-xs whitespace-pre-wrap font-mono">{effective}</pre>
                            </ScrollArea>
                          ) : (
                            <p className="text-xs text-muted-foreground italic px-1">
                              {t('admin.systemPrompts.notCatalogued')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default SystemPromptsCatalog;

interface IntegrityBadgeProps {
  t: (key: string, opts?: any) => string;
  integrity: IntegrityCheck | null;
  verifying: boolean;
  onVerify: () => void;
  showDetails: boolean;
  onToggleDetails: () => void;
}

const IntegrityBadge: React.FC<IntegrityBadgeProps> = ({
  t,
  integrity,
  verifying,
  onVerify,
  showDetails,
  onToggleDetails,
}) => {
  const status = integrity?.status ?? 'ok';
  const isOk = status === 'ok' && integrity !== null;
  const isError = status === 'error';
  const driftCount = integrity
    ? integrity.missing_in_db.length +
      integrity.extra_in_db.length +
      integrity.out_of_sync.length +
      integrity.hardcoded_outside_catalog.length
    : 0;

  const checkedLabel = integrity
    ? new Date(integrity.checked_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('admin.systemPrompts.integrity.never');

  const statusBoxClass = isOk
    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900'
    : isError
      ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900'
      : 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900';

  return (
    <Card className={`border ${statusBoxClass}`}>
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isOk ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : isError ? (
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div className="text-xs space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {t('admin.systemPrompts.integrity.appVersion')} v{APP_VERSION}
                </Badge>
                {integrity && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    manifest {integrity.manifest_count} · db {integrity.db_count}
                  </Badge>
                )}
              </div>
              <div className="text-foreground font-medium">
                {isOk
                  ? t('admin.systemPrompts.integrity.statusOk')
                  : isError
                    ? t('admin.systemPrompts.integrity.statusError')
                    : t('admin.systemPrompts.integrity.statusDrift', { count: driftCount })}
              </div>
              <div className="text-muted-foreground">
                {t('admin.systemPrompts.integrity.lastChecked')}: {checkedLabel}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {integrity && !isOk && (
              <Button variant="ghost" size="sm" onClick={onToggleDetails}>
                {showDetails
                  ? t('admin.systemPrompts.integrity.hideDetails')
                  : t('admin.systemPrompts.integrity.showDetails')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onVerify} disabled={verifying}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${verifying ? 'animate-spin' : ''}`} />
              {verifying
                ? t('admin.systemPrompts.integrity.verifying')
                : t('admin.systemPrompts.integrity.verifyNow')}
            </Button>
          </div>
        </div>

        {integrity && showDetails && !isOk && (
          <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {integrity.missing_in_db.length > 0 && (
              <div>
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.missingInDb', { count: integrity.missing_in_db.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.missing_in_db.map((k) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {integrity.out_of_sync.length > 0 && (
              <div>
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.outOfSync', { count: integrity.out_of_sync.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.out_of_sync.map((k) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {integrity.extra_in_db.length > 0 && (
              <div>
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.extraInDb', { count: integrity.extra_in_db.length })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.extra_in_db.map((k) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {integrity.hardcoded_outside_catalog.length > 0 && (
              <div className="md:col-span-2">
                <div className="font-semibold mb-1">
                  {t('admin.systemPrompts.integrity.hardcoded', {
                    count: integrity.hardcoded_outside_catalog.length,
                  })}
                </div>
                <div className="flex flex-wrap gap-1">
                  {integrity.hardcoded_outside_catalog.map((h) => (
                    <Badge
                      key={h.function_name}
                      variant="outline"
                      className="font-mono text-[10px]"
                      title={h.note}
                    >
                      {h.function_name} → {h.suggested_key}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};