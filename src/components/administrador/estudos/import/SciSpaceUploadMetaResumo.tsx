
import React from "react";
import MetaSummaryUpload from "./MetaSummaryUpload";

interface SciSpaceUploadMetaResumoProps {
  metaSummaryFile: File | null;
  setMetaSummaryFile: (file: File | null) => void;
  disabled?: boolean;
  onNext: () => void;
}

const SciSpaceUploadMetaResumo: React.FC<SciSpaceUploadMetaResumoProps> = ({
  metaSummaryFile,
  setMetaSummaryFile,
  disabled,
  onNext
}) => {
  return (
    <div>
      <MetaSummaryUpload
        metaSummaryFile={metaSummaryFile}
        setMetaSummaryFile={setMetaSummaryFile}
        disabled={disabled}
      />
      <div className="mt-4 flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!metaSummaryFile || disabled}
          onClick={onNext}
        >
          Próximo
        </button>
      </div>
    </div>
  );
};

export default SciSpaceUploadMetaResumo;
