
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from 'lucide-react';
import { StudyPdfFile } from './PdfFileItem';
import PdfFileList from './PdfFileList';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PdfUploadZoneProps {
  onFilesChange: (files: StudyPdfFile[]) => void;
  files: StudyPdfFile[];
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

const PdfUploadZone: React.FC<PdfUploadZoneProps> = ({ 
  onFilesChange, 
  files, 
  maxFiles = 10,
  acceptedFileTypes = ['application/pdf']
}) => {
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: StudyPdfFile[] = acceptedFiles.map(file => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'queued',
      file
    }));

    const availableSlots = Math.max(0, maxFiles - files.length);
    const filesToAdd = newFiles.slice(0, availableSlots);
    
    if (filesToAdd.length > 0) {
      onFilesChange([...files, ...filesToAdd]);
    }
  }, [files, maxFiles, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: Math.max(0, maxFiles - files.length),
    disabled: files.length >= maxFiles
  });

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  return (
    <div className="space-y-4">
      {files.length < maxFiles && (
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive && !isDragReject && "border-blue-400 bg-blue-50",
            isDragReject && "border-red-400 bg-red-50",
            files.length >= maxFiles && "opacity-50 cursor-not-allowed",
            !isDragActive && !isDragReject && "border-border hover:border-blue-300"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive
              ? isDragReject
                ? t('pdfUploadZone.filesNotSupported')
                : t('pdfUploadZone.dropHere')
              : t('pdfUploadZone.dragOrClick')
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('pdfUploadZone.supportedFormats')}
          </p>
          {maxFiles && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('pdfUploadZone.fileCount', { current: files.length, max: maxFiles })}
            </p>
          )}
        </div>
      )}

      {files.length > 0 && (
        <PdfFileList files={files} onRemoveFile={handleRemoveFile} />
      )}
    </div>
  );
};

export default PdfUploadZone;
