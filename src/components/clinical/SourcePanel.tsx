import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, Database, Dog, Users, Globe, FlaskConical } from 'lucide-react';
import { useRoleView } from '@/contexts/RoleViewContext';
import type { ResolverOutput, SourceKind } from '@/services/multi-source-resolver';

const ICONS: Record<SourceKind, React.ComponentType<{ className?: string }>> = {
  kg: Database,
  petHistory: Dog,
  cohort: Users,
  internet: Globe,
  treatedDogs: FlaskConical,
};

interface Props {
  result: ResolverOutput;
}

const SourcePanel: React.FC<Props> = ({ result }) => {
  const { t } = useTranslation();
  const { viewId } = useRoleView();
  const [open, setOpen] = useState(false);

  const isTutor = viewId === 'tutor';
  const showModelTag = viewId === 'platform_architect';

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t('prioritization.multiSource.synthesis')}
          </h4>
          <p className="text-sm leading-relaxed">{result.synthesis}</p>
          {isTutor && (
            <p className="text-[11px] text-gray-500 mt-2 italic">
              {t('prioritization.multiSource.synthesisNote')}
            </p>
          )}
        </div>

        {!isTutor && (
          <>
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
                {open
                  ? t('prioritization.multiSource.hideSources')
                  : `${t('prioritization.multiSource.showSources')} (${result.sources.filter((s) => s.claim).length})`}
              </Button>
              {result.conflicts.length > 0 && (
                <Badge className="bg-orange-100 text-orange-900 border-orange-300" title={t('prioritization.multiSource.conflictTooltip') ?? ''}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {result.conflicts.length}× {t('prioritization.multiSource.conflict')}
                </Badge>
              )}
            </div>

            {open && (
              <div className="space-y-2 pt-1">
                {result.sources.map((s) => {
                  const Icon = ICONS[s.kind];
                  const inConflict = result.conflicts.some((c) => c.a === s.kind || c.b === s.kind);
                  return (
                    <div
                      key={s.kind}
                      className={`flex items-start gap-2 p-2 rounded border text-xs ${
                        inConflict ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 mt-0.5 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold">
                            {t(`prioritization.multiSource.sources.${s.kind}`)}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">
                            w={s.weight.toFixed(2)}
                          </Badge>
                          {s.confidence > 0 && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] h-4 px-1 font-mono ${
                                s.confidence >= 0.7
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : s.confidence >= 0.5
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                  : 'bg-gray-50 text-gray-600'
                              }`}
                            >
                              {Math.round(s.confidence * 100)}%
                            </Badge>
                          )}
                          {inConflict && (
                            <Badge className="bg-orange-100 text-orange-900 border-orange-300 text-[9px] h-4 px-1">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                              {t('prioritization.multiSource.conflict')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700 mt-1 break-words">
                          {s.notImplemented
                            ? <i className="text-gray-400">{t('prioritization.multiSource.notImplemented')}</i>
                            : s.claim ?? <i className="text-gray-400">—</i>}
                        </p>
                        {s.evidence && s.evidence.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {s.evidence.slice(0, 3).map((e, i) => (
                              <li key={i} className="text-[10px] text-gray-500 truncate">
                                {e.ref ? (
                                  <a href={e.ref} target="_blank" rel="noreferrer" className="hover:underline">
                                    • {e.label}
                                  </a>
                                ) : (
                                  <>• {e.label}</>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {s.error && <p className="text-[10px] text-red-600 mt-0.5">⚠ {s.error}</p>}
                      </div>
                    </div>
                  );
                })}
                {showModelTag && (
                  <p className="text-[10px] text-gray-400 italic pt-1">
                    KG: get_relations_graph_data · Internet: perplexity sonar
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SourcePanel;