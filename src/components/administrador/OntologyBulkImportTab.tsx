import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FILES = [
  { key: 'omia-canine.json', label: 'OMIA (canino)' },
  { key: 'mesh.json', label: 'MeSH' },
  { key: 'chebi.json', label: 'ChEBI' },
] as const;

type FileKey = typeof FILES[number]['key'];

const OntologyBulkImportTab: React.FC = () => {
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    'omia-canine.json': null, 'mesh.json': null, 'chebi.json': null,
  });
  const [uploaded, setUploaded] = useState<Record<FileKey, boolean>>({
    'omia-canine.json': false, 'mesh.json': false, 'chebi.json': false,
  });
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const setFile = (k: FileKey, f: File | null) => setFiles((p) => ({ ...p, [k]: f }));

  const uploadAll = async () => {
    setUploading(true);
    try {
      for (const { key } of FILES) {
        const f = files[key];
        if (!f) continue;
        const { error } = await supabase.storage
          .from('ontology-indexes')
          .upload(key, f, { upsert: true, contentType: 'application/json' });
        if (error) throw new Error(`${key}: ${error.message}`);
        setUploaded((p) => ({ ...p, [key]: true }));
        toast.success(`Upload OK: ${key}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const run = async (dryRun: boolean) => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('import-canonical-ids', {
        body: { dry_run: dryRun },
      });
      if (error) throw error;
      setResult(data);
      toast.success(dryRun ? 'Dry-run concluído' : 'Importação aplicada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const allUploaded = FILES.every((f) => uploaded[f.key]);
  const anySelected = FILES.some((f) => files[f.key]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload dos índices de ontologia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FILES.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-40 shrink-0">{label}</Label>
              <Input
                type="file"
                accept="application/json,.json"
                onChange={(e) => setFile(key, e.target.files?.[0] ?? null)}
              />
              {uploaded[key] && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
            </div>
          ))}
          <Button onClick={uploadAll} disabled={!anySelected || uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Fazer upload
          </Button>
          <p className="text-xs text-muted-foreground">
            Os arquivos vão para o bucket privado <code>ontology-indexes</code>. ChEBI é ~40MB, pode levar 1–2 min.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Importar canonical IDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => run(true)} disabled={running || !allUploaded}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Dry-run (não grava)
            </Button>
            <Button onClick={() => run(false)} disabled={running || !allUploaded}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Aplicar
            </Button>
          </div>
          {!allUploaded && (
            <p className="text-xs text-muted-foreground">Faça upload dos 3 arquivos antes de rodar.</p>
          )}
          {result && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OntologyBulkImportTab;