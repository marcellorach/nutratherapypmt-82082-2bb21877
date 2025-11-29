
import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Download, RotateCcw, Eye, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

interface NtaiProcessingLogProps {
  entries: string[];
  onClearLog?: () => void;
  onExportLog?: () => void;
  onRetryError?: (entry: string) => void;
}

const NtaiProcessingLog: React.FC<NtaiProcessingLogProps> = ({ entries, onClearLog, onExportLog, onRetryError }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  
  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [entries]);

  // Parse timestamp from log entry
  const parseTimestamp = (entry: string): Date | null => {
    const match = entry.match(/\[(\d{1,2}:\d{2}:\d{2}\s*[AP]M)\]/i);
    if (!match) return null;
    
    const timeStr = match[1].trim();
    const [time, period] = timeStr.split(/\s+/);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    const date = new Date();
    let hour24 = hours;
    if (period.toUpperCase() === 'PM' && hours !== 12) hour24 += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hour24 = 0;
    
    date.setHours(hour24, minutes, seconds, 0);
    return date;
  };

  // Calculate durations between consecutive entries
  const entriesWithDurations = entries.map((entry, index) => {
    if (index === 0) return { entry, duration: null };
    
    const currentTime = parseTimestamp(entry);
    const previousTime = parseTimestamp(entries[index - 1]);
    
    if (!currentTime || !previousTime) return { entry, duration: null };
    
    const durationMs = currentTime.getTime() - previousTime.getTime();
    const durationS = (durationMs / 1000).toFixed(1);
    
    return { entry, duration: `${durationS}s` };
  });

  // Filtrar apenas erros se necessário
  const filteredEntries = showOnlyErrors
    ? entriesWithDurations.filter(({ entry }) => entry.includes('[ERRO]') || entry.includes('❌'))
    : entriesWithDurations;
  
  return (
    <div className="border rounded-md mb-4" ref={scrollAreaRef}>
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">RAG Processing Log</h4>
          <span className="text-xs text-gray-500">{entries.length} events</span>
          <Button
            variant={showOnlyErrors ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className="h-6 px-2 text-xs"
          >
            {showOnlyErrors ? t('studies.ntai.showAll') : t('studies.ntai.showErrorsOnly')}
          </Button>
        </div>
        <div className="flex gap-1">
          {onExportLog && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onExportLog}
              className="h-7 px-2"
              title={t('studies.ntai.exportLog')}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {onClearLog && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  title={t('studies.ntai.clearLog')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('studies.ntai.clearLog')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('studies.ntai.clearLogConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearLog} className="bg-red-600 hover:bg-red-700">
                    {t('studies.ntai.clearLog')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[200px] p-3">
        {filteredEntries.length > 0 ? (
          <div className="space-y-1 font-mono text-xs">
            {filteredEntries.map(({ entry, duration }, index) => {
              const isError = entry.includes('[ERRO]') || entry.includes('❌');
              const hasActionable = isError && onRetryError;
              
              return (
                <div 
                  key={index} 
                  className={`px-2 py-1 rounded ${isError ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-400' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1">{entry}</span>
                    {duration && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                        {duration}
                      </span>
                    )}
                  </div>
                  
                  {hasActionable && (
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetryError?.(entry)}
                        className="h-6 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('studies.ntai.retry')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            {showOnlyErrors 
              ? t('studies.ntai.noErrors')
              : t('studies.ntai.noLogs')}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NtaiProcessingLog;
