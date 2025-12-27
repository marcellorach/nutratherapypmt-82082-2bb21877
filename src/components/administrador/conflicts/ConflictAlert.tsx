import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useEvidenceConflicts } from '@/hooks/useEvidenceConflicts';
import { useTranslation } from 'react-i18next';

interface ConflictAlertProps {
  onNavigateToConflicts?: () => void;
}

export function ConflictAlert({ onNavigateToConflicts }: ConflictAlertProps) {
  const { t } = useTranslation();
  const { pendingCount, isPendingCountLoading } = useEvidenceConflicts({ status: 'pending' });

  if (isPendingCountLoading || pendingCount === 0) {
    return null;
  }

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-amber-700 dark:text-amber-300">
          {t('conflicts.alert.message', { count: pendingCount })}
        </span>
        {onNavigateToConflicts && (
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
            onClick={onNavigateToConflicts}
          >
            {t('conflicts.alert.review')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
