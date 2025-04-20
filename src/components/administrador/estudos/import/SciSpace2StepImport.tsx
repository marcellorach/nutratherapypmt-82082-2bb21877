
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const ACCEPTED_META_SUMMARY = '.pdf,.doc,.docx';
const ACCEPTED_BASE_STUDY = '.csv,.xls,.bib,.json';

const SciSpace2StepImport: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [metaSummaryFile, setMetaSummaryFile] = useState<File | null>(null);
  const [baseStudiesFile, setBaseStudiesFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Save both files in Supabase Storage and register in DB
  const handleSubmit = async () => {
    if (!metaSummaryFile || !baseStudiesFile) {
      toast({
        title: 'Favor anexar ambos os arquivos',
        description: 'Você deve anexar o Meta Sumário e a Base de Estudos',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    setProgress(10);

    // Simples caminho para evitar conflitos de nome
    const timestamp = `${Date.now()}`;
    const metaPath = `scispace/${timestamp}_${metaSummaryFile.name}`;
    const basePath = `scispace/${timestamp}_${baseStudiesFile.name}`;

    // Upload meta summary
    const { data:metaUpload, error:metaErr } = await supabase.storage
      .from('scispace')
      .upload(metaPath, metaSummaryFile, { upsert: false });
    setProgress(40);

    // Upload base studies
    const { data:baseUpload, error:baseErr } = await supabase.storage
      .from('scispace')
      .upload(basePath, baseStudiesFile, { upsert: false });
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

    // Insere registro no banco
    const { error:dbErr } = await supabase
      .from('scispace_imports')
      .insert([{
        meta_summary_filename: metaSummaryFile.name,
        meta_summary_storage_path: metaPath,
        base_studies_filename: baseStudiesFile.name,
        base_studies_storage_path: basePath,
        scispace_status: 'especial'
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
      description: 'Os arquivos foram salvos e o registro adicionado como "especial".'
    });
    setMetaSummaryFile(null);
    setBaseStudiesFile(null);
    setStep(1);
    setLoading(false);
    setProgress(0);
  };

  return (
    <Card className="mx-auto max-w-lg my-6">
      <CardHeader>
        <CardTitle>Importação Manual SciSpace</CardTitle>
        <div className="text-gray-500 mb-2 text-sm">
          1. Anexe o <b>Meta Sumário</b> (.pdf, .doc, .docx)
          <br />
          2. Em seguida, anexe a <b>Base de Estudos</b> (.csv, .xls, .bib, .json)
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {step === 1 && (
            <div>
              <label className="block font-medium mb-2">Meta Sumário:</label>
              <input 
                type="file" 
                accept={ACCEPTED_META_SUMMARY}
                onChange={e => {
                  if (e.target.files?.[0]) setMetaSummaryFile(e.target.files[0]);
                }}
                disabled={loading}
              />
              {metaSummaryFile && (
                <div className="text-xs mt-2 text-gray-500">
                  Arquivo selecionado: <b>{metaSummaryFile.name}</b>
                </div>
              )}
              <Button 
                className="mt-4" 
                onClick={() => setStep(2)} 
                disabled={!metaSummaryFile || loading}
              >
                Próximo: Base de Estudos
              </Button>
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="block font-medium mb-2">Base de Estudos:</label>
              <input 
                type="file" 
                accept={ACCEPTED_BASE_STUDY}
                onChange={e => {
                  if (e.target.files?.[0]) setBaseStudiesFile(e.target.files[0]);
                }}
                disabled={loading}
              />
              {baseStudiesFile && (
                <div className="text-xs mt-2 text-gray-500">
                  Arquivo selecionado: <b>{baseStudiesFile.name}</b>
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!baseStudiesFile || loading}
                  className="relative"
                >
                  {loading ? (
                    <>
                      <span>Salvando...</span>
                      <Progress value={progress} className="h-2 mt-2" />
                    </>
                  ) : (
                    <>Finalizar Importação</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SciSpace2StepImport;
