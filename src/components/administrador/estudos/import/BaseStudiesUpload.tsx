
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface BaseStudiesUploadProps {
  baseStudiesFile: File | null;
  setBaseStudiesFile: (file: File | null) => void;
  disabled?: boolean;
}

const BaseStudiesUpload: React.FC<BaseStudiesUploadProps> = ({ 
  baseStudiesFile, 
  setBaseStudiesFile,
  disabled = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setBaseStudiesFile(acceptedFiles[0]);
    }
  }, [setBaseStudiesFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled
  });

  const removeFile = () => {
    setBaseStudiesFile(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Base de Estudos</h3>
      </div>
      
      {!baseStudiesFile ? (
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
            Arraste e solte o arquivo de base de estudos aqui, ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos suportados: JSON, CSV, XLS, XLSX
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{baseStudiesFile.name}</p>
              <p className="text-sm text-gray-500">
                {(baseStudiesFile.size / 1024).toFixed(2)} KB
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

export default BaseStudiesUpload;
