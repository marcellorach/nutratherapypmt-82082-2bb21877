
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MetaSummaryUpload from './MetaSummaryUpload';
import BaseStudiesUpload from './BaseStudiesUpload';
import ConsensoForm from './ConsensoForm';
import SubmitImportButton from './SubmitImportButton';

const SciSpace2StepImport: React.FC = () => {
  const [metaSummaryFile, setMetaSummaryFile] = useState<File | null>(null);
  const [baseStudiesFile, setBaseStudiesFile] = useState<File | null>(null);
  const [consensoName, setConsensoName] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const canSave = !!(metaSummaryFile && baseStudiesFile && consensoName.trim());

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
          <MetaSummaryUpload
            metaSummaryFile={metaSummaryFile}
            setMetaSummaryFile={setMetaSummaryFile}
            disabled={loading}
          />
          <BaseStudiesUpload
            baseStudiesFile={baseStudiesFile}
            setBaseStudiesFile={setBaseStudiesFile}
            disabled={loading}
          />
        </div>
        <ConsensoForm
          consensoName={consensoName}
          setConsensoName={setConsensoName}
          comentarios={comentarios}
          setComentarios={setComentarios}
          disabled={loading}
        />
        <div>
          <SubmitImportButton
            onClick={handleSubmit}
            disabled={!canSave || loading}
            loading={loading}
            progress={progress}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SciSpace2StepImport;
