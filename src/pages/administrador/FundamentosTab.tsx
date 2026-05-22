import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Shield, BookOpenCheck, GitBranch, Loader2, ExternalLink, Sparkles, AlertTriangle, Upload, History, Kanban } from 'lucide-react';
import { toast } from 'sonner';
import IngestaoMetaEstudo from '@/components/administrador/fundamentos/IngestaoMetaEstudo';
import CoreRuleHistory from '@/components/administrador/fundamentos/CoreRuleHistory';
import MetaStudyKanban from '@/components/administrador/fundamentos/MetaStudyKanban';
import MetaKgRoadmapCard from '@/components/administrador/fundamentos/MetaKgRoadmapCard';

interface CoreRule {
  id: string;
  rule_id: string;
  title: string;
  title_en?: string | null;
  category: string;
  status: 'active' | 'planned' | 'deprecated' | string;
  runtime_effect?: 'active' | 'doc_only' | 'planned' | string;
  version: string;
  justification: string;
  justification_en?: string | null;
  application?: string | null;
  evidence_summary?: string | null;
  doc_anchor?: string | null;
}
interface MetaStudy {
  id: string;
  title: string;
  authors?: string | null;
  year?: number | null;
  kind: string;
  summary?: string | null;
  source_url?: string | null;
  key_claims: Array<{ claim: string; quote?: string; weight?: number }>;
}
interface Evidence {
  id: string;
  rule_id: string;
  meta_study_id: string;
  relation: 'supports' | 'contradicts' | 'modulates_weight' | 'inspires' | string;
  weight: number;
  quote?: string | null;
  notes?: string | null;
}
interface Modulator {
  id: string;
  rule_id: string;
  domain: string;
  source_species: string;
  target_species: string;
  weight: number;
  rationale?: string | null;
  is_active: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  planned: 'bg-amber-100 text-amber-700 border-amber-300',
  deprecated: 'bg-slate-100 text-slate-600 border-slate-300',
  documented: 'bg-slate-100 text-slate-600 border-slate-300',
};
const RUNTIME_COLOR: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-300',
  doc_only: 'bg-slate-100 text-slate-600 border-slate-300',
  planned: 'bg-amber-100 text-amber-700 border-amber-300',
};
const RUNTIME_LABEL_PT: Record<string, string> = {
  active: 'runtime: ativo',
  doc_only: 'runtime: só doc',
  planned: 'runtime: planejado',
};
const RUNTIME_LABEL_EN: Record<string, string> = {
  active: 'runtime: active',
  doc_only: 'runtime: doc-only',
  planned: 'runtime: planned',
};
const RELATION_COLOR: Record<string, string> = {
  supports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contradicts: 'bg-red-50 text-red-700 border-red-200',
  modulates_weight: 'bg-blue-50 text-blue-700 border-blue-200',
  inspires: 'bg-purple-50 text-purple-700 border-purple-200',
};

const FundamentosTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('pt') ? 'pt' : 'en';
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<CoreRule[]>([]);
  const [studies, setStudies] = useState<MetaStudy[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [modulators, setModulators] = useState<Modulator[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s, e, m] = await Promise.all([
        supabase.from('core_rules').select('*').order('rule_id'),
        supabase.from('meta_studies').select('*').order('year', { ascending: false }),
        supabase.from('core_rule_evidence').select('*'),
        supabase.from('core_rule_modulators').select('*'),
      ]);
      if (r.error) throw r.error;
      setRules((r.data as any) || []);
      setStudies((s.data as any) || []);
      setEvidence((e.data as any) || []);
      setModulators((m.data as any) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(t('fundamentos.loadError', 'Falha ao carregar regras-core'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Descrição da área — padrão de outras tabs (ex.: Conformidade Regulatória) */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/40 to-blue-50/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">{t('fundamentos.title', 'Fundamentos Arquiteturais')}</CardTitle>
          </div>
          <CardDescription className="text-sm text-foreground/80 leading-relaxed">
            {t(
              'fundamentos.description',
              'Esta área é o "Meta-KG" do Senex AI: o catálogo auditável das Regras-Core (RC-NNN) que governam todo o sistema (extração, curadoria, recomendação, translacionalidade) — junto com os estudos arquiteturais que justificam cada regra. Ao contrário do KG clínico (que descreve o que sabemos sobre saúde do pet), o Meta-KG descreve o que sabemos sobre como devemos raciocinar com esse conhecimento. Cada decisão sensível do pipeline (peso de translacionalidade humano→cão, separação exclusão vs contraindicação, política de fallback de evidência) tem uma RC rastreável aqui.'
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList>
          <TabsTrigger value="rules">
            <Shield className="h-4 w-4 mr-1" /> {t('fundamentos.tabs.rules', 'Regras-Core')} ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="studies">
            <BookOpenCheck className="h-4 w-4 mr-1" /> {t('fundamentos.tabs.studies', 'Estudos Arquiteturais')} ({studies.length})
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <Kanban className="h-4 w-4 mr-1" /> {t('fundamentos.tabs.kanban', 'Sandbox / Kanban')}
          </TabsTrigger>
          <TabsTrigger value="influences">
            <GitBranch className="h-4 w-4 mr-1" /> {t('fundamentos.tabs.justifications', 'Justificativas')} ({evidence.length})
          </TabsTrigger>
          <TabsTrigger value="ingest">
            <Upload className="h-4 w-4 mr-1" /> {t('fundamentos.tabs.ingest', 'Ingestão')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" /> {t('fundamentos.tabs.history', 'Histórico & Auditoria')}
          </TabsTrigger>
        </TabsList>

        {/* === RULES === */}
        <TabsContent value="rules" className="space-y-3 mt-4">
          {rules.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{t('fundamentos.noRules', 'Nenhuma regra-core cadastrada ainda.')}</CardContent></Card>
          ) : rules.map((r) => {
            const evForRule = evidence.filter(e => e.rule_id === r.id);
            const modsForRule = modulators.filter(m => m.rule_id === r.id);
            const runtimeKey = r.runtime_effect || 'doc_only';
            const runtimeLabel = (lang === 'pt' ? RUNTIME_LABEL_PT : RUNTIME_LABEL_EN)[runtimeKey] || runtimeKey;
            const just = lang === 'en' && r.justification_en ? r.justification_en : r.justification;
            return (
              <Card key={r.id} className="border-l-4 border-l-purple-400">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">{r.rule_id}</Badge>
                        <CardTitle className="text-base">{lang === 'en' && r.title_en ? r.title_en : r.title}</CardTitle>
                        <Badge className={STATUS_COLOR[r.status] || ''}>{r.status}</Badge>
                        <Badge variant="outline" className={RUNTIME_COLOR[runtimeKey] || ''}>{runtimeLabel}</Badge>
                        <Badge variant="outline" className="text-xs">v{r.version}</Badge>
                        <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                      </div>
                    </div>
                    {r.doc_anchor && (
                      <a href={`/docs/CORE_RULES.md${r.doc_anchor}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> MD
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('fundamentos.justification', 'Justificativa')}</p>
                    <p className="text-foreground">{just}</p>
                  </div>
                  {r.application && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('fundamentos.application', 'Aplicação no código')}</p>
                      <p className="text-muted-foreground font-mono text-xs">{r.application}</p>
                    </div>
                  )}
                  {evForRule.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('fundamentos.linkedEvidence', 'Evidência vinculada')}</p>
                      <div className="flex flex-wrap gap-1">
                        {evForRule.map(ev => {
                          const st = studies.find(s => s.id === ev.meta_study_id);
                          return (
                            <Badge key={ev.id} variant="outline" className={RELATION_COLOR[ev.relation]}>
                              {ev.relation} · {st?.title?.slice(0, 50) || ev.meta_study_id.slice(0, 8)} · w={ev.weight}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {modsForRule.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('fundamentos.modulators', 'Moduladores translacionais')}</p>
                      <div className="space-y-1">
                        {modsForRule.map(m => (
                          <div key={m.id} className="text-xs flex items-center gap-2">
                            <Badge variant="outline">{m.domain}</Badge>
                            <span className="font-mono">{m.source_species} → {m.target_species}</span>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">×{m.weight}</Badge>
                            {!m.is_active && <Badge variant="outline" className="text-[10px]">{t('fundamentos.flagOff', 'flag off')}</Badge>}
                            {m.rationale && <span className="text-muted-foreground">— {m.rationale}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* === STUDIES === */}
        <TabsContent value="studies" className="space-y-3 mt-4">
          <Card className="border-dashed bg-muted/30">
            <CardContent className="py-4 text-xs text-muted-foreground flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
              <span>
                {t('fundamentos.studiesIntro', 'Estudos aqui NÃO são clínicos (não entram no KG do pet). São referências arquiteturais/metodológicas que justificam decisões do pipeline — ex.: como ponderar evidência humana ao recomendar para cães.')}
              </span>
            </CardContent>
          </Card>
          {studies.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">{t('fundamentos.noStudies', 'Nenhum estudo arquitetural cadastrado.')}</CardContent></Card>
          ) : studies.map(s => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.authors} {s.year ? `· ${s.year}` : ''} · <Badge variant="outline" className="text-xs">{s.kind}</Badge>
                    </div>
                  </div>
                  {s.source_url && (
                    <a href={s.source_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> {t('fundamentos.source', 'Fonte')}
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {s.summary && <p className="text-muted-foreground">{s.summary}</p>}
                {s.key_claims?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t('fundamentos.keyClaims', 'Claims-chave')}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {s.key_claims.map((c, i) => (
                        <li key={i}>
                          <span className="font-medium">{c.claim}</span>
                          {c.quote && <span className="text-muted-foreground italic"> — "{c.quote}"</span>}
                          {typeof c.weight === 'number' && <Badge variant="outline" className="ml-1 text-[10px]">w={c.weight}</Badge>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* === INFLUENCES === */}
        <TabsContent value="influences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('fundamentos.justificationsTitle', 'Como cada Regra-Core é justificada')}</CardTitle>
              <CardDescription className="text-xs">
                {t('fundamentos.justificationsDesc', 'Para cada Regra-Core, lista os estudos arquiteturais que a sustentam, contradizem ou modulam — com quote literal e peso. Regras sem evidência vinculada são governança apenas por convenção da equipe e estão sinalizadas.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              {rules.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('fundamentos.noRules', 'Nenhuma regra-core cadastrada ainda.')}</p>
              ) : (
                rules.map(r => {
                  const evForRule = evidence.filter(e => e.rule_id === r.id);
                  return (
                    <div key={r.id} className="border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">{r.rule_id}</Badge>
                        <span className="font-medium text-sm">{lang === 'en' && r.title_en ? r.title_en : r.title}</span>
                        <Badge variant="outline" className="text-[10px]">{evForRule.length} {t('fundamentos.evidenceCount', 'evidência(s)')}</Badge>
                      </div>
                      {evForRule.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {t('fundamentos.noEvidenceForRule', 'Sem estudo arquitetural vinculado — governança por convenção da equipe (documentada em docs/CORE_RULES.md).')}
                        </p>
                      ) : (
                        <ul className="space-y-1.5 text-xs">
                          {evForRule.map(ev => {
                            const s = studies.find(x => x.id === ev.meta_study_id);
                            return (
                              <li key={ev.id} className="flex items-start gap-2">
                                <Badge className={RELATION_COLOR[ev.relation]}>{ev.relation}</Badge>
                                <div className="flex-1">
                                  <div className="font-medium">{s?.title || '?'}</div>
                                  {(ev.quote || ev.notes) && (
                                    <div className="text-muted-foreground italic mt-0.5">"{ev.quote || ev.notes}"</div>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">w={ev.weight}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === INGESTION === */}
        <TabsContent value="ingest" className="mt-4">
          <div className="mb-3">
            <MetaKgRoadmapCard />
          </div>
          <IngestaoMetaEstudo onSaved={load} />
        </TabsContent>

        {/* === HISTORY & AUDIT === */}
        <TabsContent value="history" className="mt-4">
          <CoreRuleHistory />
        </TabsContent>

        {/* === KANBAN / SANDBOX === */}
        <TabsContent value="kanban" className="mt-4">
          <MetaStudyKanban />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FundamentosTab;