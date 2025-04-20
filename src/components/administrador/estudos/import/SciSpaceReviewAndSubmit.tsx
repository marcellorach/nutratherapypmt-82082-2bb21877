
import React from "react";
import FilePreview from "./FilePreview";
import SubmitImportButton from "./SubmitImportButton";
import ConsensoForm from "./ConsensoForm";

interface SciSpaceReviewAndSubmitProps {
  metaSummaryFile: File | null;
  baseStudiesFile: File | null;
  loading: boolean;
  progress: number;
  canSubmit: boolean;
  onPrev: () => void;
  onSubmit: () => void;
  consensoName: string;
  setConsensoName: (value: string) => void;
  comentarios: string;
  setComentarios: (value: string) => void;
}

const SciSpaceReviewAndSubmit: React.FC<SciSpaceReviewAndSubmitProps> = ({
  metaSummaryFile,
  baseStudiesFile,
  loading,
  progress,
  canSubmit,
  onPrev,
  onSubmit,
  consensoName,
  setConsensoName,
  comentarios,
  setComentarios
}) => {
  return (
    <div>
      <ConsensoForm 
        consensoName={consensoName}
        setConsensoName={setConsensoName}
        comentarios={comentarios}
        setComentarios={setComentarios}
        disabled={loading}
      />
      
      <div className="mb-6 grid md:grid-cols-2 gap-6">
        <FilePreview
          file={metaSummaryFile}
          label="Meta Sumário"
          onRemove={undefined}
        />
        <FilePreview
          file={baseStudiesFile}
          label="Base Estudos"
          onRemove={undefined}
        />
      </div>
      <div className="flex justify-between">
        <button
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded"
          onClick={onPrev}
          disabled={loading}
        >
          Voltar
        </button>
        <SubmitImportButton
          onClick={onSubmit}
          disabled={!canSubmit || loading}
          loading={loading}
          progress={progress}
        />
      </div>
    </div>
  );
};

export default SciSpaceReviewAndSubmit;
