
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface MetaSummaryUploadProps {
  metaSummaryFile: File | null;
  setMetaSummaryFile: (file: File | null) => void;
  disabled?: boolean;
}

const MetaSummaryUpload: React.FC<MetaSummaryUploadProps> = ({ 
  metaSummaryFile, 
  setMetaSummaryFile,
  disabled = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setMetaSummaryFile(acceptedFiles[0]);
    }
  }, [setMetaSummaryFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/rtf': ['.rtf'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled
  });

  const removeFile = () => {
    setMetaSummaryFile(null);
  };

  const getFileExtension = (filename: string) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Meta Sumário</h3>
      </div>
      
      {!metaSummaryFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Arraste e solte o arquivo de meta sumário aqui, ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos suportados: JSON, CSV, XLS, XLSX, DOC, DOCX, TXT, RTF, PDF
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{metaSummaryFile.name}</p>
              <p className="text-sm text-gray-500">
                {(metaSummaryFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={removeFile}
              className="text-red-500 hover:text-red-700"
              disabled={disabled}
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaSummaryUpload;
