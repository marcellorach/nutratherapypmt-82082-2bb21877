
import React from "react";
import FilePreview from "./FilePreview";
import SubmitImportButton from "./SubmitImportButton";
import { useTranslation } from 'react-i18next';

interface SciSpaceReviewAndSubmitProps {
  metaSummaryFile: File | null;
  baseStudiesFile: File | null;
  loading: boolean;
  progress: number;
  canSubmit: boolean;
  onPrev: () => void;
  onSubmit: () => void;
}

const SciSpaceReviewAndSubmit: React.FC<SciSpaceReviewAndSubmitProps> = ({
  metaSummaryFile,
  baseStudiesFile,
  loading,
  progress,
  canSubmit,
  onPrev,
  onSubmit
}) => {
  const { t } = useTranslation();
  
  return (
    <div>
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
          {t('studies.import.buttons.back')}
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
