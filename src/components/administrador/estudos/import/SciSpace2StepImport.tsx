
import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SciSpaceStepSelect from "./SciSpaceStepSelect";
import SciSpaceUploadMetaResumo from "./SciSpaceUploadMetaResumo";
import SciSpaceUploadBaseEstudos from "./SciSpaceUploadBaseEstudos";
import SciSpaceReviewAndSubmit from "./SciSpaceReviewAndSubmit";
import SciSpaceProcessingPreviewMini from "./SciSpaceProcessingPreviewMini";
import MetaSummaryUpload from "./MetaSummaryUpload";
import BaseStudiesUpload from "./BaseStudiesUpload";

const SciSpace2StepImport: React.FC = () => {
  const [step, setStep] = useState(0);
  const [metaSummaryFile, setMetaSummaryFile] = useState<File | null>(null);
  const [baseStudiesFile, setBaseStudiesFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [consensoName, setConsensoName] = useState("");
  const [comentarios, setComentarios] = useState("");

  const handleSubmit = async () => {
    if (!metaSummaryFile || !baseStudiesFile) {
      toast({
        title: "Arquivos faltando",
        description: "Por favor, selecione os dois arquivos antes de submeter.",
        variant: "destructive",
      });
      return;
    }

    if (!consensoName) {
      toast({
        title: "Nome do Consenso Integrativo faltando",
        description: "Por favor, preencha o nome do Consenso Integrativo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // 1. Upload dos arquivos para o Storage
      const metaSummaryPath = `scispace/${Date.now()}-${metaSummaryFile.name}`;
      const baseStudiesPath = `scispace/${Date.now()}-${baseStudiesFile.name}`;

      const { error: metaError } = await supabase.storage
        .from("scispace")
        .upload(metaSummaryPath, metaSummaryFile);

      const { error: baseError } = await supabase.storage
        .from("scispace")
        .upload(baseStudiesPath, baseStudiesFile);

      if (metaError || baseError) {
        throw new Error(
          `Erro ao fazer upload dos arquivos: ${metaError?.message || ""} ${
            baseError?.message || ""
          }`
        );
      }

      setProgress(30);

      // 2. Salvar informações no banco de dados
      const { data: insertData, error: insertError } = await supabase
        .from("scispace_imports")
        .insert([
          {
            meta_summary_filename: metaSummaryFile.name,
            meta_summary_storage_path: metaSummaryPath,
            base_studies_filename: baseStudiesFile.name,
            base_studies_storage_path: baseStudiesPath,
            consenso_name: consensoName,
            consenso_comments: comentarios,
          },
        ])
        .select()

      if (insertError) {
        throw new Error(`Erro ao salvar informações no banco: ${insertError.message}`);
      }

      setProgress(70);

      // Simula um tempo de processamento extra
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress(100);
      toast({
        title: "Importação Concluída!",
        description: `Arquivos enviados e metadados salvos com sucesso.`,
      });
      setMetaSummaryFile(null);
      setBaseStudiesFile(null);
      setConsensoName("");
      setComentarios("");
      setStep(0);
    } catch (error: any) {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-3">
      <div className="mb-6">
        <SciSpaceStepSelect
          currentStep={step}
          setStep={setStep}
          canGoNext={!!metaSummaryFile}
        />
      </div>
      {step === 0 && (
        <SciSpaceUploadMetaResumo
          metaSummaryFile={metaSummaryFile}
          setMetaSummaryFile={setMetaSummaryFile}
          disabled={isLoading}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <SciSpaceUploadBaseEstudos
          baseStudiesFile={baseStudiesFile}
          setBaseStudiesFile={setBaseStudiesFile}
          disabled={isLoading}
          onPrev={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <SciSpaceReviewAndSubmit
          metaSummaryFile={metaSummaryFile}
          baseStudiesFile={baseStudiesFile}
          loading={isLoading}
          progress={progress}
          canSubmit={!!metaSummaryFile && !!baseStudiesFile}
          onPrev={() => setStep(1)}
          onSubmit={handleSubmit}
          consensoName={consensoName}
          setConsensoName={setConsensoName}
          comentarios={comentarios}
          setComentarios={setComentarios}
        />
      )}
      {isLoading && <SciSpaceProcessingPreviewMini progress={progress} />}
    </div>
  );
};

export default SciSpace2StepImport;
