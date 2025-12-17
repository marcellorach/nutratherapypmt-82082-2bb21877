import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, FileText, BookOpen, ChevronDown, ChevronRight, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface StudyContribution {
  id: string;
  title: string;
  tripletCount: number;
  lastSyncedAt: string | null;
  status: 'synced' | 'partial' | 'pending';
}

interface DataSourceStats {
  ontologyEntities: number;
  tripletCount: number;
  knownRelations: number;
  studyContributions: StudyContribution[];
}

interface KnowledgeGraphDataSourcesProps {
  stats: DataSourceStats;
  onStudyClick?: (studyId: string) => void;
  loading?: boolean;
}

export const KnowledgeGraphDataSources: React.FC<KnowledgeGraphDataSourcesProps> = ({
  stats,
  onStudyClick,
  loading = false
}) => {
  const { t } = useTranslation();
  const [studiesOpen, setStudiesOpen] = React.useState(false);

  const totalFromStudies = stats.studyContributions.reduce((sum, s) => sum + s.tripletCount, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-pulse text-muted-foreground">Loading data sources...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          {t('knowledgeGraph.dataSources.title', 'Data Sources')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{stats.ontologyEntities}</div>
            <div className="text-xs text-muted-foreground">
              {t('knowledgeGraph.dataSources.ontology', 'Ontology')}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">{stats.tripletCount}</div>
            <div className="text-xs text-muted-foreground">
              {t('knowledgeGraph.dataSources.triplets', 'From Studies')}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-600">{stats.knownRelations}</div>
            <div className="text-xs text-muted-foreground">
              {t('knowledgeGraph.dataSources.known', 'Known Relations')}
            </div>
          </div>
        </div>

        {/* Source Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
            Ontology Base
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            Study Extraction
          </Badge>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
            Known Relationship
          </Badge>
        </div>

        {/* Contributing Studies */}
        {stats.studyContributions.length > 0 && (
          <Collapsible open={studiesOpen} onOpenChange={setStudiesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4" />
                  {t('knowledgeGraph.dataSources.contributingStudies', 'Contributing Studies')}
                  <Badge variant="secondary" className="text-xs">
                    {stats.studyContributions.length}
                  </Badge>
                </span>
                {studiesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {stats.studyContributions.map((study) => (
                <div
                  key={study.id}
                  className="flex items-start justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onStudyClick?.(study.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {study.title.length > 50 ? `${study.title.substring(0, 50)}...` : study.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {study.status === 'synced' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Clock className="h-3 w-3 text-amber-500" />
                      )}
                      <span>{study.tripletCount} triplets</span>
                      {study.lastSyncedAt && (
                        <>
                          <span>•</span>
                          <span>Synced {format(new Date(study.lastSyncedAt), 'dd/MM/yy HH:mm')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {stats.studyContributions.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {t('knowledgeGraph.dataSources.noStudies', 'No studies contributing yet')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeGraphDataSources;
