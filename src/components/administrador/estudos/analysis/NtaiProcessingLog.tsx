
import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
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
}

const NtaiProcessingLog: React.FC<NtaiProcessingLogProps> = ({ entries, onClearLog, onExportLog }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [entries]);
  
  return (
    <div className="border rounded-md mb-4" ref={scrollAreaRef}>
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Log de Processamento RAG</h4>
          <span className="text-xs text-gray-500">{entries.length} eventos</span>
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
        {entries.length > 0 ? (
          <div className="space-y-1 font-mono text-xs">
            {entries.map((entry, index) => {
              const isError = entry.includes('[ERRO]');
              
              return (
                <div 
                  key={index} 
                  className={`px-2 py-1 rounded ${isError ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-400' : ''}`}
                >
                  {entry}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Log vazio. Inicie um processamento para ver registros.
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NtaiProcessingLog;
