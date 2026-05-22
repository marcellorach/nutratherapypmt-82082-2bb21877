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
} from 'lucide-react';

type Lifecycle = 'inbox' | 'triaged' | 'in_review' | 'approved' | 'archived';

interface MetaStudyRow {
  id: string;
  title: string;
  authors?: string | null;
  year?: number | null;
  kind: string;
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

const MetaStudyKanban: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<MetaStudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<MetaStudyRow | null>(null);
  const [saving, setSaving] = useState(false);

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
      .select('id,title,authors,year,kind,lifecycle_status,reliability_methodology,reliability_evidence_base,reliability_applicability,reliability_reproducibility,reliability_relevance,reliability_overall,proposed_rules,created_at')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(t('fundamentos.kanban.loadError', 'Falha ao carregar Kanban'));
    } else {
      setRows((data as any) || []);
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
        <Button variant="outline" size="sm" onClick={() => setShowArchived(s => !s)}>
          <Archive className="h-3 w-3 mr-1" />
          {showArchived
            ? t('fundamentos.kanban.hideArchived', 'Ocultar arquivados')
            : t('fundamentos.kanban.showArchived', 'Ver arquivados ({{n}})', { n: byStatus.archived.length })}
        </Button>
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
                {list.map(row => (
                  <Card key={row.id} className="hover:border-primary/40 cursor-pointer transition-colors" onClick={() => setSelected(row)}>
                    <CardContent className="p-3 space-y-2">
                      <div className="text-sm font-medium line-clamp-2">{row.title}</div>
                      <div className="flex items-center gap-1 flex-wrap text-[10px] text-muted-foreground">
                        {row.year && <span>{row.year}</span>}
                        <Badge variant="outline" className="text-[9px] py-0">{row.kind}</Badge>
                        {row.proposed_rules?.length > 0 && (
                          <Badge variant="outline" className="text-[9px] py-0 bg-purple-50 text-purple-700 border-purple-200">
                            {row.proposed_rules.length} {t('fundamentos.kanban.proposed', 'propostas')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={reliabilityBadgeClass(row.reliability_overall)}>
                          {row.reliability_overall != null
                            ? `★ ${Number(row.reliability_overall).toFixed(1)}/5`
                            : t('fundamentos.kanban.noScore', 'sem nota')}
                        </Badge>
                        <div className="flex items-center gap-0.5">
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
                    </CardContent>
                  </Card>
                ))}
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
    </div>
  );
};

interface EditorProps {
  row: MetaStudyRow;
  saving: boolean;
  onChange: (row: MetaStudyRow) => void;
  onSave: () => void;
  onMove: (target: Lifecycle) => void;
  t: (key: string, fallback?: string, opts?: any) => string;
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