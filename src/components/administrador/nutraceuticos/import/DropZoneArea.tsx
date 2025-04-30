
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface DropZoneAreaProps {
  onDrop: (files: File[]) => void;
  isDragActive: boolean;
  getInputProps: () => any;
  getRootProps: () => any;
}

const DropZoneArea: React.FC<DropZoneAreaProps> = ({
  onDrop,
  isDragActive,
  getInputProps,
  getRootProps
}) => {
  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 mx-auto text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? "Solte o arquivo aqui..."
          : "Arraste e solte uma planilha Excel ou CSV, ou clique para selecionar"
        }
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Formatos suportados: .xlsx, .xls, .csv
      </p>
    </div>
  );
};

export default DropZoneArea;
