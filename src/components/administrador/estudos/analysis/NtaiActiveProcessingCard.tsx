import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  FileText, 
  Trash2, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Zap 
} from "lucide-react";
import { ProcessingItem } from '@/types/ntai';
import { useTranslation } from 'react-i18next';
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

interface NtaiActiveProcessingCardProps {
  item: ProcessingItem;
  logEntries: string[];
  calculatedProgress: number;
  onClearLog?: () => void;
  onExportLog?: () => void;
}

const NtaiActiveProcessingCard: React.FC<NtaiActiveProcessingCardProps> = ({
  item,
  logEntries,
  calculatedProgress,
  onClearLog,
  onExportLog,
}) => {
  const { t } = useTranslation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isLogExpanded, setIsLogExpanded] = useState(true);
  const [displayedEntries, setDisplayedEntries] = useState<string[]>([]);
  const pendingEntriesRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // Sistema de delay para entradas que chegam muito rápido
  useEffect(() => {
    const newEntries = logEntries.slice(displayedEntries.length);
    if (newEntries.length === 0) return;

    pendingEntriesRef.current = [...pendingEntriesRef.current, ...newEntries];

    const processNextEntry = async () => {
      if (isProcessingRef.current || pendingEntriesRef.current.length === 0) return;
      
      isProcessingRef.current = true;
      const entry = pendingEntriesRef.current.shift()!;
      
      // Adicionar entrada com efeito fade-in
      setDisplayedEntries(prev => [...prev, entry]);
      
      // Delay mínimo de 150ms entre entradas para visualização
      await new Promise(resolve => setTimeout(resolve, 150));
      
      isProcessingRef.current = false;
      
      // Processar próxima entrada se houver
      if (pendingEntriesRef.current.length > 0) {
        processNextEntry();
      }
    };

    processNextEntry();
  }, [logEntries, displayedEntries.length]);

  // Reset displayed entries when log is cleared
  useEffect(() => {
    if (logEntries.length === 0) {
      setDisplayedEntries([]);
      pendingEntriesRef.current = [];
    }
  }, [logEntries.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [displayedEntries]);

  // Calcular duração entre entradas
  const parseTimestamp = (entry: string): Date | null => {
    const match = entry.match(/\[(\d{1,2}:\d{2}:\d{2}\s*[AP]M)\]/i);
    if (!match) return null;
    
    const timeStr = match[1].trim();
    const [time, period] = timeStr.split(/\s+/);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    
    const date = new Date();
    let hour24 = hours;
    if (period?.toUpperCase() === 'PM' && hours !== 12) hour24 += 12;
    if (period?.toUpperCase() === 'AM' && hours === 12) hour24 = 0;
    
    date.setHours(hour24, minutes, seconds, 0);
    return date;
  };

  const entriesWithDurations = displayedEntries.map((entry, index) => {
    if (index === 0) return { entry, duration: null };
    
    const currentTime = parseTimestamp(entry);
    const previousTime = parseTimestamp(displayedEntries[index - 1]);
    
    if (!currentTime || !previousTime) return { entry, duration: null };
    
    const durationMs = currentTime.getTime() - previousTime.getTime();
    const durationS = (durationMs / 1000).toFixed(1);
    
    return { entry, duration: `${durationS}s` };
  });

  const getStatusText = () => {
    switch (item.stage) {
      case 'extracting':
        return t('studies.ntai.statusExtracting', 'Extraindo dados do PDF...');
      case 'analyzing':
        return t('studies.ntai.statusAnalyzing', 'Analisando com IA...');
      case 'standardizing':
        return t('studies.ntai.statusStandardizing', 'Padronizando dados...');
      default:
        return t('studies.ntai.statusProcessing', 'Processando...');
    }
  };

  return (
    <Card className="border-2 border-blue-400 shadow-lg bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/30 dark:to-background animate-pulse-subtle overflow-hidden">
      {/* Log Section - Collapsible */}
      <div className="border-b border-blue-200 dark:border-blue-800" ref={scrollAreaRef}>
        <div className="bg-blue-100/50 dark:bg-blue-900/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('studies.ntai.liveLog', 'Log em Tempo Real')}
            </h4>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-200/50 dark:bg-blue-800/50 px-2 py-0.5 rounded-full">
              {displayedEntries.length} {t('studies.ntai.events', 'eventos')}
            </span>
          </div>
          <div className="flex gap-1">
            {onExportLog && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onExportLog}
                className="h-7 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-200/50"
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
                    className="h-7 px-2 hover:bg-red-100 hover:text-red-600"
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsLogExpanded(!isLogExpanded)}
              className="h-7 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-200/50"
            >
              {isLogExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        
        {isLogExpanded && (
          <ScrollArea className="h-[180px] bg-slate-900/95 dark:bg-black">
            <div className="p-3 font-mono text-xs space-y-1">
              {entriesWithDurations.length > 0 ? (
                entriesWithDurations.map(({ entry, duration }, index) => {
                  const isError = entry.includes('[ERRO]') || entry.includes('❌');
                  const isSuccess = entry.includes('✅') || entry.includes('[SUCESSO]');
                  const isWarning = entry.includes('⚠️') || entry.includes('[ALERTA]');
                  
                  return (
                    <div 
                      key={index} 
                      className={`
                        flex items-center justify-between gap-2 py-0.5 px-2 rounded
                        animate-fade-in
                        ${isError ? 'bg-red-500/20 text-red-300' : ''}
                        ${isSuccess ? 'text-green-400' : ''}
                        ${isWarning ? 'text-yellow-400' : ''}
                        ${!isError && !isSuccess && !isWarning ? 'text-blue-200' : ''}
                      `}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="flex-1 break-all">{entry}</span>
                      {duration && (
                        <span className="text-cyan-400 font-medium whitespace-nowrap text-[10px]">
                          +{duration}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  {t('studies.ntai.waitingLogs', 'Aguardando início do processamento...')}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Study Card Section - Full Width */}
      <CardHeader className="py-4 px-6 bg-gradient-to-r from-blue-100/50 to-transparent dark:from-blue-900/20">
        <CardTitle className="flex items-center gap-3">
          <div className="relative">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <div className="absolute inset-0 h-6 w-6 bg-blue-400/30 rounded-full animate-ping" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-foreground truncate">
              {item.title}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-normal">
              {getStatusText()}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 pt-2 space-y-4">
        {/* Progress Bar with Gamification */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {t('studies.ntai.progressLabel', 'Progresso da extração')}
            </span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {calculatedProgress}%
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              value={calculatedProgress} 
              className="h-3 bg-blue-100 dark:bg-blue-900/50"
            />
            {/* Glow effect on progress */}
            <div 
              className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-50 blur-sm transition-all duration-500"
              style={{ width: `${calculatedProgress}%` }}
            />
          </div>
          
          {/* Stage indicator dots */}
          <div className="flex justify-between px-1">
            {['Upload', 'Extração', 'Análise', 'Salvamento'].map((stage, idx) => {
              const stageProgress = [0, 30, 60, 90];
              const isActive = calculatedProgress >= stageProgress[idx];
              const isCurrent = calculatedProgress >= stageProgress[idx] && 
                               (idx === 3 || calculatedProgress < stageProgress[idx + 1]);
              
              return (
                <div 
                  key={stage} 
                  className={`
                    text-[10px] flex flex-col items-center gap-1
                    ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}
                  `}
                >
                  <div 
                    className={`
                      w-2 h-2 rounded-full transition-all duration-300
                      ${isCurrent ? 'bg-blue-500 ring-2 ring-blue-300 ring-offset-1' : ''}
                      ${isActive && !isCurrent ? 'bg-green-500' : ''}
                      ${!isActive ? 'bg-muted' : ''}
                    `}
                  />
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            <span>{t('studies.ntai.source', 'Fonte')}: {item.sourceFile || t('studies.ntai.manualImport', 'Importação Manual')}</span>
          </div>
          <div className="text-right">
            {t('studies.ntai.importedAgo', 'Importado: há menos de um dia')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NtaiActiveProcessingCard;
