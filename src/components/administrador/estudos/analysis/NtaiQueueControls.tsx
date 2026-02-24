
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, RefreshCcw, Trash2, Loader2 } from "lucide-react";

interface NtaiQueueControlsProps {
  queueLength: number;
  processingActive: boolean;
  hasCompletedItems: boolean;
  hasFailedItems: boolean;
  onClearCompleted: () => void;
  onRetryFailed: () => void;
  onClearFailed: () => void;
  onStartProcessing: () => void;
}

const NtaiQueueControls: React.FC<NtaiQueueControlsProps> = ({
  queueLength,
  processingActive,
  hasCompletedItems,
  hasFailedItems,
  onClearCompleted,
  onRetryFailed,
  onClearFailed,
  onStartProcessing
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/50 rounded-md border">
      <div className="text-sm font-medium">
        {queueLength > 0 ? (
          <>
            <span className="mr-2">{t('studies.queue.processingQueue')}</span>
            <span className="text-blue-600 font-semibold">
              {queueLength} {queueLength === 1 ? t('studies.queue.item') : t('studies.queue.items')}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">{t('studies.queue.noItems')}</span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {hasCompletedItems && (
          <Button variant="outline" size="sm" onClick={onClearCompleted}>
            <Trash2 className="w-4 h-4 mr-1" />
            {t('studies.queue.clearCompleted')}
          </Button>
        )}
        
        {hasFailedItems && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRetryFailed}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <RefreshCcw className="w-4 h-4 mr-1" />
                    {t('studies.queue.retryFailed')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('studies.queue.retryTooltip')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('studies.queue.retryWaitTip')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearFailed}
              className="text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t('studies.queue.clearFailed')}
            </Button>
          </>
        )}
        
        <Button 
          size="sm"
          onClick={onStartProcessing}
          disabled={processingActive || queueLength === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {processingActive ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              {t('studies.queue.processing')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              {t('studies.queue.startProcessing')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NtaiQueueControls;
