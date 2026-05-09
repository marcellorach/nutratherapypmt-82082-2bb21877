import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Download, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

type Status = 'meets' | 'partial' | 'gap';
type Authority = 'FDA' | 'EMA' | 'AVMA';

interface ComplianceItem {
  authority: Authority;
  requirement: string;
  reference: string;
  evidence: string;
  artifact: string;
  status: Status;
  action: string;
  effort?: 'S' | 'M' | 'L';
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
}

const DATA: ComplianceItem[] = [
  // FDA
  { authority: 'FDA', requirement: 'Predetermined Change Control Plan (PCCP)', reference: 'FDA Draft Guidance Jan/2025', evidence: 'Versionamento via CHANGELOG.md + I18N_VERSION + migrations Supabase com auditoria', artifact: 'CHANGELOG.md, supabase/migrations/, src/i18n.ts', status: 'meets', action: 'Formalizar PCCP em documento assinado', priority: 'P2', effort: 'S' },
  { authority: 'FDA', requirement: 'Good Machine Learning Practice (GMLP) — 10 princípios', reference: 'FDA/Health Canada/MHRA GMLP', evidence: 'Edge functions com logging, separação treino/inferência, prompts versionados', artifact: 'supabase/functions/*, PromptConfigurationTab', status: 'partial', action: 'Documentar matriz GMLP × função explicitamente', priority: 'P1', effort: 'M' },
  { authority: 'FDA', requirement: 'Transparency for users', reference: 'FDA AI/ML Transparency Principles', evidence: 'ClinicalPipelineLogPanel, DigitalTwinLogPanel, EvidenceGapLogPanel, DrugLookupBadge', artifact: 'src/components/pet/*LogPanel.tsx', status: 'meets', action: 'Adicionar nota de modelo (model card) por feature', priority: 'P2', effort: 'M' },
  { authority: 'FDA', requirement: 'Real-World Performance Monitoring', reference: 'FDA Draft Guidance §VII', evidence: 'Sem cohort tracking longitudinal pós-deploy', artifact: '— (gap)', status: 'gap', action: 'Implementar tabela outcome_observations + dashboard', priority: 'P0', effort: 'L' },
  { authority: 'FDA', requirement: 'Bias mitigation & subgroup performance', reference: 'GMLP Princípio 3', evidence: 'Política bilíngue PT/EN, dictionaries SNOMED/UMLS, foco canino documentado', artifact: 'src/data/biomedical-taxonomy.ts', status: 'partial', action: 'Avaliar viés por raça/porte e publicar relatório', priority: 'P1', effort: 'M' },
  { authority: 'FDA', requirement: 'Data quality & integrity', reference: 'GMLP Princípio 4', evidence: 'No-mock policy, curation gatekeeper, two-tier governance, SHA-256 dedup', artifact: 'mem://principles/curation-gatekeeper-for-vetgraphrag', status: 'meets', action: 'Auditoria periódica de integridade automatizada', priority: 'P2', effort: 'S' },

  // EMA
  { authority: 'EMA', requirement: 'Classificação como sistema de IA de alto risco', reference: 'EU AI Act Anexo III + EMA Reflection Paper Sept/2024', evidence: 'Sistema de apoio à decisão clínica veterinária — fora do escopo médico humano EU AI Act, mas adota controles equivalentes', artifact: 'docs/TECHNICAL_DECISIONS.md', status: 'partial', action: 'Publicar declaração formal de classificação', priority: 'P1', effort: 'S' },
  { authority: 'EMA', requirement: 'Human oversight (Art. 14)', reference: 'EU AI Act Art. 14', evidence: 'VetRecommendationPanel: aceitar/modificar/rejeitar; curadoria humana antes de ir ao KG', artifact: 'src/components/pet/VetRecommendationPanel.tsx', status: 'meets', action: 'Logar override do veterinário com justificativa', priority: 'P2', effort: 'S' },
  { authority: 'EMA', requirement: 'Technical documentation (Annex IV)', reference: 'EU AI Act Annex IV', evidence: 'ARCHITECTURE.md, CURRENT_STATE.md, STANFORD_DEMO.md, CHANGELOG.md', artifact: 'docs/, ARCHITECTURE.md', status: 'meets', action: 'Consolidar em dossiê único exportável', priority: 'P2', effort: 'M' },
  { authority: 'EMA', requirement: 'Logging & traceability', reference: 'EU AI Act Art. 12', evidence: 'study_audit_logs, KG provenance, triplet_extractions com source_id', artifact: 'tabelas study_audit_logs, hierarchical_edges', status: 'meets', action: 'Retenção mínima 6 meses formalizada', priority: 'P3', effort: 'S' },
  { authority: 'EMA', requirement: 'Accuracy, robustness, cybersecurity', reference: 'EU AI Act Art. 15', evidence: 'RLS em todas tabelas, secrets isolados, validation triggers, has_role()', artifact: 'supabase/migrations/, RLS policies', status: 'meets', action: 'Pen-test anual + SAST/DAST contínuo', priority: 'P1', effort: 'M' },
  { authority: 'EMA', requirement: 'Data governance (Art. 10)', reference: 'EU AI Act Art. 10', evidence: 'Base knowledge governance manual, soft-delete, two-tier confidence (>=50% auto)', artifact: 'mem://architecture/clinical-data-quality-two-tier-governance', status: 'partial', action: 'Documentar política de dataset (origem, consentimento)', priority: 'P1', effort: 'M' },

  // AVMA
  { authority: 'AVMA', requirement: 'Veterinarian-in-the-loop', reference: 'AVMA Framework Nov/2025', evidence: 'Pipeline de curadoria 7 estágios; nada chega ao KG sem aprovação humana (excl. >=50% auto)', artifact: 'TripletCurationBoard, hybrid-recommendation', status: 'meets', action: 'Tornar threshold auto-approve configurável por admin', priority: 'P2', effort: 'S' },
  { authority: 'AVMA', requirement: 'Species-specific validation', reference: 'AVMA Framework §3.2', evidence: 'Foco exclusivo canino documentado; sem validação cruzada felina/equina', artifact: 'mem://clinical/vetgraphrag-diagnostic-scope-constraints', status: 'gap', action: 'Marcar species=canine em todo triplet + bloquear extrapolação', priority: 'P0', effort: 'M' },
  { authority: 'AVMA', requirement: 'Off-label disclosure', reference: 'AVMA Framework §4.1', evidence: 'DrugLookupBadge sinaliza uso humano/extra-label e pH/disclaimer', artifact: 'src/components/pet/DrugLookupBadge.tsx', status: 'meets', action: 'Adicionar consent screen para tutor', priority: 'P2', effort: 'S' },
  { authority: 'AVMA', requirement: 'Continuing education for users', reference: 'AVMA Framework §6', evidence: 'Sem módulo de CE/treinamento integrado', artifact: '— (gap)', status: 'gap', action: 'Criar onboarding + biblioteca de evidência por compound', priority: 'P1', effort: 'L' },
  { authority: 'AVMA', requirement: 'Transparência sobre limitações', reference: 'AVMA Framework §5', evidence: 'Insight cards e badges indicam confiança; gap de evidência mostrado em EvidenceGapLogPanel', artifact: 'EvidenceGapLogPanel, recommendation-confidence-service', status: 'meets', action: 'Disclaimer permanente no rodapé das recomendações', priority: 'P3', effort: 'S' },
];

