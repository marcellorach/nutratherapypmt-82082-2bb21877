import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { 
  Map, BookOpen, Beaker, Target, Share2, ClipboardCheck, 
  PawPrint, FlaskConical, Database, Network, Sparkles, 
  ChevronDown, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SystemGuideDetailPanel from './SystemGuideDetailPanel';

interface GuideSection {
  step: string;
  icon: React.ElementType;
  nameKey: string;
  descKey: string;
  status: 'live' | 'dev' | 'planned';
  group: 'ingestion' | 'ontology' | 'graph' | 'intelligence';
}

const sections: GuideSection[] = [
  { step: 'estudos', icon: BookOpen, nameKey: 'admin.sidebar.knowledgeBase.studies', descKey: 'systemGuide.sections.estudos', status: 'live', group: 'ingestion' },
  { step: 'processamento-ia', icon: Sparkles, nameKey: 'admin.sidebar.knowledgeBase.aiProcessing', descKey: 'systemGuide.sections.processamentoIa', status: 'live', group: 'ingestion' },
  { step: 'nutraceuticals-unified', icon: Beaker, nameKey: 'admin.sidebar.knowledgeBase.nutraceuticalsUnified', descKey: 'systemGuide.sections.nutraceuticals', status: 'live', group: 'ontology' },
  { step: 'veterinary-targets', icon: Target, nameKey: 'admin.sidebar.knowledgeBase.veterinaryTargets', descKey: 'systemGuide.sections.veterinaryTargets', status: 'live', group: 'ontology' },
  { step: 'breeds-management', icon: PawPrint, nameKey: 'admin.sidebar.knowledgeBase.breedsManagement', descKey: 'systemGuide.sections.breeds', status: 'live', group: 'ontology' },
  { step: 'lab-references', icon: FlaskConical, nameKey: 'admin.sidebar.knowledgeBase.labReferences', descKey: 'systemGuide.sections.labReferences', status: 'live', group: 'ontology' },
  { step: 'base-knowledge', icon: Database, nameKey: 'admin.sidebar.knowledgeBase.baseKnowledge', descKey: 'systemGuide.sections.baseKnowledge', status: 'live', group: 'ontology' },
  { step: 'knowledge-graph', icon: Share2, nameKey: 'admin.sidebar.knowledgeBase.knowledgeGraph', descKey: 'systemGuide.sections.knowledgeGraph', status: 'live', group: 'graph' },
  { step: 'relacoes', icon: Network, nameKey: 'admin.sidebar.knowledgeBase.relations', descKey: 'systemGuide.sections.relations', status: 'live', group: 'graph' },
  { step: 'ontology-audit', icon: ClipboardCheck, nameKey: 'admin.sidebar.knowledgeBase.ontologyAudit', descKey: 'systemGuide.sections.ontologyAudit', status: 'live', group: 'graph' },
  { step: 'ai-insights', icon: Sparkles, nameKey: 'admin.sidebar.knowledgeBase.aiInsights', descKey: 'systemGuide.sections.aiInsights', status: 'dev', group: 'intelligence' },
  { step: 'knowledge-base-settings', icon: Settings, nameKey: 'admin.sidebar.knowledgeBase.settings', descKey: 'systemGuide.sections.settings', status: 'live', group: 'intelligence' },
];

const groupConfig = {
  ingestion: { labelKey: 'systemGuide.groups.ingestion', color: 'border-l-blue-500', bgHover: 'hover:bg-blue-500/5', dotColor: 'bg-blue-500', lineColor: '#3b82f6' },
  ontology: { labelKey: 'systemGuide.groups.ontology', color: 'border-l-emerald-500', bgHover: 'hover:bg-emerald-500/5', dotColor: 'bg-emerald-500', lineColor: '#10b981' },
  graph: { labelKey: 'systemGuide.groups.graph', color: 'border-l-violet-500', bgHover: 'hover:bg-violet-500/5', dotColor: 'bg-violet-500', lineColor: '#8b5cf6' },
  intelligence: { labelKey: 'systemGuide.groups.intelligence', color: 'border-l-amber-500', bgHover: 'hover:bg-amber-500/5', dotColor: 'bg-amber-500', lineColor: '#f59e0b' },
};

const statusConfig = {
  live: { labelKey: 'systemGuide.status.live', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  dev: { labelKey: 'systemGuide.status.dev', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  planned: { labelKey: 'systemGuide.status.planned', className: 'bg-muted text-muted-foreground border-border' },
};

const groups: Array<'ingestion' | 'ontology' | 'graph' | 'intelligence'> = ['ingestion', 'ontology', 'graph', 'intelligence'];

const SystemGuideCard: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const activeTab = searchParams.get('tab');
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectorPositions, setConnectorPositions] = useState<{ x1: number; y1: number; x2: number; y2: number; fromColor: string; toColor: string }[]>([]);

  const handleNavigate = (step: string) => {
    setSearchParams({ tab: step });
  };

  const handleToggleExpand = (step: string) => {
    setExpandedSection(prev => prev === step ? null : step);
  };

  // Calculate connector positions between group blocks
  useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const positions: typeof connectorPositions = [];

      for (let i = 0; i < groups.length - 1; i++) {
        const fromEl = groupRefs.current[groups[i]];
        const toEl = groupRefs.current[groups[i + 1]];
        if (!fromEl || !toEl) continue;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        positions.push({
          x1: fromRect.left + fromRect.width / 2 - containerRect.left,
          y1: fromRect.bottom - containerRect.top,
          x2: toRect.left + toRect.width / 2 - containerRect.left,
          y2: toRect.top - containerRect.top,
          fromColor: groupConfig[groups[i]].lineColor,
          toColor: groupConfig[groups[i + 1]].lineColor,
        });
      }
      setConnectorPositions(positions);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    // Recalc when section expands/collapses
    const timeout = setTimeout(calculatePositions, 350);
    return () => {
      window.removeEventListener('resize', calculatePositions);
      clearTimeout(timeout);
    };
  }, [expandedSection]);

  return (
    <Card className="w-full border border-border/60 bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="h-5 w-5 text-primary" />
          {t('systemGuide.title')}
        </CardTitle>
        <CardDescription className="text-sm">
          {t('systemGuide.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 relative" ref={containerRef}>
        {/* SVG Connectors */}
        {connectorPositions.length > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {connectorPositions.map((pos, i) => (
                <linearGradient key={`grad-${i}`} id={`connector-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={pos.fromColor} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={pos.toColor} stopOpacity="0.4" />
                </linearGradient>
              ))}
              <marker id="flow-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" fillOpacity="0.3" />
              </marker>
            </defs>
            {connectorPositions.map((pos, i) => {
              const midY = (pos.y1 + pos.y2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${pos.x1} ${pos.y1} C ${pos.x1} ${midY}, ${pos.x2} ${midY}, ${pos.x2} ${pos.y2}`}
                  fill="none"
                  stroke={`url(#connector-grad-${i})`}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  markerEnd="url(#flow-arrow)"
                />
              );
            })}
          </svg>
        )}

        <div className="space-y-5 relative z-10">
          {groups.map(groupKey => {
            const group = groupConfig[groupKey];
            const groupSections = sections.filter(s => s.group === groupKey);

            return (
              <div
                key={groupKey}
                ref={(el) => { groupRefs.current[groupKey] = el; }}
                className="space-y-1.5"
              >
                {/* Group label with connector dot */}
                <div className="flex items-center gap-2 pl-1">
                  <div className={cn('h-2.5 w-2.5 rounded-full', group.dotColor, 'opacity-60')} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {t(group.labelKey)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {groupSections.map(section => {
                    const Icon = section.icon;
                    const status = statusConfig[section.status];
                    const isActive = activeTab === section.step;
                    const isExpanded = expandedSection === section.step;

                    return (
                      <div key={section.step}>
                        <button
                          onClick={() => handleToggleExpand(section.step)}
                          className={cn(
                            'group w-full flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-left transition-all duration-150',
                            'bg-card hover:shadow-sm cursor-pointer border border-border/40',
                            group.color,
                            group.bgHover,
                            isExpanded && 'shadow-sm ring-1 ring-primary/20 bg-primary/[0.02]'
                          )}
                        >
                          {/* Icon with working light */}
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <Icon className="h-4 w-4" />
                            {isActive && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-card" />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">
                                {t(section.nameKey)}
                              </span>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0', status.className)}>
                                {t(status.labelKey)}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                              {t(section.descKey)}
                            </p>
                          </div>

                          <ChevronDown className={cn(
                            'h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-all shrink-0',
                            isExpanded && 'rotate-180 text-primary'
                          )} />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <SystemGuideDetailPanel
                              sectionStep={section.step}
                              onNavigate={handleNavigate}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/50 text-center pt-4">
          {t('systemGuide.footer')}
        </p>
      </CardContent>
    </Card>
  );
};

export default SystemGuideCard;
