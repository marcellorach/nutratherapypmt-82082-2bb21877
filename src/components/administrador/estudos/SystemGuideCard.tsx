import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Map, BookOpen, Beaker, Target, Share2, ClipboardCheck, 
  PawPrint, FlaskConical, Database, Network, Sparkles, 
  ChevronRight, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideSection {
  step: string;
  icon: React.ElementType;
  nameKey: string;
  descKey: string;
  status: 'live' | 'dev' | 'planned';
  group: 'ingestion' | 'ontology' | 'graph' | 'intelligence';
}

const sections: GuideSection[] = [
  // Ingestão
  { step: 'estudos', icon: BookOpen, nameKey: 'admin.sidebar.knowledgeBase.studies', descKey: 'systemGuide.sections.estudos', status: 'live', group: 'ingestion' },
  { step: 'processamento-ia', icon: Sparkles, nameKey: 'admin.sidebar.knowledgeBase.aiProcessing', descKey: 'systemGuide.sections.processamentoIa', status: 'live', group: 'ingestion' },
  // Ontologia
  { step: 'nutraceuticals-unified', icon: Beaker, nameKey: 'admin.sidebar.knowledgeBase.nutraceuticalsUnified', descKey: 'systemGuide.sections.nutraceuticals', status: 'live', group: 'ontology' },
  { step: 'veterinary-targets', icon: Target, nameKey: 'admin.sidebar.knowledgeBase.veterinaryTargets', descKey: 'systemGuide.sections.veterinaryTargets', status: 'live', group: 'ontology' },
  { step: 'breeds-management', icon: PawPrint, nameKey: 'admin.sidebar.knowledgeBase.breedsManagement', descKey: 'systemGuide.sections.breeds', status: 'live', group: 'ontology' },
  { step: 'lab-references', icon: FlaskConical, nameKey: 'admin.sidebar.knowledgeBase.labReferences', descKey: 'systemGuide.sections.labReferences', status: 'live', group: 'ontology' },
  { step: 'base-knowledge', icon: Database, nameKey: 'admin.sidebar.knowledgeBase.baseKnowledge', descKey: 'systemGuide.sections.baseKnowledge', status: 'live', group: 'ontology' },
  // Grafo & Relações
  { step: 'knowledge-graph', icon: Share2, nameKey: 'admin.sidebar.knowledgeBase.knowledgeGraph', descKey: 'systemGuide.sections.knowledgeGraph', status: 'live', group: 'graph' },
  { step: 'relacoes', icon: Network, nameKey: 'admin.sidebar.knowledgeBase.relations', descKey: 'systemGuide.sections.relations', status: 'live', group: 'graph' },
  { step: 'ontology-audit', icon: ClipboardCheck, nameKey: 'admin.sidebar.knowledgeBase.ontologyAudit', descKey: 'systemGuide.sections.ontologyAudit', status: 'live', group: 'graph' },
  // Inteligência
  { step: 'ai-insights', icon: Sparkles, nameKey: 'admin.sidebar.knowledgeBase.aiInsights', descKey: 'systemGuide.sections.aiInsights', status: 'dev', group: 'intelligence' },
  // Configuração
  { step: 'knowledge-base-settings', icon: Settings, nameKey: 'admin.sidebar.knowledgeBase.settings', descKey: 'systemGuide.sections.settings', status: 'live', group: 'intelligence' },
];

const groupConfig = {
  ingestion: { labelKey: 'systemGuide.groups.ingestion', color: 'border-l-blue-500', bgHover: 'hover:bg-blue-500/5' },
  ontology: { labelKey: 'systemGuide.groups.ontology', color: 'border-l-emerald-500', bgHover: 'hover:bg-emerald-500/5' },
  graph: { labelKey: 'systemGuide.groups.graph', color: 'border-l-violet-500', bgHover: 'hover:bg-violet-500/5' },
  intelligence: { labelKey: 'systemGuide.groups.intelligence', color: 'border-l-amber-500', bgHover: 'hover:bg-amber-500/5' },
};

const statusConfig = {
  live: { labelKey: 'systemGuide.status.live', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  dev: { labelKey: 'systemGuide.status.dev', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  planned: { labelKey: 'systemGuide.status.planned', className: 'bg-muted text-muted-foreground border-border' },
};

const SystemGuideCard: React.FC = () => {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();

  const handleNavigate = (step: string) => {
    setSearchParams({ tab: step });
  };

  const groups: Array<'ingestion' | 'ontology' | 'graph' | 'intelligence'> = ['ingestion', 'ontology', 'graph', 'intelligence'];

  return (
    <Card className="w-full border border-border/60 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="h-5 w-5 text-primary" />
          {t('systemGuide.title')}
        </CardTitle>
        <CardDescription className="text-sm">
          {t('systemGuide.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {groups.map(groupKey => {
          const group = groupConfig[groupKey];
          const groupSections = sections.filter(s => s.group === groupKey);
          
          return (
            <div key={groupKey} className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 pl-1">
                {t(group.labelKey)}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {groupSections.map(section => {
                  const Icon = section.icon;
                  const status = statusConfig[section.status];
                  
                  return (
                    <button
                      key={section.step}
                      onClick={() => handleNavigate(section.step)}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-left transition-all duration-150',
                        'bg-card hover:shadow-sm cursor-pointer border border-border/40',
                        group.color,
                        group.bgHover
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        <Icon className="h-4 w-4" />
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
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground/50 text-center pt-1">
          {t('systemGuide.footer')}
        </p>
      </CardContent>
    </Card>
  );
};

export default SystemGuideCard;
