import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SciSpaceStepSelect from "./SciSpaceStepSelect";
import SciSpaceUploadMetaResumo from "./SciSpaceUploadMetaResumo";
import SciSpaceUploadBaseEstudos from "./SciSpaceUploadBaseEstudos";
import SciSpaceReviewAndSubmit from "./SciSpaceReviewAndSubmit";
import SciSpaceProcessingPreviewMini from "./SciSpaceProcessingPreviewMini";

const SciSpace2StepImport: React.FC = () => {
  const [step, setStep] = useState(0);
  const [metaSummaryFiles, setMetaSummaryFiles] = useState<File[]>([]);
  const [baseStudiesFile, setBaseStudiesFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [consensoName, setConsensoName] = useState("");
  const [comentarios, setComentarios] = useState("");

  const handleSubmit = async () => {
    if (metaSummaryFiles.length === 0 || !baseStudiesFile) {
      toast({
        title: "Arquivos faltando",
        description: "Por favor, selecione pelo menos um arquivo de meta sumário e um arquivo de base de estudos.",
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
      const metaSummaryPaths = await Promise.all(
        metaSummaryFiles.map(async (file) => {
          const path = `scispace/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("scispace").upload(path, file);
          if (error) throw error;
          return { filename: file.name, path };
        })
      );

      const baseStudiesPath = `scispace/${Date.now()}-${baseStudiesFile.name}`;
      const { error: baseError } = await supabase.storage.from("scispace").upload(baseStudiesPath, baseStudiesFile);
      if (baseError) {
        throw new Error(`Erro ao fazer upload do arquivo base: ${baseError.message}`);
      }

      setProgress(30);

      await Promise.all(
        metaSummaryPaths.map(async (meta) => {
          const { error: insertError } = await supabase
            .from("scispace_imports")
            .insert([
              {
                meta_summary_filename: meta.filename,
                meta_summary_storage_path: meta.path,
                base_studies_filename: baseStudiesFile.name,
                base_studies_storage_path: baseStudiesPath,
                consenso_name: consensoName,
                consenso_comments: comentarios,
              },
            ]);
          if (insertError) {
            throw new Error(`Erro ao salvar informações no banco: ${insertError.message}`);
          }
        })
      );

      setProgress(70);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProgress(100);
      toast({
        title: "Importação Concluída!",
        description: `${metaSummaryFiles.length} arquivos enviados e metadados salvos com sucesso.`,
      });

      setMetaSummaryFiles([]);
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
          canGoNext={metaSummaryFiles.length > 0}
        />
      </div>
      {step === 0 && (
        <SciSpaceUploadMetaResumo
          metaSummaryFiles={metaSummaryFiles}
          setMetaSummaryFiles={setMetaSummaryFiles}
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
          metaSummaryFile={metaSummaryFiles[0]}
          baseStudiesFile={baseStudiesFile}
          loading={isLoading}
          progress={progress}
          canSubmit={!!metaSummaryFiles[0] && !!baseStudiesFile}
          onPrev={() => setStep(1)}
          onSubmit={handleSubmit}
        />
      )}
      {isLoading && <SciSpaceProcessingPreviewMini progress={progress} />}
    </div>
  );
};

export default SciSpace2StepImport;
