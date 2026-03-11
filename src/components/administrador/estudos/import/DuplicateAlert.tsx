import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { DuplicateCheckResult } from '@/utils/fileHashUtils';

interface DuplicateAlertProps {
  fileName: string;
  result: DuplicateCheckResult;
  onDismiss: () => void;
  onRemoveFile: () => void;
}

const DuplicateAlert: React.FC<DuplicateAlertProps> = ({
  fileName,
  result,
  onDismiss,
  onRemoveFile,
}) => {
  const { t } = useTranslation();

  if (result.type === 'none') return null;

  const isExact = result.type === 'exact';
  const study = result.existingStudy;

  return (
    <div
      className={`rounded-md p-3 text-sm border ${
        isExact
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
      }`}
    >
      <div className="flex items-start gap-2">
        {isExact ? (
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {isExact
              ? t('fileUpload.duplicate.exactMatch')
              : t('fileUpload.duplicate.similarName', {
                  similarity: Math.round((result.similarity || 0) * 100),
                })}
          </p>
          {study && (
            <p className="text-xs mt-0.5 opacity-80 truncate">
              {t('fileUpload.duplicate.existingStudy')}: {study.title} ({study.kanban_status})
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onRemoveFile}
          >
            {t('fileUpload.duplicate.remove')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDismiss}
            title={t('fileUpload.duplicate.keepAnyway')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateAlert;