const STATUS_CFG: Record<Status, { label: string; cls: string; Icon: any }> = {
  meets:   { label: 'Atende',  cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: ShieldCheck },
  partial: { label: 'Parcial', cls: 'bg-amber-100 text-amber-800 border-amber-300',     Icon: AlertTriangle },
  gap:     { label: 'Gap',     cls: 'bg-rose-100 text-rose-800 border-rose-300',         Icon: XCircle },
};

const PRIORITY_CLS: Record<string, string> = {
  P0: 'bg-rose-600 text-white',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-sky-500 text-white',
  P3: 'bg-slate-400 text-white',
};

const ComplianceDashboard: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [authority, setAuthority] = useState<Authority | 'all'>('all');
  const [priority, setPriority] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DATA.filter(item => {
      if (authority !== 'all' && item.authority !== authority) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (priority !== 'all' && item.priority !== priority) return false;
      if (!q) return true;
      return (
        item.requirement.toLowerCase().includes(q) ||
        item.evidence.toLowerCase().includes(q) ||
        item.artifact.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q)
      );
    });
  }, [search, status, authority, priority]);

  const stats = useMemo(() => {
    const base = (items: ComplianceItem[]) => ({
      total: items.length,
      meets: items.filter(i => i.status === 'meets').length,
      partial: items.filter(i => i.status === 'partial').length,
      gap: items.filter(i => i.status === 'gap').length,
    });
    return {
      all: base(DATA),
      FDA: base(DATA.filter(i => i.authority === 'FDA')),
      EMA: base(DATA.filter(i => i.authority === 'EMA')),
      AVMA: base(DATA.filter(i => i.authority === 'AVMA')),
      filtered: base(filtered),
    };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ['authority','requirement','reference','evidence','artifact','status','priority','effort','action'];
    const rows = filtered.map(i => headers.map(h => `"${String((i as any)[h] ?? '').replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={`text-3xl font-semibold mt-1 ${tone ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );

  const renderTable = (items: ComplianceItem[]) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px]">Órgão</TableHead>
            <TableHead>Requisito</TableHead>
            <TableHead className="w-[28%]">Evidência no sistema</TableHead>
            <TableHead>Arquivo / Função</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[80px]">Prio.</TableHead>
            <TableHead>Ação recomendada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => {
            const cfg = STATUS_CFG[item.status];
            const Icon = cfg.Icon;
            return (
              <TableRow key={idx}>
                <TableCell><Badge variant="outline">{item.authority}</Badge></TableCell>
                <TableCell>
                  <div className="font-medium">{item.requirement}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.reference}</div>
                </TableCell>
                <TableCell className="text-sm">{item.evidence}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{item.artifact}</TableCell>
                <TableCell>
                  <Badge className={`${cfg.cls} border gap-1`} variant="outline">
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.priority && (
                    <Badge className={PRIORITY_CLS[item.priority]}>{item.priority}{item.effort ? `·${item.effort}` : ''}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{item.action}</TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum requisito corresponde aos filtros aplicados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard de Conformidade Regulatória</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mapeamento ponto a ponto FDA (Jan/2025) · EMA (Set/2024 + EU AI Act) · AVMA (Nov/2025)
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total de requisitos" value={stats.all.total} />
        <StatCard label="Atende" value={stats.all.meets} tone="text-emerald-600" />
        <StatCard label="Parcial" value={stats.all.partial} tone="text-amber-600" />
        <StatCard label="Gap" value={stats.all.gap} tone="text-rose-600" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por requisito, evidência, arquivo, ação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="meets">Atende</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="gap">Gap</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="P0">P0 — crítica</SelectItem>
              <SelectItem value="P1">P1 — alta</SelectItem>
              <SelectItem value="P2">P2 — média</SelectItem>
              <SelectItem value="P3">P3 — baixa</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={authority} onValueChange={(v) => setAuthority(v as any)}>
        <TabsList className="grid grid-cols-4 w-full md:w-[480px]">
          <TabsTrigger value="all">Todos ({stats.all.total})</TabsTrigger>
          <TabsTrigger value="FDA">FDA ({stats.FDA.total})</TabsTrigger>
          <TabsTrigger value="EMA">EMA ({stats.EMA.total})</TabsTrigger>
          <TabsTrigger value="AVMA">AVMA ({stats.AVMA.total})</TabsTrigger>
        </TabsList>
        <TabsContent value={authority} className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">
            Mostrando {stats.filtered.total} de {stats.all.total} — Atende: {stats.filtered.meets} · Parcial: {stats.filtered.partial} · Gap: {stats.filtered.gap}
          </div>
          {renderTable(filtered)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceDashboard;