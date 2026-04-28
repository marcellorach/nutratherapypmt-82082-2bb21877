import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Activity, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClinicalLogLevel = 'info' | 'success' | 'warn' | 'error';

export interface ClinicalLogEntry {
  id: string;
  timestamp: number; // ms epoch
  level: ClinicalLogLevel;
  message: string;
  stage?: string;
}

interface Props {
  entries: ClinicalLogEntry[];
  isAnalyzing: boolean;
  currentStageLabel?: string | null;
  onClear: () => void;
}

const LEVEL_ICON: Record<ClinicalLogLevel, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
};

const LEVEL_COLOR: Record<ClinicalLogLevel, string> = {
  info: 'text-blue-600',
  success: 'text-emerald-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

const ClinicalPipelineLogPanel: React.FC<Props> = ({ entries, isAnalyzing, currentStageLabel, onClear }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (!isAnalyzing && entries.length === 0) return null;

  const handleExport = () => {
    const text = entries
      .map(e => `[${formatTime(e.timestamp)}] [${e.level.toUpperCase()}]${e.stage ? ` (${e.stage})` : ''} ${e.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vetgraphrag-pipeline-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-primary/20 bg-muted/40">
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className={cn('h-3.5 w-3.5 flex-shrink-0', isAnalyzing ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
            <span className="text-xs font-semibold">{t('petProfile.pipeline.log.title', 'Console do Pipeline Clínico')}</span>
            {isAnalyzing && currentStageLabel && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-primary/40 text-primary truncate">
                {currentStageLabel}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {t('petProfile.pipeline.log.eventCount', '{{count}} eventos', { count: entries.length })}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onClear} disabled={entries.length === 0} className="h-6 px-2 text-[10px]">
              <Trash2 className="h-3 w-3 mr-1" />
              {t('petProfile.pipeline.log.clear', 'Limpar')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} disabled={entries.length === 0} className="h-6 px-2 text-[10px]">
              <Download className="h-3 w-3 mr-1" />
              {t('petProfile.pipeline.log.export', 'Exportar')}
            </Button>
          </div>
        </div>

        {/* Log lines */}
        <div
          ref={scrollRef}
          className="font-mono text-[11px] leading-relaxed bg-background/60 rounded border border-border/60 p-2 max-h-48 overflow-y-auto"
        >
          {entries.length === 0 ? (
            <div className="text-muted-foreground italic">
              {t('petProfile.pipeline.log.waiting', 'Aguardando eventos do pipeline...')}
            </div>
          ) : (
            entries.map(entry => {
              const Icon = LEVEL_ICON[entry.level];
              return (
                <div key={entry.id} className="flex items-start gap-2 py-0.5">
                  <span className="text-muted-foreground shrink-0">{formatTime(entry.timestamp)}</span>
                  <Icon className={cn('h-3 w-3 mt-0.5 shrink-0', LEVEL_COLOR[entry.level])} />
                  <span className="break-words">{entry.message}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicalPipelineLogPanel;