
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';

// Hooks
import { useSpreadsheetImport } from './hooks/useSpreadsheetImport';

// Componentes refatorados
import ImportCardHeader from './components/ImportCardHeader';
import ImportCardFooter from './components/ImportCardFooter';
import ImportContent from './components/ImportContent';

interface SpreadsheetImportProps {
  onImportComplete: (result: any) => void;
  hasPdfFiles?: boolean;
}

const SpreadsheetImport: React.FC<SpreadsheetImportProps> = ({
  onImportComplete,
  hasPdfFiles = false
}) => {
  const {
    file,
    processing,
    progress,
    error,
    previewData,
    onDrop,
    processFile,
    clearFileSelection
  } = useSpreadsheetImport(onImportComplete);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <Card className="w-full">
      <ImportCardHeader />
      
      <ImportContent
        file={file}
        error={error}
        processing={processing}
        progress={progress}
        previewData={previewData}
        hasPdfFiles={hasPdfFiles}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
      />
      
      <ImportCardFooter
        file={file}
        processing={processing}
        onCancel={clearFileSelection}
        onProcess={processFile}
      />
    </Card>
  );
};

export default SpreadsheetImport;
