
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { PlusCircle } from 'lucide-react';
import { StudyPdfFile } from './types';

interface PdfUploadZoneProps {
  onFilesAdded: (files: StudyPdfFile[]) => void;
  disabled: boolean;
}

const PdfUploadZone: React.FC<PdfUploadZoneProps> = ({ onFilesAdded, disabled }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    disabled,
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadProgress: 0, // Inicializado explicitamente como número
          processingState: 'waiting' as const,
          studyId: `pdf-${Date.now()}-${file.name}`,
          nutraceuticalAssociation: '',
          conditionAssociation: ''
        })
      ) as StudyPdfFile[];
      
      onFilesAdded(newFiles);
    }
  });
  
  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
        disabled ? 'bg-gray-100 pointer-events-none' : 'hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <PlusCircle className="h-10 w-10 mx-auto text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        Arraste e solte arquivos PDF de estudos científicos, ou clique para selecionar
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Você pode associar cada estudo a um nutracêutico e condição específicos
      </p>
    </div>
  );
};

export default PdfUploadZone;
