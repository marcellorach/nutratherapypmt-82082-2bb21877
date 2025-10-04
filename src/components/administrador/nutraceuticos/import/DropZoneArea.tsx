import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
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
          ? t('import.nutraceuticals.dropzone.drag')
          : t('import.nutraceuticals.dropzone.select')
        }
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {t('import.nutraceuticals.dropzone.formats')}
      </p>
    </div>
  );
};

export default DropZoneArea;
