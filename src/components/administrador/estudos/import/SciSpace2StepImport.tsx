import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X, Database } from "lucide-react";

const ACCEPTED_META_SUMMARY = '.pdf,.doc,.docx';
const ACCEPTED_BASE_STUDY = '.csv,.xls,.bib,.json';

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  else return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const sizeColor = (size: number): string => {
  if (size < 1024 * 50) return 'text-green-600';           // até 50KB verde
  if (size < 1024 * 200) return 'text-yellow-600';         // até 200KB amarelo
  if (size < 1024 * 1024) return 'text-orange-500';        // até 1MB laranja
  return 'text-red-600';                                   // acima, vermelho
};

const SciSpace2StepImport: React.FC = () => {
  const [metaSummaryFile, setMetaSummaryFile] = useState<File | null>(null);
  const [baseStudiesFile, setBaseStudiesFile] = useState<File | null>(null);
  const [consensoName, setConsensoName] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const canSave = !!(metaSummaryFile && baseStudiesFile && consensoName.trim());

  const handleRemoveMeta = () => setMetaSummaryFile(null);
  const handleRemoveBase = () => setBaseStudiesFile(null);

  const handleSubmit = async () => {
    if (!canSave) return;
    setLoading(true);
    setProgress(10);

    try {
      const timestamp = Date.now().toString();
      const metaFileName = `${timestamp}_${metaSummaryFile!.name.replace(/[^\w\s.-]/g, '')}`;
      const baseFileName = `${timestamp}_${baseStudiesFile!.name.replace(/[^\w\s.-]/g, '')}`;
      
      const metaPath = `meta/${metaFileName}`;
      const basePath = `base/${baseFileName}`;

      const { error:metaErr } = await supabase.storage
        .from('scispace')
        .upload(metaPath, metaSummaryFile!, { 
          upsert: false,
          contentType: metaSummaryFile!.type
        });
      
      setProgress(40);
      
      if (metaErr) {
        console.error("Erro ao fazer upload do Meta Sumário:", metaErr);
        toast({
          title: 'Erro no upload do Meta Sumário',
          description: metaErr.message,
          variant: 'destructive'
        });
        setLoading(false);
        setProgress(0);
        return;
      }

      const { error:baseErr } = await supabase.storage
        .from('scispace')
        .upload(basePath, baseStudiesFile!, { 
          upsert: false,
          contentType: baseStudiesFile!.type
        });
      
      setProgress(70);
      
      if (baseErr) {
        console.error("Erro ao fazer upload da Base de Estudos:", baseErr);
        toast({
          title: 'Erro no upload da Base de Estudos',
          description: baseErr.message,
          variant: 'destructive'
        });
        setLoading(false);
        setProgress(0);
        return;
      }

      const { error:dbErr } = await supabase
        .from('scispace_imports')
        .insert([{
          meta_summary_filename: metaSummaryFile!.name,
          meta_summary_storage_path: metaPath,
          base_studies_filename: baseStudiesFile!.name,
          base_studies_storage_path: basePath,
          scispace_status: 'especial',
          notes: comentarios,
          nutraceutical: consensoName
        }]);
      
      setProgress(100);

      if (dbErr) {
        console.error("Erro ao registrar importação no banco:", dbErr);
        toast({
          title: 'Erro ao registrar importação',
          description: dbErr.message,
          variant: 'destructive'
        });
        setLoading(false);
        setProgress(0);
        return;
      }

      toast({
        title: 'Importação registrada',
        description: 'Arquivos e informações salvos com sucesso.'
      });
      
      setMetaSummaryFile(null);
      setBaseStudiesFile(null);
      setConsensoName('');
      setComentarios('');
      setLoading(false);
      setProgress(0);
      
    } catch (err: any) {
      console.error("Erro inesperado:", err);
      toast({
        title: 'Erro inesperado',
        description: err?.message || 'Ocorreu um erro ao processar sua solicitação',
        variant: 'destructive'
      });
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl my-6">
      <CardHeader>
        <CardTitle>Importação Manual SciSpace</CardTitle>
        <CardDescription>
          <span className="block">1. Carregue o <b>Meta Sumário</b> e a <b>Base de Estudos</b> (ambos obrigatórios)</span>
          <span className="block text-gray-500 text-xs mt-2">
            Preencha todos os campos obrigatórios para salvar.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 border rounded-md bg-gray-50 p-4 flex flex-col items-start">
            <span className="font-semibold mb-2 text-sm">Meta Sumário</span>
            {!metaSummaryFile ? (
              <>
                <input
                  type="file"
                  accept={ACCEPTED_META_SUMMARY}
                  id="metaFile"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) setMetaSummaryFile(e.target.files[0]);
                  }}
                  disabled={loading}
                />
                <label htmlFor="metaFile">
                  <Button variant="outline" asChild>
                    <span>Selecionar Arquivo</span>
                  </Button>
                </label>
                <span className="text-xs text-gray-400 mt-2">Formatos aceitos: .pdf, .doc, .docx</span>
              </>
            ) : (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-[300px] truncate">
                  <span className="truncate max-w-[60ch]">{metaSummaryFile.name}</span>
                  <span className={`${sizeColor(metaSummaryFile.size)} flex items-center text-xs font-medium gap-1`}>
                    <Database className="h-4 w-4 flex-shrink-0" />
                    {formatFileSize(metaSummaryFile.size)}
                  </span>
                </div>
                <Button size="icon" variant="ghost" onClick={handleRemoveMeta} aria-label="Remover Meta Sumário" className="ml-2 text-red-600 hover:text-red-700">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 border rounded-md bg-gray-50 p-4 flex flex-col items-start">
            <span className="font-semibold mb-2 text-sm">Base de Estudos</span>
            {!baseStudiesFile ? (
              <>
                <input
                  type="file"
                  accept={ACCEPTED_BASE_STUDY}
                  id="baseFile"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) setBaseStudiesFile(e.target.files[0]);
                  }}
                  disabled={loading}
                />
                <label htmlFor="baseFile">
                  <Button variant="outline" asChild>
                    <span>Selecionar Arquivo</span>
                  </Button>
                </label>
                <span className="text-xs text-gray-400 mt-2">Formatos aceitos: .csv, .xls, .bib, .json</span>
              </>
            ) : (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-[300px] truncate">
                  <span className="truncate max-w-[60ch]">{baseStudiesFile.name}</span>
                  <span className={`${sizeColor(baseStudiesFile.size)} flex items-center text-xs font-medium gap-1`}>
                    <Database className="h-4 w-4 flex-shrink-0" />
                    {formatFileSize(baseStudiesFile.size)}
                  </span>
                </div>
                <Button size="icon" variant="ghost" onClick={handleRemoveBase} aria-label="Remover Base de Estudos" className="ml-2 text-red-600 hover:text-red-700">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="mb-4 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Nome do Consenso Integrativo <span className="text-red-500">*</span></label>
            <Input
              value={consensoName}
              onChange={(e) => setConsensoName(e.target.value)}
              disabled={loading}
              placeholder="Ex: Consenso Brasileiro de Saúde Articular 2025"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Comentários Gerais</label>
            <Textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              disabled={loading}
              placeholder="Observações importantes sobre este consenso ou base de estudos."
              rows={2}
            />
          </div>
        </div>
        <div>
          <Button
            onClick={handleSubmit}
            disabled={!canSave || loading}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <span>Salvando...</span>
                <Progress value={progress} className="h-2 bg-gray-100 mt-2 w-full" />
              </>
            ) : (
              <>Salvar Importação</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SciSpace2StepImport;
