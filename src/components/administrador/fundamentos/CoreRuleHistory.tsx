import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Filter, ChevronDown, ChevronRight, History, BookOpen, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CoreRule { id: string; rule_id: string; title: string; status: string; category: string; }
interface MetaStudy { id: string; title: string; year?: number | null; }
interface Evidence {
  id: string; rule_id: string; meta_study_id: string; relation: string;
  weight: number; quote?: string | null; notes?: string | null; created_at: string;
}
interface AuditEntry {
  id: string; rule_id: string | null; rule_code: string | null;
  meta_study_id: string | null; action: string; stance: string | null;
  actor_user_id: string | null; justification: string | null;
  payload: any; created_at: string;
}

const STANCE_COLOR: Record<string, string> = {
  confirms:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  extends:      'bg-purple-50 text-purple-700 border-purple-200',
  contradicts:  'bg-red-50 text-red-700 border-red-200',
  unrelated:    'bg-slate-50 text-slate-600 border-slate-200',
};
const ACTION_COLOR: Record<string, string> = {
  stance_detected:    'bg-blue-50 text-blue-700 border-blue-200',
  promote:            'bg-purple-50 text-purple-700 border-purple-200',
  attach:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  resolve_keep:       'bg-amber-50 text-amber-700 border-amber-200',
  discard:            'bg-slate-50 text-slate-600 border-slate-200',
  approve_meta_study: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  manual_note:        'bg-slate-50 text-slate-600 border-slate-200',
};
const RELATION_COLOR: Record<string, string> = {
  supports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contradicts: 'bg-red-50 text-red-700 border-red-200',
  modulates_weight: 'bg-blue-50 text-blue-700 border-blue-200',
  inspires: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CoreRuleHistory: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<CoreRule[]>([]);
  const [studies, setStudies] = useState<MetaStudy[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState('');
  const [stanceFilter, setStanceFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [r, s, e, a] = await Promise.all([
        supabase.from('core_rules').select('id, rule_id, title, status, category').order('rule_id'),
        supabase.from('meta_studies').select('id, title, year'),
        supabase.from('core_rule_evidence').select('*').order('created_at', { ascending: false }),
        supabase.from('core_rule_audit_log').select('*').order('created_at', { ascending: false }).limit(2000),
      ]);
      if (r.error) throw r.error;
      setRules((r.data as any) || []);
      setStudies((s.data as any) || []);
      setEvidence((e.data as any) || []);
      setAudit((a.data as any) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t('fundamentos.history.loadError', 'Falha ao carregar histórico'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const studyById = useMemo(() => new Map(studies.map(s => [s.id, s])), [studies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter(r => {
      if (!q) return true;
      return (
        r.rule_id.toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q)
      );
    });
  }, [rules, search]);

  const entriesFor = (rule: CoreRule) => {
    const ev = evidence.filter(e => e.rule_id === rule.id);
    const al = audit.filter(a => a.rule_id === rule.id || a.rule_code === rule.rule_id);
    const filteredAl = al.filter(a => {
      if (stanceFilter !== 'all' && (a.stance || '') !== stanceFilter) return false;
      if (actionFilter !== 'all' && a.action !== actionFilter) return false;
      return true;
    });
    return { ev, al: filteredAl, alTotal: al.length };
  };

  // Orphan audit entries (rule_code but no matched rule) — surface separately
  const orphanAudit = useMemo(() => audit.filter(a => {
    if (a.rule_id) return false;
    if (!a.rule_code) return true;
    return !rules.some(r => r.rule_id === a.rule_code);
  }).filter(a => {
    if (stanceFilter !== 'all' && (a.stance || '') !== stanceFilter) return false;
    if (actionFilter !== 'all' && a.action !== actionFilter) return false;
    return true;
  }), [audit, rules, stanceFilter, actionFilter]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
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
      <Card>
        <CardContent className="py-3 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('fundamentos.history.searchPlaceholder', 'Buscar por RC-ID, título ou categoria…')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={stanceFilter} onValueChange={setStanceFilter}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Stance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('fundamentos.history.stanceAll', 'Todas as stances')}</SelectItem>
                <SelectItem value="confirms">confirms</SelectItem>
                <SelectItem value="extends">extends</SelectItem>
                <SelectItem value="contradicts">contradicts</SelectItem>
                <SelectItem value="unrelated">unrelated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder={t('common.action', 'Ação')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('fundamentos.history.actionAll', 'Todas as ações')}</SelectItem>
                <SelectItem value="stance_detected">stance_detected</SelectItem>
                <SelectItem value="promote">promote</SelectItem>
                <SelectItem value="attach">attach</SelectItem>
                <SelectItem value="resolve_keep">resolve_keep</SelectItem>
                <SelectItem value="discard">discard</SelectItem>
                <SelectItem value="approve_meta_study">approve_meta_study</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load}>{t('fundamentos.history.refresh', 'Atualizar')}</Button>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{t('fundamentos.history.noRulesFound', 'Nenhuma RC encontrada.')}</CardContent></Card>
      )}

      {filtered.map(rule => {
        const { ev, al, alTotal } = entriesFor(rule);
        const isOpen = expanded.has(rule.id);
        const stanceCounts = al.reduce<Record<string, number>>((acc, e) => {
          if (!e.stance) return acc;
          acc[e.stance] = (acc[e.stance] || 0) + 1;
          return acc;
        }, {});
        return (
          <Card key={rule.id} className="border-l-4 border-l-purple-300">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(rule.id)}>
              <div className="flex items-center gap-2 flex-wrap">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Badge variant="outline" className="font-mono text-xs">{rule.rule_id}</Badge>
                <CardTitle className="text-sm">{rule.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">{rule.category}</Badge>
                <Badge variant="outline" className="text-xs">{rule.status}</Badge>
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" /> {ev.length} {t('fundamentos.evidenceCount', 'evidência(s)')}
                  <History className="h-3 w-3 ml-2" /> {alTotal} {t('fundamentos.logCount', 'log(s)')}
                  {Object.entries(stanceCounts).map(([k, v]) => (
                    <Badge key={k} variant="outline" className={STANCE_COLOR[k] || ''}>{k}: {v}</Badge>
                  ))}
                </span>
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t('fundamentos.history.linkedEvidence', 'Evidências vinculadas')} ({ev.length})</p>
                  {ev.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{t('fundamentos.history.noEvidence', 'Nenhuma evidência registrada.')}</p>
                  ) : (
                    <ul className="space-y-1">
                      {ev.map(e => {
                        const st = studyById.get(e.meta_study_id);
                        return (
                          <li key={e.id} className="border rounded px-2 py-1.5 bg-muted/30">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={RELATION_COLOR[e.relation] || ''}>{e.relation}</Badge>
                              <span className="text-xs">{st?.title || e.meta_study_id.slice(0, 8)}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">{t('fundamentos.history.weight', 'peso')} {e.weight} · {new Date(e.created_at).toLocaleDateString()}</span>
                            </div>
                            {e.quote && <p className="text-xs text-muted-foreground italic mt-1">"{e.quote}"</p>}
                            {e.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{e.notes}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t('fundamentos.history.auditLog', 'Log de auditoria')} ({al.length})</p>
                  {al.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">{t('fundamentos.history.noAudit', 'Nenhuma entrada de auditoria com os filtros atuais.')}</p>
                  ) : (
                    <ul className="space-y-1">
                      {al.map(a => {
                        const st = a.meta_study_id ? studyById.get(a.meta_study_id) : null;
                        return (
                          <li key={a.id} className="border rounded px-2 py-1.5 bg-white">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={ACTION_COLOR[a.action] || ''}>{a.action}</Badge>
                              {a.stance && <Badge variant="outline" className={STANCE_COLOR[a.stance] || ''}>{a.stance}</Badge>}
                              {st && <span className="text-xs text-muted-foreground">{st.title}</span>}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {new Date(a.created_at).toLocaleString()}
                                {a.actor_user_id && ` · user ${a.actor_user_id.slice(0, 8)}`}
                              </span>
                            </div>
                            {a.payload?.proposed_title && (
                              <p className="text-xs mt-1"><b>{t('fundamentos.history.proposal', 'Proposta')}:</b> {a.payload.proposed_title}</p>
                            )}
                            {a.payload?.enunciado && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{a.payload.enunciado}</p>
                            )}
                            {a.justification && (
                              <p className="text-[11px] text-muted-foreground mt-0.5"><b>{t('fundamentos.history.justification', 'Justificativa')}:</b> {a.justification}</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {orphanAudit.length > 0 && (
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm">{t('fundamentos.history.orphanTitle', 'Entradas sem RC mapeada')} ({orphanAudit.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {orphanAudit.slice(0, 50).map(a => (
                <li key={a.id} className="border rounded px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={ACTION_COLOR[a.action] || ''}>{a.action}</Badge>
                    {a.stance && <Badge variant="outline" className={STANCE_COLOR[a.stance] || ''}>{a.stance}</Badge>}
                    {a.rule_code && <Badge variant="outline" className="font-mono">{a.rule_code}</Badge>}
                    <span className="ml-auto text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  {a.payload?.proposed_title && <p className="mt-1"><b>{a.payload.proposed_title}</b></p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoreRuleHistory;