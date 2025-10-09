
import React from "react";
import MetaSummaryUpload from "./MetaSummaryUpload";
import { useTranslation } from 'react-i18next';

interface SciSpaceUploadMetaResumoProps {
  metaSummaryFiles: File[];
  setMetaSummaryFiles: (files: File[]) => void;
  disabled?: boolean;
  onNext: () => void;
}

const SciSpaceUploadMetaResumo: React.FC<SciSpaceUploadMetaResumoProps> = ({
  metaSummaryFiles,
  setMetaSummaryFiles,
  disabled,
  onNext
}) => {
  const { t } = useTranslation();
  
  return (
    <div>
      <MetaSummaryUpload
        metaSummaryFiles={metaSummaryFiles}
        setMetaSummaryFiles={setMetaSummaryFiles}
        disabled={disabled}
      />
      <div className="mt-4 flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={onNext}
          disabled={metaSummaryFiles.length === 0 || disabled}
        >
          {t('studies.import.buttons.next')}
        </button>
      </div>
    </div>
  );
};

export default SciSpaceUploadMetaResumo;
