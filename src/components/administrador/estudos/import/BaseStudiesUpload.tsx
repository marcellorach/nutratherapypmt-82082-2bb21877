
import React from "react";
import { Button } from "@/components/ui/button";
import FilePreview from "./FilePreview";

interface BaseStudiesUploadProps {
  baseStudiesFile: File | null;
  setBaseStudiesFile: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_BASE_STUDY = '.csv,.xls,.bib,.json';

const BaseStudiesUpload: React.FC<BaseStudiesUploadProps> = ({
  baseStudiesFile,
  setBaseStudiesFile,
  disabled = false,
}) => {
  return (
    <div className="flex-1 border rounded-md bg-gray-50 p-4 flex flex-col items-start">
      <span className="font-semibold mb-2 text-sm">Base de Estudos</span>
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
            disabled={disabled}
          />
          <label htmlFor="baseFile">
            <Button variant="outline" asChild>
              <span>Selecionar Arquivo</span>
            </Button>
          </label>
          <span className="text-xs text-gray-400 mt-2">Formatos aceitos: .csv, .xls, .bib, .json</span>
        </>
      ) : (
        <FilePreview
          file={baseStudiesFile}
          onRemove={() => setBaseStudiesFile(null)}
          label="Base de Estudos"
        />
      )}
    </div>
  );
};

export default BaseStudiesUpload;
