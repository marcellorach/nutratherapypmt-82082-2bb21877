import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Search, CheckCircle2, AlertTriangle, XCircle, Info, Loader2, Database, Microscope, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GapLogLevel = 'info' | 'success' | 'warn' | 'error';

export interface GapLogEntry {
  id: string;
  timestamp: number;
  level: GapLogLevel;
  message: string;
}

interface Props {
  entries: GapLogEntry[];
  isSearching: boolean;
  onClear: () => void;
}

const LEVEL_ICON: Record<GapLogLevel, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
};

const LEVEL_COLOR: Record<GapLogLevel, string> = {
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

const EvidenceGapLogPanel: React.FC<Props> = ({ entries, isSearching, onClear }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (!isSearching && entries.length === 0) return null;

  const handleExport = () => {
    const text = entries
      .map(e => `[${formatTime(e.timestamp)}] [${e.level.toUpperCase()}] ${e.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-gap-fill-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-amber-300/40 bg-muted/40 mt-3">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Search className={cn('h-3.5 w-3.5 flex-shrink-0', isSearching ? 'text-amber-600 animate-pulse' : 'text-muted-foreground')} />
            <span className="text-xs font-semibold">{t('evidenceGap.log.title')}</span>
            <span className="text-[10px] text-muted-foreground">
              {t('evidenceGap.log.eventCount', { count: entries.length })}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onClear} disabled={entries.length === 0} className="h-6 px-2 text-[10px]">
              <Trash2 className="h-3 w-3 mr-1" />
              {t('evidenceGap.log.clear')}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} disabled={entries.length === 0} className="h-6 px-2 text-[10px]">
              <Download className="h-3 w-3 mr-1" />
              {t('evidenceGap.log.export')}
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="font-mono text-[11px] leading-relaxed bg-background/60 rounded border border-border/60 p-2 max-h-56 overflow-y-auto"
        >
          {entries.length === 0 ? (
            <div className="text-muted-foreground italic flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('evidenceGap.log.waiting')}
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

export default EvidenceGapLogPanel;