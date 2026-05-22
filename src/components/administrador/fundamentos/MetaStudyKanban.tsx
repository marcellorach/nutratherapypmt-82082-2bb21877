import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Inbox, Filter, ClipboardList, ShieldCheck, Archive, Loader2, ChevronRight, ChevronLeft, Sparkles,
  ChevronDown, ChevronUp, Link2, ListChecks, MessageSquare, ExternalLink, ImageIcon, Network, Layers, FlaskConical, Microscope, BookOpen,
} from 'lucide-react';
import CoreRulesEvidenceBadge from './CoreRulesEvidenceBadge';
import MetaStudyChatDialog from './MetaStudyChatDialog';

type Lifecycle = 'inbox' | 'triaged' | 'in_review' | 'approved' | 'archived';

interface MetaStudyRow {
  id: string;
  title: string;
  authors?: string | null;
  year?: number | null;
  kind: string;
  source_url?: string | null;
  cover_image_url?: string | null;
  lifecycle_status: Lifecycle;
  reliability_methodology: number | null;
  reliability_evidence_base: number | null;
  reliability_applicability: number | null;
  reliability_reproducibility: number | null;
  reliability_relevance: number | null;
  reliability_overall: number | null;
  proposed_rules: any[];
  created_at: string;
}

const ORDER: Lifecycle[] = ['inbox', 'triaged', 'in_review', 'approved'];
const NEXT: Record<Lifecycle, Lifecycle | null> = {
  inbox: 'triaged',
  triaged: 'in_review',
  in_review: 'approved',
  approved: 'archived',
  archived: null,
};
const PREV: Record<Lifecycle, Lifecycle | null> = {
  inbox: null,
  triaged: 'inbox',
  in_review: 'triaged',
  approved: 'in_review',
  archived: 'approved',
};

const ICONS: Record<Lifecycle, React.ComponentType<{ className?: string }>> = {
  inbox: Inbox,
  triaged: Filter,
  in_review: ClipboardList,
  approved: ShieldCheck,
  archived: Archive,
};

function reliabilityBadgeClass(score: number | null) {
  if (score == null) return 'bg-slate-100 text-slate-600 border-slate-300';
  if (score >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (score >= 2.5) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

const DIM_KEYS: Array<keyof MetaStudyRow> = [
  'reliability_methodology',
  'reliability_evidence_base',
  'reliability_applicability',
  'reliability_reproducibility',
  'reliability_relevance',
];

const DIM_SHORT: Record<string, string> = {
  reliability_methodology: 'Metod.',
  reliability_evidence_base: 'Evid.',
  reliability_applicability: 'Aplic.',
  reliability_reproducibility: 'Reprod.',
  reliability_relevance: 'Relev.',
};

const DIM_COLOR: Record<string, string> = {
  reliability_methodology: 'bg-indigo-500',
  reliability_evidence_base: 'bg-emerald-500',
  reliability_applicability: 'bg-amber-500',
  reliability_reproducibility: 'bg-sky-500',
  reliability_relevance: 'bg-fuchsia-500',
};

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  architectural: Network,
  methodological: Layers,
  translational: FlaskConical,
  empirical: Microscope,
  ontological: BookOpen,
};

const KIND_GRADIENT: Record<string, string> = {
  architectural: 'from-indigo-200 to-sky-300',
  methodological: 'from-emerald-200 to-teal-300',
  translational: 'from-amber-200 to-orange-300',
  empirical: 'from-fuchsia-200 to-pink-300',
  ontological: 'from-slate-200 to-zinc-300',
};

const CoverThumb: React.FC<{ url?: string | null; kind: string; size?: number }> = ({ kind, size = 56 }) => {
  const Icon = KIND_ICON[kind] || Network;
  const gradient = KIND_GRADIENT[kind] || KIND_GRADIENT.architectural;
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-md border shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <Icon className="h-6 w-6 text-white/90" />
    </div>
  );
};

