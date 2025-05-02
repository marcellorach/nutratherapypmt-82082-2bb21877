
import React from 'react';
import { CardContent } from '@/components/ui/card';
import DropZoneArea from '../DropZoneArea';
import FilePreview from '../FilePreview';
import CsvPreview from '../CsvPreview';
import StudiesNotification from '../StudiesNotification';
import ErrorAlert from '../ErrorAlert';
import ProcessingProgress from '../ProcessingProgress';
import { FilePreviewData } from '../hooks/useSpreadsheetImport';

interface ImportContentProps {
  file: File | null;
  error: string | null;
  processing: boolean;
  progress: number;
  previewData: FilePreviewData[] | null;
  hasPdfFiles?: boolean;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
}

const ImportContent: React.FC<ImportContentProps> = ({
  file,
  error,
  processing,
  progress,
  previewData,
  hasPdfFiles = false,
  getRootProps,
  getInputProps,
  isDragActive
}) => {
  return (
    <CardContent>
      <DropZoneArea
        onDrop={() => {}}
        isDragActive={isDragActive}
        getInputProps={getInputProps}
        getRootProps={getRootProps}
      />

      {file && (
        <div className="mt-4">
          <FilePreview file={file} />
          
          <CsvPreview previewData={previewData} />
          
          <StudiesNotification hasPdfFiles={hasPdfFiles} />
          
          <ErrorAlert error={error} />
          
          <ProcessingProgress progress={progress} processing={processing} />
        </div>
      )}
    </CardContent>
  );
};

export default ImportContent;
