import React from 'react';
import { FileText } from 'lucide-react';
import { StudyPdfFile } from '@/components/administrador/estudos/import/PdfFileItem';
import { useTranslation } from 'react-i18next';

interface StudyFilesListProps {
  studyFiles: StudyPdfFile[];
}

const StudyFilesList: React.FC<StudyFilesListProps> = ({ studyFiles }) => {
  const { t } = useTranslation();
  
  if (!studyFiles || studyFiles.length === 0) {
    return (
      <div className="px-6 pb-3">
        <div className="border-t pt-3">
          <p className="text-sm text-gray-500">{t('import.results.studyFiles.noFiles')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-3">
      <div className="border-t pt-3">
        <h4 className="font-medium mb-2">
          {t('import.results.studyFiles.title')} ({studyFiles.length})
        </h4>
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
