
import React from 'react';
import { StudyPdfFile } from './PdfFileItem';
import PdfFileItem from './PdfFileItem';
import { useTranslation } from 'react-i18next';

interface PdfFileListProps {
  files: StudyPdfFile[];
  onRemoveFile: (id: string) => void;
}

const PdfFileList: React.FC<PdfFileListProps> = ({ files, onRemoveFile }) => {
  const { t } = useTranslation();

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-2">{t('pdfFileList.selectedFiles', { count: files.length })}</h3>
      <div className="space-y-2">
        {files.map(file => (
          <PdfFileItem 
            key={file.id} 
            file={file} 
            onRemove={onRemoveFile} 
          />
        ))}
      </div>
    </div>
  );
};

export default PdfFileList;
