
import React from "react";
import { Button } from "@/components/ui/button";
import FilePreview from "./FilePreview";

interface MetaSummaryUploadProps {
  metaSummaryFile: File | null;
  setMetaSummaryFile: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_META_SUMMARY = '.pdf,.doc,.docx';

const MetaSummaryUpload: React.FC<MetaSummaryUploadProps> = ({
  metaSummaryFile,
  setMetaSummaryFile,
  disabled = false,
}) => {
  return (
    <div className="flex-1 border rounded-md bg-gray-50 p-4 flex flex-col items-start">
      <span className="font-semibold mb-2 text-sm">Meta Sumário</span>
      {!metaSummaryFile ? (
        <>
          <input
            type="file"
            accept={ACCEPTED_META_SUMMARY}
            id="metaFile"
            className="hidden"
            onChange={e => {
              if (e.target.files?.[0]) setMetaSummaryFile(e.target.files[0]);
            }}
            disabled={disabled}
          />
          <label htmlFor="metaFile">
            <Button variant="outline" asChild>
              <span>Selecionar Arquivo</span>
            </Button>
          </label>
          <span className="text-xs text-gray-400 mt-2">Formatos aceitos: .pdf, .doc, .docx</span>
        </>
      ) : (
        <FilePreview
          file={metaSummaryFile}
          onRemove={() => setMetaSummaryFile(null)}
          label="Meta Sumário"
        />
      )}
    </div>
  );
};

export default MetaSummaryUpload;
