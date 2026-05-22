import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const OntologyBulkImportTab: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async (dryRun: boolean) => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('import-canonical-ids', {
        body: { dry_run: dryRun },
      });
      if (error) throw error;
      setResult(data);
      toast.success(dryRun ? 'Pré-visualização concluída' : 'IDs canônicos aplicados');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
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
              Pré-visualizar (não grava)
            </Button>
            <Button onClick={() => run(false)} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Buscar e aplicar
            </Button>
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
