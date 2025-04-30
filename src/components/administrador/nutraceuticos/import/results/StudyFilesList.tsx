
import React from 'react';
import { FileText } from 'lucide-react';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';

interface StudyFilesListProps {
  studyFiles: StudyPdfFile[];
}

const StudyFilesList: React.FC<StudyFilesListProps> = ({ studyFiles }) => {
  if (!studyFiles || studyFiles.length === 0) return null;

  return (
    <div className="px-6 pb-3">
      <div className="border-t pt-3">
        <h4 className="font-medium mb-2">Arquivos de Estudos Científicos ({studyFiles.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {studyFiles.map((file) => (
            <div key={file.id} className="border rounded p-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyFilesList;
