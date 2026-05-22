import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const OntologyBulkImportTab: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState<string>('');

  const run = async (dryRun: boolean) => {
    setRunning(true);
    setResult(null);
    setProgress('');
    try {
      const totals = {
        conditions: { total: 0, matched: 0, unmatched: 0, samples_matched: [] as any[], samples_unmatched: [] as any[] },
        nutraceuticals: { total: 0, matched: 0, unmatched: 0, samples_matched: [] as any[], samples_unmatched: [] as any[] },
      };
      let batch = 0;
      while (true) {
        batch++;
        setProgress(`Lote ${batch}…`);
        const { data, error } = await supabase.functions.invoke('import-canonical-ids', {
          body: { dry_run: dryRun, batch_size: 20 },
        });
        if (error) throw error;
        for (const k of ['conditions', 'nutraceuticals'] as const) {
          totals[k].total += data[k]?.total ?? 0;
          totals[k].matched += data[k]?.matched ?? 0;
          totals[k].unmatched += data[k]?.unmatched ?? 0;
          if (totals[k].samples_matched.length < 10) totals[k].samples_matched.push(...(data[k]?.samples_matched ?? []));
          if (totals[k].samples_unmatched.length < 20) totals[k].samples_unmatched.push(...(data[k]?.samples_unmatched ?? []));
        }
        setResult({ ...totals, dry_run: dryRun, batches: batch });
        if (!data.has_more) break;
        if (dryRun) break; // preview only does 1 batch
      }
      toast.success(dryRun ? 'Pré-visualização concluída' : 'IDs canônicos aplicados');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar IDs canônicos automaticamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Busca online (NCBI MeSH + EBI ChEBI/OMIA) o <code>canonical_id</code> de cada doença e
            nutracêutico sem ID, usando o nome em inglês (<code>name_en</code>). Sem necessidade de
            upload de arquivos. Pode levar 2–5 min (~220 itens × ~0.5s).
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => run(true)} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Pré-visualizar 1 lote (não grava)
            </Button>
            <Button onClick={() => run(false)} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Buscar e aplicar
            </Button>
            {progress && <span className="text-sm text-muted-foreground self-center">{progress}</span>}
          </div>

          {result && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3">
                  <div className="font-semibold">Doenças</div>
                  <div>Total sem ID: {result.conditions?.total}</div>
                  <div className="text-green-600">Encontradas: {result.conditions?.matched}</div>
                  <div className="text-muted-foreground">Sem match: {result.conditions?.unmatched}</div>
                </div>
                <div className="border rounded p-3">
                  <div className="font-semibold">Nutracêuticos</div>
                  <div>Total sem ID: {result.nutraceuticals?.total}</div>
                  <div className="text-green-600">Encontradas: {result.nutraceuticals?.matched}</div>
                  <div className="text-muted-foreground">Sem match: {result.nutraceuticals?.unmatched}</div>
                </div>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Ver detalhes (JSON)</summary>
                <pre className="bg-muted p-3 rounded overflow-auto max-h-96 mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OntologyBulkImportTab;
