
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const ACCEPTED_META_SUMMARY = '.pdf,.doc,.docx';
const ACCEPTED_BASE_STUDY = '.csv,.xls,.bib,.json';

const SciSpace2StepImport: React.FC = () => {
  const [metaSummaryFile, setMetaSummaryFile] = useState<File | null>(null);
  const [baseStudiesFile, setBaseStudiesFile] = useState<File | null>(null);
  const [consensoName, setConsensoName] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Só habilita botão se ambos arquivos e nome do consenso preenchidos
  const canSave = !!(metaSummaryFile && baseStudiesFile && consensoName.trim());

  // Remove arquivos enviados
  const handleRemoveMeta = () => setMetaSummaryFile(null);
  const handleRemoveBase = () => setBaseStudiesFile(null);

  // Salvar os arquivos e informações
  const handleSubmit = async () => {
    if (!canSave) return;
    setLoading(true);
    setProgress(10);

    const timestamp = `${Date.now()}`;
    const metaPath = `scispace/${timestamp}_${metaSummaryFile!.name}`;
    const basePath = `scispace/${timestamp}_${baseStudiesFile!.name}`;

    // Upload meta summary
    const { error:metaErr } = await supabase.storage
      .from('scispace')
      .upload(metaPath, metaSummaryFile!, { upsert: false });
    setProgress(40);

    // Upload base studies
    const { error:baseErr } = await supabase.storage
      .from('scispace')
      .upload(basePath, baseStudiesFile!, { upsert: false });
    setProgress(70);

    if (metaErr || baseErr) {
      toast({
        title: 'Erro no upload',
        description: (metaErr?.message || '') + ' ' + (baseErr?.message || ''),
        variant: 'destructive'
      });
      setLoading(false);
      setProgress(0);
      return;
    }

    // Registrar no banco
    const { error:dbErr } = await supabase
      .from('scispace_imports')
      .insert([{
        meta_summary_filename: metaSummaryFile!.name,
        meta_summary_storage_path: metaPath,
        base_studies_filename: baseStudiesFile!.name,
        base_studies_storage_path: basePath,
        scispace_status: 'especial',
        notes: comentarios,
        nutraceutical: consensoName // aproveitando este campo para o nome do consenso
      }]);
    setProgress(100);

    if (dbErr) {
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
      description: 'Arquivos e informações salvos como "especial".'
    });
    setMetaSummaryFile(null);
    setBaseStudiesFile(null);
    setConsensoName('');
    setComentarios('');
    setLoading(false);
    setProgress(0);
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
          {/* QUADRADO META SUMÁRIO */}
          <div className="flex-1 border rounded-md bg-gray-50 p-4 flex flex-col items-start">
            <span className="font-medium mb-2">Meta Sumário</span>
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
              <div className="flex items-center gap-2">
                <span className="text-sm truncate max-w-[180px]">{metaSummaryFile.name}</span>
                <Button size="icon" variant="ghost" onClick={handleRemoveMeta} aria-label="Remover Meta Sumário">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {/* QUADRADO BASE DE ESTUDOS */}
          <div className="flex-1 border rounded-md bg-gray-50 p-4 flex flex-col items-start">
            <span className="font-medium mb-2">Base de Estudos</span>
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
              <div className="flex items-center gap-2">
                <span className="text-sm truncate max-w-[180px]">{baseStudiesFile.name}</span>
                <Button size="icon" variant="ghost" onClick={handleRemoveBase} aria-label="Remover Base de Estudos">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* NOME DO CONSENSO E COMENTÁRIOS */}
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
        {/* BOTÃO SALVAR */}
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

