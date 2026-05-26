import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ExternalLink } from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  summary: string;
  signals: string[] | null;
  originality_status?: string;
  originality_checked_at?: string | null;
  originality_evidence?: any;
}

interface Props {
  insight: Insight | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const statusMap: Record<string, { color: string; label: string }> = {
  novel:   { color: 'bg-emerald-100 border-emerald-300 text-emerald-800', label: '✦ inédito' },
  partial: { color: 'bg-amber-100 border-amber-300 text-amber-800',       label: '~ parcial' },
  known:   { color: 'bg-gray-100 border-gray-300 text-gray-700',          label: '⌖ já publicado' },
};

const OriginalityDialog: React.FC<Props> = ({ insight, open, onOpenChange }) => {
  if (!insight) return null;
  const ev = insight.originality_evidence ?? {};
  const status = insight.originality_status ?? 'unknown';
  const v = statusMap[status];
  const citations: string[] = ev.citations ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <BookOpen className="h-4 w-4 mt-1 text-purple-700 shrink-0" />
            <span>Originalidade na literatura — {insight.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {v && <Badge variant="outline" className={`text-xs ${v.color}`}>{v.label}</Badge>}
            {ev.provider && <Badge variant="outline" className="text-[10px] font-mono">via {ev.provider}</Badge>}
            {insight.originality_checked_at && (
              <span className="text-[10px] text-muted-foreground">
                verificado em {new Date(insight.originality_checked_at).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          <Card className="bg-purple-50/40 border-purple-200">
            <CardContent className="p-3">
              <h5 className="text-xs font-semibold mb-2">Hipótese avaliada</h5>
              <p className="text-sm leading-relaxed">{insight.summary}</p>
              {(insight.signals?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {insight.signals!.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-white">{s}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <h5 className="text-xs font-semibold mb-2">Resposta da busca científica</h5>
              {ev.answer ? (
                <p className="text-[12px] whitespace-pre-wrap leading-relaxed">{ev.answer}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">Nenhuma busca de originalidade foi executada ainda.</p>
              )}
            </CardContent>
          </Card>

          {citations.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <h5 className="text-xs font-semibold mb-2">Citações ({citations.length})</h5>
                <ul className="space-y-1">
                  {citations.map((c, i) => (
                    <li key={i} className="text-[11px]">
                      <a href={c} target="_blank" rel="noopener noreferrer"
                         className="text-purple-700 hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> [{i + 1}] {c}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <p className="text-[10px] text-muted-foreground italic">
            Esta busca usa Perplexity (modo sonar, literatura veterinária canina) com fallback Gemini 3.5 Flash.
            Resultados são salvos em <code>cohort_insights.originality_evidence</code>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OriginalityDialog;