function computeOverall(scores: Record<string, number | null>): number | null {
  const filled = DIM_KEYS
    .map(k => scores[k as string])
    .filter((v): v is number => v != null);
  if (filled.length === 0) return null;
  return filled.reduce((a, b) => a + b, 0) / filled.length;
}

function ageInDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
}

const MetaStudyKanban: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<MetaStudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<MetaStudyRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [tripletCounts, setTripletCounts] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [edits, setEdits] = useState<Record<string, Partial<Record<keyof MetaStudyRow, number | null>>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [aiId, setAiId] = useState<string | null>(null);
  const [bulkAi, setBulkAi] = useState(false);
  const [chatId, setChatId] = useState<{ id: string; title: string } | null>(null);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [bulkCover, setBulkCover] = useState(false);

  const STATUS_LABEL: Record<Lifecycle, string> = {
    inbox: t('fundamentos.kanban.status.inbox', 'Caixa de entrada'),
    triaged: t('fundamentos.kanban.status.triaged', 'Triados'),
    in_review: t('fundamentos.kanban.status.in_review', 'Em revisão'),
    approved: t('fundamentos.kanban.status.approved', 'Aprovados'),
    archived: t('fundamentos.kanban.status.archived', 'Arquivados'),
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('meta_studies')
      .select('id,title,authors,year,kind,source_url,cover_image_url,lifecycle_status,reliability_methodology,reliability_evidence_base,reliability_applicability,reliability_reproducibility,reliability_relevance,reliability_overall,proposed_rules,created_at')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(t('fundamentos.kanban.loadError', 'Falha ao carregar Kanban'));
    } else {
      setRows((data as any) || []);
    }
    // Carregar contagem de evidências (tripletes) vinculadas a cada meta-estudo
    const { data: evRows } = await supabase
      .from('core_rule_evidence')
      .select('meta_study_id');
    if (evRows) {
      const map: Record<string, number> = {};
      (evRows as Array<{ meta_study_id: string | null }>).forEach(r => {
        if (r.meta_study_id) map[r.meta_study_id] = (map[r.meta_study_id] || 0) + 1;
      });
      setTripletCounts(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const byStatus = useMemo(() => {
    const map: Record<Lifecycle, MetaStudyRow[]> = {
      inbox: [], triaged: [], in_review: [], approved: [], archived: [],
    };
    rows.forEach(r => { map[r.lifecycle_status]?.push(r); });
    return map;
  }, [rows]);

  const moveTo = async (row: MetaStudyRow, target: Lifecycle) => {
    const { error } = await supabase
      .from('meta_studies')
      .update({ lifecycle_status: target })
      .eq('id', row.id);
    if (error) {
      toast.error(t('fundamentos.kanban.moveError', 'Falha ao mover estudo'));
      return;
    }
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, lifecycle_status: target } : r));
    if (selected?.id === row.id) setSelected({ ...row, lifecycle_status: target });
    toast.success(t('fundamentos.kanban.moved', 'Estudo movido para {{status}}', { status: STATUS_LABEL[target] }));
  };

  const saveReliability = async (row: MetaStudyRow) => {
    setSaving(true);
    const { data, error } = await supabase
      .from('meta_studies')
      .update({
        reliability_methodology: row.reliability_methodology,
        reliability_evidence_base: row.reliability_evidence_base,
        reliability_applicability: row.reliability_applicability,
        reliability_reproducibility: row.reliability_reproducibility,
        reliability_relevance: row.reliability_relevance,
      })
      .eq('id', row.id)
      .select('reliability_overall')
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast.error(t('fundamentos.kanban.saveError', 'Falha ao salvar confiabilidade'));
      return;
    }
    const overall = (data as any)?.reliability_overall ?? null;
    setRows(prev => prev.map(r => r.id === row.id ? { ...row, reliability_overall: overall } : r));
    setSelected(s => s && s.id === row.id ? { ...row, reliability_overall: overall } : s);
    toast.success(t('fundamentos.kanban.saved', 'Confiabilidade salva'));
  };

  // Salvar edição inline (do card)
  const saveInline = async (row: MetaStudyRow) => {
    const patch = edits[row.id];
    if (!patch) return;
    setSavingId(row.id);
    const merged = { ...row, ...patch } as MetaStudyRow;
    const { data, error } = await supabase
      .from('meta_studies')
      .update({
        reliability_methodology: merged.reliability_methodology,
        reliability_evidence_base: merged.reliability_evidence_base,
        reliability_applicability: merged.reliability_applicability,
        reliability_reproducibility: merged.reliability_reproducibility,
        reliability_relevance: merged.reliability_relevance,
      })
      .eq('id', row.id)
      .select('reliability_overall')
      .maybeSingle();
    setSavingId(null);
    if (error) {
      toast.error(t('fundamentos.kanban.saveError', 'Falha ao salvar confiabilidade'));
      return;
    }
    const dbOverall = (data as any)?.reliability_overall ?? null;
    const localOverall = computeOverall(merged as any);
    setRows(prev => prev.map(r => r.id === row.id ? { ...merged, reliability_overall: dbOverall } : r));
    setEdits(prev => { const n = { ...prev }; delete n[row.id]; return n; });
    if (dbOverall != null && localOverall != null && Math.abs(Number(dbOverall) - localOverall) > 0.05) {
      toast.warning(t('fundamentos.kanban.driftWarn', 'Overall salvo difere do preview ({{db}} vs {{local}})', {
        db: Number(dbOverall).toFixed(2), local: localOverall.toFixed(2),
      }));
    } else {
      toast.success(t('fundamentos.kanban.saved', 'Confiabilidade salva'));
    }
  };

  const discardInline = (rowId: string) => {
    setEdits(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  };

  // Avalia 1 estudo via IA e atualiza linha localmente
  const aiEvaluate = async (row: MetaStudyRow, overwrite = true) => {
    setAiId(row.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        'evaluate-meta-study-reliability',
        { body: { study_ids: [row.id], overwrite } },
      );
      if (error) throw error;
      const res = (data as any)?.results?.[0];
      if (!res?.ok) throw new Error(res?.error || 'falhou');
      // Recarrega só essa linha
      const { data: fresh } = await supabase
        .from('meta_studies')
        .select('id,reliability_methodology,reliability_evidence_base,reliability_applicability,reliability_reproducibility,reliability_relevance,reliability_overall')
        .eq('id', row.id)
        .maybeSingle();
      if (fresh) {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...(fresh as any) } : r));
      }
      toast.success(t('fundamentos.kanban.aiDone', 'Avaliação IA aplicada (★ {{n}})', {
        n: res.overall != null ? Number(res.overall).toFixed(1) : '—',
      }));
    } catch (e) {
      toast.error(t('fundamentos.kanban.aiError', 'Falha na avaliação IA: {{m}}', {
        m: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setAiId(null);
    }
  };

  // Backfill: avalia todos sem nota
  const aiBackfill = async () => {
    const pending = rows.filter(r => r.reliability_overall == null && r.lifecycle_status !== 'archived');
    if (pending.length === 0) {
      toast.info(t('fundamentos.kanban.aiNoPending', 'Nenhum estudo sem avaliação'));
      return;
    }
    if (!confirm(t('fundamentos.kanban.aiBackfillConfirm', 'Avaliar {{n}} estudos via IA? (pode levar ~{{s}}s)', {
      n: pending.length, s: pending.length * 4,
    }))) return;
    setBulkAi(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'evaluate-meta-study-reliability',
        { body: { study_ids: pending.map(r => r.id), overwrite: false } },
      );
      if (error) throw error;
      const results = ((data as any)?.results || []) as Array<{ id: string; ok: boolean; overall?: number }>;
      const okCount = results.filter(r => r.ok).length;
      toast.success(t('fundamentos.kanban.aiBackfillDone', '{{ok}}/{{total}} avaliados', {
        ok: okCount, total: results.length,
      }));
      await load();
    } catch (e) {
      toast.error(t('fundamentos.kanban.aiError', 'Falha na avaliação IA: {{m}}', {
        m: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setBulkAi(false);
    }
  };

  const generateCover = async (rowId: string, overwrite = false) => {
    setCoverId(rowId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meta-study-cover', {
        body: { study_ids: [rowId], overwrite },
      });
      if (error) throw error;
      const r = (data as any)?.results?.[0];
      if (!r?.ok) throw new Error(r?.error || 'falhou');
      setRows(prev => prev.map(x => x.id === rowId ? { ...x, cover_image_url: r.url } : x));
      toast.success(t('fundamentos.kanban.coverDone', 'Capa gerada'));
    } catch (e) {
      toast.error(t('fundamentos.kanban.coverError', 'Falha ao gerar capa: {{m}}', {
        m: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setCoverId(null);
    }
  };

  const backfillCovers = async () => {
    const missing = rows.filter(r => !r.cover_image_url);
    if (missing.length === 0) {
      toast.info(t('fundamentos.kanban.coverNoPending', 'Todos os papers já têm capa'));
      return;
    }
    if (!confirm(t('fundamentos.kanban.coverBackfillConfirm', 'Gerar capas para {{n}} papers? (~{{s}}s)', {
      n: missing.length, s: missing.length * 6,
    }))) return;
    setBulkCover(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meta-study-cover', {
        body: { all_missing: true },
      });
      if (error) throw error;
      const results = ((data as any)?.results || []) as Array<{ id: string; ok: boolean; url?: string }>;
      const ok = results.filter(r => r.ok).length;
      setRows(prev => prev.map(r => {
        const m = results.find(x => x.id === r.id && x.ok);
        return m ? { ...r, cover_image_url: m.url } : r;
      }));
      toast.success(t('fundamentos.kanban.coverBackfillDone', '{{ok}}/{{total}} capas geradas', { ok, total: results.length }));
    } catch (e) {
      toast.error(t('fundamentos.kanban.coverError', 'Falha ao gerar capa: {{m}}', {
        m: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setBulkCover(false);
    }
  };

  const setEdit = (rowId: string, key: keyof MetaStudyRow, value: number | null) => {
    setEdits(prev => ({ ...prev, [rowId]: { ...(prev[rowId] || {}), [key]: value } }));
  };

  const effectiveScores = (row: MetaStudyRow): Record<string, number | null> => {
    const patch = edits[row.id] || {};
    const out: Record<string, number | null> = {};
    DIM_KEYS.forEach(k => {
      out[k as string] = (k in patch ? patch[k] : (row as any)[k]) ?? null;
    });
    return out;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {t('fundamentos.kanban.intro', 'Sandbox de estudos arquiteturais: caixa de entrada → triados → em revisão → aprovados. Aprovação real continua exigindo curadoria das regras propostas na aba Ingestão.')}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={backfillCovers}
            disabled={bulkCover}
            className="border-primary/40"
            title={t('fundamentos.kanban.coverBackfillHint', 'Gera ilustração consistente para papers sem capa')}
          >
            {bulkCover
              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              : <ImageIcon className="h-3 w-3 mr-1 text-primary" />}
            {t('fundamentos.kanban.coverBackfill', 'Gerar capas')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={aiBackfill}
            disabled={bulkAi}
            className="border-primary/40"
            title={t('fundamentos.kanban.aiBackfillHint', 'Usa IA para preencher as 5 dimensões dos estudos sem nota')}
          >
            {bulkAi
              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              : <Sparkles className="h-3 w-3 mr-1 text-primary" />}
            {t('fundamentos.kanban.aiBackfill', 'Avaliar pendentes (IA)')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowArchived(s => !s)}>
            <Archive className="h-3 w-3 mr-1" />
            {showArchived
              ? t('fundamentos.kanban.hideArchived', 'Ocultar arquivados')
              : t('fundamentos.kanban.showArchived', 'Ver arquivados ({{n}})', { n: byStatus.archived.length })}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {ORDER.map(status => {
          const Icon = ICONS[status];
          const list = byStatus[status];
          return (
            <div key={status} className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">{STATUS_LABEL[status]}</h4>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              <div className="bg-secondary/20 rounded-lg p-2 min-h-[300px] space-y-2">
                {list.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6">
                    {t('fundamentos.kanban.empty', 'Vazio')}
                  </div>
                )}
                {list.map(row => {
                  const scores = effectiveScores(row);
                  const livePreview = computeOverall(scores);
                  const hasEdits = !!edits[row.id];
                  const filledCount = DIM_KEYS.filter(k => scores[k as string] != null).length;
                  const isExpanded = !!expanded[row.id];
                  const tripletN = tripletCounts[row.id] || 0;
                  const days = ageInDays(row.created_at);
                  const overallDisplay = hasEdits ? livePreview : row.reliability_overall;
                  return (
                    <Card key={row.id} className="hover:border-primary/40 cursor-pointer transition-colors" onClick={() => setSelected(row)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex gap-2.5">
                          <CoverThumb url={row.cover_image_url} kind={row.kind} size={56} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium line-clamp-2 leading-tight">{row.title}</div>
                            {row.authors && (
                              <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{row.authors}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap text-[10px] text-muted-foreground">
                          {row.year && <span>{row.year}</span>}
                          <Badge variant="outline" className="text-[9px] py-0">{row.kind}</Badge>
                          {row.proposed_rules?.length > 0 && (
                            <Badge variant="outline" className="text-[9px] py-0 bg-purple-50 text-purple-700 border-purple-200">
                              <ListChecks className="h-2.5 w-2.5 mr-0.5" />
                              {row.proposed_rules.length}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] py-0 bg-sky-50 text-sky-700 border-sky-200">
                            <Link2 className="h-2.5 w-2.5 mr-0.5" />
                            {tripletN} {t('fundamentos.kanban.card.triplets', 'tripletes')}
                          </Badge>
                          <span className="text-[9px] opacity-70">· {days}d</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <CoreRulesEvidenceBadge metaStudyId={row.id} />
                          {row.source_url && (
                            <a
                              href={row.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5"
                              title={t('fundamentos.kanban.card.openPaper', 'Abrir paper original')}
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              {t('fundamentos.kanban.card.paper', 'paper')}
                            </a>
                          )}
                          <button
                            className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5"
                            onClick={() => setChatId({ id: row.id, title: row.title })}
                            title={t('fundamentos.kanban.card.chat', 'Conversar sobre este paper')}
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            {t('fundamentos.kanban.card.chatShort', 'chat')}
                          </button>
                          {!row.cover_image_url && (
                            <button
                              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-dashed"
                              onClick={() => generateCover(row.id)}
                              disabled={coverId === row.id}
                              title={t('fundamentos.kanban.card.generateCover', 'Gerar ilustração')}
                            >
                              {coverId === row.id
                                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                : <ImageIcon className="h-2.5 w-2.5" />}
                              {t('fundamentos.kanban.card.cover', 'capa')}
                            </button>
                          )}
                        </div>
                        {/* Mini barra de contribuição */}
                        {filledCount > 0 && (
                          <div className="flex h-1 rounded overflow-hidden bg-muted">
                            {DIM_KEYS.map(k => {
                              const v = scores[k as string];
                              if (v == null) return null;
                              return (
                                <div
                                  key={k as string}
                                  className={DIM_COLOR[k as string]}
                                  style={{ flex: v }}
                                  title={`${DIM_SHORT[k as string]} ${v.toFixed(1)}`}
                                />
                              );
                            })}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={reliabilityBadgeClass(overallDisplay)}>
                              {overallDisplay != null
                                ? `★ ${Number(overallDisplay).toFixed(1)}/5`
                                : t('fundamentos.kanban.noScore', 'sem nota')}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">{filledCount}/5</span>
                            {hasEdits && (
                              <Badge className="text-[9px] py-0 bg-amber-500 text-white border-amber-600">
                                {t('fundamentos.kanban.card.unsaved', 'não salvo')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              disabled={aiId === row.id}
                              onClick={(e) => { e.stopPropagation(); aiEvaluate(row, true); }}
                              title={row.reliability_overall != null
                                ? t('fundamentos.kanban.card.aiReSuggest', 'Re-avaliar com IA')
                                : t('fundamentos.kanban.card.aiSuggest', 'Sugerir notas com IA')}
                            >
                              {aiId === row.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Sparkles className="h-3 w-3 text-primary" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); setExpanded(p => ({ ...p, [row.id]: !p[row.id] })); }}
                              title={t('fundamentos.kanban.card.expandReliability', 'Ajustar confiabilidade')}
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                            {PREV[status] && (
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveTo(row, PREV[status]!); }}>
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                            )}
                            {NEXT[status] && (
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveTo(row, NEXT[status]!); }}>
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Painel expansível com sliders inline */}
                        {isExpanded && (
                          <div
                            className="pt-2 border-t space-y-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {DIM_KEYS.map(k => {
                              const v = scores[k as string];
                              return (
                                <div key={k as string} className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium w-12 text-muted-foreground">{DIM_SHORT[k as string]}</span>
                                  <Slider
                                    className="flex-1"
                                    value={[v ?? 0]}
                                    min={0}
                                    max={5}
                                    step={0.5}
                                    onValueChange={(arr) => setEdit(row.id, k, arr[0])}
                                  />
                                  <span className="text-[10px] font-mono w-7 text-right">{v != null ? v.toFixed(1) : '—'}</span>
                                  {v != null && (
                                    <button
                                      className="text-[9px] text-muted-foreground hover:text-foreground"
                                      onClick={() => setEdit(row.id, k, null)}
                                      title={t('fundamentos.kanban.clear', 'limpar')}
                                    >×</button>
                                  )}
                                </div>
                              );
                            })}
                            <div className="flex items-center justify-end gap-1 pt-1">
                              {hasEdits && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => discardInline(row.id)}>
                                  {t('fundamentos.kanban.discard', 'descartar')}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="h-6 text-[10px]"
                                disabled={!hasEdits || savingId === row.id}
                                onClick={() => saveInline(row)}
                              >
                                {savingId === row.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                {t('fundamentos.kanban.save', 'Salvar')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showArchived && byStatus.archived.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Archive className="h-4 w-4" /> {STATUS_LABEL.archived} ({byStatus.archived.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {byStatus.archived.map(row => (
              <Card key={row.id} className="opacity-70 hover:opacity-100 cursor-pointer" onClick={() => setSelected(row)}>
                <CardContent className="p-3 text-xs">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-muted-foreground mt-1">{row.year}</div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <ReliabilityEditor
              row={selected}
              saving={saving}
              onChange={setSelected}
              onSave={() => saveReliability(selected)}
              onMove={(target) => moveTo(selected, target)}
              t={t}
              statusLabels={STATUS_LABEL}
            />
          )}
        </DialogContent>
      </Dialog>

      {chatId && (
        <MetaStudyChatDialog
          open={!!chatId}
          onOpenChange={(o) => !o && setChatId(null)}
          metaStudyId={chatId.id}
          title={chatId.title}
        />
      )}
    </div>
  );
};

interface EditorProps {
  row: MetaStudyRow;
  saving: boolean;
  onChange: (row: MetaStudyRow) => void;
  onSave: () => void;
  onMove: (target: Lifecycle) => void;
  t: any;
  statusLabels: Record<Lifecycle, string>;
}

const DIMENSIONS: Array<{ key: keyof MetaStudyRow; labelKey: string; labelFallback: string; descKey: string; descFallback: string }> = [
  { key: 'reliability_methodology', labelKey: 'fundamentos.kanban.dim.methodology', labelFallback: 'Metodologia', descKey: 'fundamentos.kanban.dim.methodologyDesc', descFallback: 'Rigor do método e desenho do estudo' },
  { key: 'reliability_evidence_base', labelKey: 'fundamentos.kanban.dim.evidenceBase', labelFallback: 'Base de evidência', descKey: 'fundamentos.kanban.dim.evidenceBaseDesc', descFallback: 'Qualidade e volume das fontes citadas' },
  { key: 'reliability_applicability', labelKey: 'fundamentos.kanban.dim.applicability', labelFallback: 'Aplicabilidade', descKey: 'fundamentos.kanban.dim.applicabilityDesc', descFallback: 'Aplicabilidade ao contexto canino/geroprotetor' },
  { key: 'reliability_reproducibility', labelKey: 'fundamentos.kanban.dim.reproducibility', labelFallback: 'Reprodutibilidade', descKey: 'fundamentos.kanban.dim.reproducibilityDesc', descFallback: 'Replicabilidade do que propõe' },
  { key: 'reliability_relevance', labelKey: 'fundamentos.kanban.dim.relevance', labelFallback: 'Relevância translacional', descKey: 'fundamentos.kanban.dim.relevanceDesc', descFallback: 'Relevância translacional para o produto' },
];

const ReliabilityEditor: React.FC<EditorProps> = ({ row, saving, onChange, onSave, onMove, t, statusLabels }) => {
  const set = (key: keyof MetaStudyRow, value: number | null) => {
    onChange({ ...row, [key]: value } as MetaStudyRow);
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base">{row.title}</DialogTitle>
        <DialogDescription className="text-xs">
          {row.authors} {row.year ? `· ${row.year}` : ''} · <Badge variant="outline" className="text-[10px]">{statusLabels[row.lifecycle_status]}</Badge>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {t('fundamentos.kanban.reliabilityTitle', 'Confiabilidade do estudo (0–5)')}
          </span>
          <Badge variant="outline" className={reliabilityBadgeClass(row.reliability_overall)}>
            ★ {row.reliability_overall != null ? Number(row.reliability_overall).toFixed(2) : '—'}/5
          </Badge>
        </div>
        {DIMENSIONS.map(dim => {
          const value = (row as any)[dim.key] as number | null;
          return (
            <div key={dim.key as string} className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{t(dim.labelKey, dim.labelFallback)}</div>
                  <div className="text-[11px] text-muted-foreground">{t(dim.descKey, dim.descFallback)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {value != null ? value.toFixed(1) : '—'}
                  </Badge>
                  {value != null && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => set(dim.key, null)}>
                      {t('fundamentos.kanban.clear', 'limpar')}
                    </Button>
                  )}
                </div>
              </div>
              <Slider
                value={[value ?? 0]}
                min={0}
                max={5}
                step={0.5}
                onValueChange={(v) => set(dim.key, v[0])}
              />
            </div>
          );
        })}
      </div>
      <DialogFooter className="flex-wrap gap-2">
        <div className="flex items-center gap-1 mr-auto">
          {PREV[row.lifecycle_status] && (
            <Button size="sm" variant="outline" onClick={() => onMove(PREV[row.lifecycle_status]!)}>
              <ChevronLeft className="h-3 w-3 mr-1" />
              {statusLabels[PREV[row.lifecycle_status]!]}
            </Button>
          )}
          {NEXT[row.lifecycle_status] && (
            <Button size="sm" variant="outline" onClick={() => onMove(NEXT[row.lifecycle_status]!)}>
              {statusLabels[NEXT[row.lifecycle_status]!]}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {t('fundamentos.kanban.save', 'Salvar confiabilidade')}
        </Button>
      </DialogFooter>
    </>
  );
};

export default MetaStudyKanban;