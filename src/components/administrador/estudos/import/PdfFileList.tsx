
import React from 'react';
import { StudyPdfFile } from './PdfFileItem';
import PdfFileItem from './PdfFileItem';

interface PdfFileListProps {
  files: StudyPdfFile[];
  onRemoveFile: (id: string) => void;
}

const PdfFileList: React.FC<PdfFileListProps> = ({ files, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-2">Arquivos selecionados ({files.length})</h3>
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
