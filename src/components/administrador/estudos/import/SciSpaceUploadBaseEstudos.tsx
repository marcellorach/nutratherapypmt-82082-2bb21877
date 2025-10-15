
import React from "react";
import BaseStudiesUpload from "./BaseStudiesUpload";

interface SciSpaceUploadBaseEstudosProps {
  baseStudiesFile: File | null;
  setBaseStudiesFile: (file: File | null) => void;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const SciSpaceUploadBaseEstudos: React.FC<SciSpaceUploadBaseEstudosProps> = ({
  baseStudiesFile,
  setBaseStudiesFile,
  disabled,
  onPrev,
  onNext
}) => {
  return (
    <div>
      <BaseStudiesUpload
        baseStudiesFile={baseStudiesFile}
        setBaseStudiesFile={setBaseStudiesFile}
        disabled={disabled}
      />
      <div className="mt-4 flex justify-between">
        <button
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded"
          onClick={onPrev}
          disabled={disabled}
        >
          Voltar
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!baseStudiesFile || disabled}
          onClick={onNext}
        >
          Próximo
        </button>
      </div>
    </div>
  );
};

export default SciSpaceUploadBaseEstudos;
