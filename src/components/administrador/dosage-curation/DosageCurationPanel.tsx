import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DosageRef {
  id: string;
  compound_name_en: string;
  condition_name_en: string | null;
  species: string;
  min_mg_per_kg: number | null;
  max_mg_per_kg: number | null;
  unit: string;
  frequency_per_day: number | null;
  route: string | null;
  source_type: string;
  source_url: string | null;
  source_citation: string | null;
  confidence: number | null;
  needs_review: boolean;
  notes: string | null;
  created_at: string;
  curated_at: string | null;
}

interface UsageRow {
  compound_name: string;
  condition_name: string | null;
  count: number;
  last_source: string;
  last_used: string;
}

export default function DosageCurationPanel() {
  const { toast } = useToast();
  const [pending, setPending] = useState<DosageRef[]>([]);
  const [curated, setCurated] = useState<DosageRef[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<DosageRef>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: refs }, { data: logs }] = await Promise.all([
      supabase.from('compound_dosage_reference').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('dosage_lookup_log').select('compound_name, condition_name, resolved_source, created_at').order('created_at', { ascending: false }).limit(2000),
    ]);
    const all = (refs as DosageRef[]) || [];
    setPending(all.filter(r => r.needs_review));
    setCurated(all.filter(r => !r.needs_review));

    // Aggregate usage
    const map = new Map<string, UsageRow>();
    (logs || []).forEach((l: any) => {
      const key = `${l.compound_name}::${l.condition_name || ''}`;
      const cur = map.get(key);
      if (cur) {
        cur.count++;
      } else {
        map.set(key, {
          compound_name: l.compound_name,
          condition_name: l.condition_name,
          count: 1,
          last_source: l.resolved_source,
          last_used: l.created_at,
        });
      }
    });
    setUsage(Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 100));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (r: DosageRef) => {
    setEditingId(r.id);
    setDraft({ ...r });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const approve = async (r: DosageRef) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const payload = editingId === r.id ? draft : r;
    const { error } = await supabase
      .from('compound_dosage_reference')
      .update({
        min_mg_per_kg: payload.min_mg_per_kg,
        max_mg_per_kg: payload.max_mg_per_kg,
        max_daily_mg: (payload as any).max_daily_mg ?? null,
        frequency_per_day: payload.frequency_per_day,
        route: payload.route,
        source_type: payload.source_type,
        source_url: payload.source_url,
        source_citation: payload.source_citation,
        confidence: payload.confidence,
        notes: payload.notes,
        needs_review: false,
        curated_at: new Date().toISOString(),
        curated_by: userId,
      })
      .eq('id', r.id);
    if (error) {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Dose curada', description: `${r.compound_name_en} aprovada.` });
    cancelEdit();
    load();
  };

  const reject = async (r: DosageRef) => {
    if (!confirm(`Remover entrada de ${r.compound_name_en}?`)) return;
    const { error } = await supabase.from('compound_dosage_reference').delete().eq('id', r.id);
    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Removida' });
    load();
  };

  const sourceBadge = (s: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      curated: { label: 'Curado', variant: 'default' },
      web_authoritative: { label: 'Web Autoritativo', variant: 'secondary' },
      kg_triplet: { label: 'KG Triplet', variant: 'outline' },
      ai_estimate: { label: 'Estimativa IA', variant: 'destructive' },
      generic_default: { label: 'Default', variant: 'destructive' },
    };
    const m = map[s] || { label: s, variant: 'outline' as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  const renderRow = (r: DosageRef) => {
    const isEdit = editingId === r.id;
    const d = isEdit ? draft : r;
    return (
      <TableRow key={r.id}>
        <TableCell className="font-medium">
          {r.compound_name_en}
          {r.condition_name_en && <div className="text-xs text-muted-foreground">{r.condition_name_en}</div>}
        </TableCell>
        <TableCell>
          {isEdit ? (
            <div className="flex gap-1">
              <Input type="number" step="0.1" className="w-20" value={d.min_mg_per_kg ?? ''} onChange={e => setDraft({ ...draft, min_mg_per_kg: parseFloat(e.target.value) || null })} />
              <span className="self-center">–</span>
              <Input type="number" step="0.1" className="w-20" value={d.max_mg_per_kg ?? ''} onChange={e => setDraft({ ...draft, max_mg_per_kg: parseFloat(e.target.value) || null })} />
            </div>
          ) : (
            <span>{r.min_mg_per_kg ?? '?'}–{r.max_mg_per_kg ?? '?'} mg/kg</span>
          )}
        </TableCell>
        <TableCell>
          {isEdit ? (
            <Input type="number" step="0.5" className="w-16" value={d.frequency_per_day ?? ''} onChange={e => setDraft({ ...draft, frequency_per_day: parseFloat(e.target.value) || null })} />
          ) : (
            <span>{r.frequency_per_day ?? '–'}x/dia</span>
          )}
        </TableCell>
        <TableCell>{sourceBadge(r.source_type)}</TableCell>
        <TableCell>
          {isEdit ? (
            <Input className="w-32" value={d.source_url ?? ''} onChange={e => setDraft({ ...draft, source_url: e.target.value })} />
          ) : r.source_url ? (
            <a href={r.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
              {(r.source_citation || 'Fonte').slice(0, 30)}<ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">{r.source_citation?.slice(0, 30) || '–'}</span>
          )}
        </TableCell>
        <TableCell>{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '–'}</TableCell>
        <TableCell>
          <div className="flex gap-1">
            {isEdit ? (
              <>
                <Button size="sm" onClick={() => approve(r)}>Salvar+Aprovar</Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
              </>
            ) : (
              <>
                {r.needs_review && (
                  <Button size="sm" variant="default" onClick={() => approve(r)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />Aprovar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => reject(r)}>Remover</Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Curadoria de Doses Clínicas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Revise doses extraídas automaticamente da web ou estimadas por IA antes de torná-las canônicas.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes <Badge variant="destructive" className="ml-2">{pending.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="curated">
                Curadas <Badge variant="secondary" className="ml-2">{curated.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="usage">
                Mais Usadas <Badge variant="outline" className="ml-2">{usage.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pending.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  Nenhuma dose pendente. Todas curadas! 🎉
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Composto / Condição</TableHead>
                      <TableHead>Faixa (mg/kg)</TableHead>
                      <TableHead>Freq</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Citação</TableHead>
                      <TableHead>Conf.</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{pending.map(renderRow)}</TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="curated" className="mt-4">
              {curated.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                  Nenhuma dose curada ainda.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Composto / Condição</TableHead>
                      <TableHead>Faixa (mg/kg)</TableHead>
                      <TableHead>Freq</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Citação</TableHead>
                      <TableHead>Conf.</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{curated.map(renderRow)}</TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="usage" className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Doses mais frequentemente solicitadas pelo pipeline. Priorize curar as do topo.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Composto</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Última fonte</TableHead>
                    <TableHead>Última vez</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{u.compound_name}</TableCell>
                      <TableCell className="text-xs">{u.condition_name || '–'}</TableCell>
                      <TableCell><Badge>{u.count}</Badge></TableCell>
                      <TableCell>{sourceBadge(u.last_source)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.last_used).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}