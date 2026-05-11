import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShieldCheck, ShieldAlert, GitCompareArrows, Brain, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  auditPetLongitudinalIntegrity,
  fetchLongitudinalDebug,
  compareWithVsWithoutHistory,
  type PetIntegrityRow,
  type RecommendationRun,
  type ComparisonReport,
} from '@/services/longitudinal-debug-service';

interface Props {
  petId: string;
  petProfile: { species?: string; breed?: string; age?: number; weight?: number };
  primaryCondition?: string;
}

export default function LongitudinalDebugPanel({ petId, petProfile, primaryCondition }: Props) {
  const [audit, setAudit] = useState<PetIntegrityRow | null>(null);
  const [debug, setDebug] = useState<RecommendationRun | null>(null);
  const [comparison, setComparison] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState<'audit' | 'debug' | 'compare' | null>(null);
  const condition = primaryCondition || 'Saúde geral';

  const runAudit = async () => {
    setLoading('audit');
    try {
      const rows = await auditPetLongitudinalIntegrity(petId);
      setAudit(rows[0] ?? null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha na auditoria');
    } finally { setLoading(null); }
  };

  const runDebug = async () => {
    setLoading('debug');
    try {
      const r = await fetchLongitudinalDebug(petId, condition, petProfile);
      setDebug(r);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao obter blocos de raciocínio');
    } finally { setLoading(null); }
  };

  const runCompare = async () => {
    setLoading('compare');
    try {
      const c = await compareWithVsWithoutHistory(petId, condition, petProfile);
      setComparison(c);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha na comparação');
    } finally { setLoading(null); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Depuração do MedGraphRAG longitudinal
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Verifique a integridade do histórico, inspecione os blocos enviados ao modelo e compare a inferência com vs. sem histórico.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="audit">
          <TabsList className="mb-3">
            <TabsTrigger value="audit"><ShieldCheck className="h-3 w-3 mr-1" />Auditoria</TabsTrigger>
            <TabsTrigger value="debug"><Brain className="h-3 w-3 mr-1" />Blocos usados</TabsTrigger>
            <TabsTrigger value="compare"><GitCompareArrows className="h-3 w-3 mr-1" />Comparação</TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-3">
            <Button size="sm" onClick={runAudit} disabled={loading === 'audit'}>
              {loading === 'audit' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
              Auditar histórico longitudinal
            </Button>
            {audit && (
              <div className="border rounded-md p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {audit.ok
                    ? <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Íntegro</Badge>
                    : <Badge variant="destructive"><ShieldAlert className="h-3 w-3 mr-1" />{audit.warnings.length} alerta(s)</Badge>}
                  <span className="font-medium">{audit.pet_name}</span>
                  {audit.is_demo && <Badge variant="secondary" className="text-[10px]">demo</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Consultas" value={audit.consultations} />
                  <Stat label="is_latest correto" value={audit.has_is_latest ? 'sim' : 'não'} bad={!audit.has_is_latest} />
                  <Stat label="Última consulta" value={audit.latest_consultation_date ?? '—'} />
                  <Stat label="Dieta atual" value={audit.nutrition_current} bad={audit.nutrition_current !== 1} />
                  <Stat label="Condições (linkadas / total)" value={`${audit.conditions_linked} / ${audit.conditions_total}`} bad={audit.conditions_total > audit.conditions_linked} />
                  <Stat label="Medicações (linkadas / total)" value={`${audit.medications_linked} / ${audit.medications_total}`} bad={audit.medications_total > audit.medications_linked} />
                  <Stat label="Exames (linkados / total)" value={`${audit.exams_linked} / ${audit.exams_total}`} bad={audit.exams_total > audit.exams_linked} />
                </div>
                {audit.warnings.length > 0 && (
                  <ul className="text-xs text-destructive space-y-1 mt-2">
                    {audit.warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="debug" className="space-y-3">
            <Button size="sm" onClick={runDebug} disabled={loading === 'debug'}>
              {loading === 'debug' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />}
              Inspecionar blocos enviados ao modelo
            </Button>
            {debug?.debug && (
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  <BlockBadge label="CURRENT_STATE (peso 1.0)" active={debug.debug.longitudinal.hasCurrentState} />
                  <BlockBadge label={`CLINICAL_TRAJECTORY (peso 0.4) · ${debug.debug.longitudinal.trajectoryEntries} entrada(s)`} active={debug.debug.longitudinal.hasClinicalTrajectory} />
                  <BlockBadge label="DIET_PROFILE" active={debug.debug.longitudinal.hasDietProfile} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Última consulta" value={debug.debug.longitudinal.latestConsultationDate ?? '—'} />
                  <Stat label="Condições ativas" value={debug.debug.longitudinal.activeConditions.length} />
                  <Stat label="Exames anormais" value={debug.debug.longitudinal.abnormalExams.length} />
                  <Stat label="Produtos da dieta" value={debug.debug.longitudinal.dietProducts.length} />
                </div>
                <details className="border rounded-md p-2">
                  <summary className="cursor-pointer text-primary">Ver bloco de contexto enviado ao LLM</summary>
                  <ScrollArea className="h-64 mt-2">
                    <pre className="text-[10px] whitespace-pre-wrap">{debug.debug.renderedContextBlock || '(vazio)'}</pre>
                  </ScrollArea>
                </details>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="space-y-3">
            <Button size="sm" onClick={runCompare} disabled={loading === 'compare'}>
              {loading === 'compare' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <GitCompareArrows className="h-3 w-3 mr-1" />}
              Comparar inferência com vs. sem histórico
            </Button>
            {comparison && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Compostos adicionados pelo histórico" value={comparison.diff.addedCompounds.length} />
                  <Stat label="Compostos removidos sem histórico" value={comparison.diff.removedCompounds.length} />
                  <Stat label="Compostos em comum" value={comparison.diff.sharedCompounds.length} />
                  <Stat label="Flags anormais consideradas (com)" value={comparison.diff.abnormalFlagsConsidered.withHistory} />
                  <Stat label="Flags anormais (sem)" value={comparison.diff.abnormalFlagsConsidered.withoutHistory} />
                  <Stat label="Menções a lacuna nutricional (com / sem)" value={`${comparison.diff.nutritionalGapMentions.withHistory} / ${comparison.diff.nutritionalGapMentions.withoutHistory}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CompoundList title="Com histórico" items={comparison.withHistory.nutraceuticals.map((n) => n.name)} highlight={comparison.diff.addedCompounds} />
                  <CompoundList title="Sem histórico" items={comparison.withoutHistory.nutraceuticals.map((n) => n.name)} highlight={comparison.diff.removedCompounds} />
                </div>
                <details className="border rounded-md p-2">
                  <summary className="cursor-pointer text-primary">Ver racionais comparados</summary>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <p className="font-medium mb-1">Com histórico</p>
                      <p className="whitespace-pre-wrap text-muted-foreground">{comparison.withHistory.rationale}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Sem histórico</p>
                      <p className="whitespace-pre-wrap text-muted-foreground">{comparison.withoutHistory.rationale}</p>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return (
    <div className={`border rounded-md p-2 ${bad ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`font-medium ${bad ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  );
}

function BlockBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <Badge variant={active ? 'default' : 'outline'} className={active ? '' : 'opacity-60'}>
      {active ? '✓' : '○'} {label}
    </Badge>
  );
}

function CompoundList({ title, items, highlight }: { title: string; items: string[]; highlight: string[] }) {
  const hl = new Set(highlight.map((s) => s.toLowerCase()));
  return (
    <div className="border rounded-md p-2">
      <p className="font-medium mb-1">{title} <span className="text-muted-foreground">({items.length})</span></p>
      {items.length === 0 ? (
        <p className="text-muted-foreground italic">Nenhum composto recomendado.</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((n, i) => (
            <li key={i} className={hl.has(n.toLowerCase()) ? 'text-primary font-medium' : ''}>• {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}