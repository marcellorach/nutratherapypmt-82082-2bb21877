
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface MetaSummaryUploadProps {
  metaSummaryFiles: File[];
  setMetaSummaryFiles: (files: File[]) => void;
  disabled?: boolean;
}

const MetaSummaryUpload: React.FC<MetaSummaryUploadProps> = ({ 
  metaSummaryFiles, 
  setMetaSummaryFiles,
  disabled = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setMetaSummaryFiles([...metaSummaryFiles, ...acceptedFiles]);
  }, [metaSummaryFiles, setMetaSummaryFiles]);

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
    disabled
  });

  const removeFile = (index: number) => {
    setMetaSummaryFiles(metaSummaryFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Meta Sumário</h3>
      </div>
      
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
          Arraste e solte os arquivos de meta sumário aqui, ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formatos suportados: JSON, CSV, XLS, XLSX, DOC, DOCX, TXT, RTF, PDF
        </p>
      </div>

      {metaSummaryFiles.length > 0 && (
        <div className="border rounded-lg divide-y">
          {metaSummaryFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 p-1"
                disabled={disabled}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MetaSummaryUpload;
