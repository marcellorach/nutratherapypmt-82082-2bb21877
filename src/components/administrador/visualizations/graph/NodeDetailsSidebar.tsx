import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Pill, 
  HeartPulse, 
  Dna, 
  Zap, 
  FileText, 
  Link2, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export interface NodeDetailsData {
  id: string;
  label: string;
  type: string;
  group?: string;
  connections: number;
  connectedNodes: Array<{
    id: string;
    label: string;
    type: string;
    relationLabel?: string;
    relationDirection: 'incoming' | 'outgoing';
    confidence?: number;
  }>;
  metadata?: Record<string, any>;
}

interface NodeDetailsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeData: NodeDetailsData | null;
}

const getEntityIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'nutraceutical':
    case 'compound':
    case 'drug':
      return <Pill className="h-4 w-4" />;
    case 'condition':
    case 'disease':
      return <HeartPulse className="h-4 w-4" />;
    case 'mechanism':
    case 'pathway':
    case 'biologicalprocess':
      return <Dna className="h-4 w-4" />;
    case 'biological_effect':
    case 'effect':
      return <Zap className="h-4 w-4" />;
    case 'target':
    case 'receptor':
    case 'enzyme':
    case 'gene_protein':
      return <Dna className="h-4 w-4" />;
    case 'study':
      return <FileText className="h-4 w-4" />;
    default:
      return <Link2 className="h-4 w-4" />;
  }
};

const getEntityColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'nutraceutical':
    case 'compound':
    case 'drug':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'condition':
    case 'disease':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'mechanism':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'pathway':
    case 'biologicalprocess':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'target':
    case 'receptor':
    case 'enzyme':
    case 'gene_protein':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    case 'biological_effect':
    case 'effect':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'study':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getRelationIcon = (relation?: string) => {
  const positiveRelations = ['TREATS', 'SUPPORTS', 'PREVENTS', 'AMELIORATES', 'SYNERGIZES_WITH'];
  const negativeRelations = ['WORSENS', 'CONTRAINDICATED_FOR', 'CAUSES_SIDE_EFFECT', 'AGGRAVATES'];
  
  if (relation && positiveRelations.some(r => relation.toUpperCase().includes(r))) {
    return <TrendingUp className="h-3 w-3 text-green-500" />;
  }
  if (relation && negativeRelations.some(r => relation.toUpperCase().includes(r))) {
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export const NodeDetailsSidebar: React.FC<NodeDetailsSidebarProps> = ({
  open,
  onOpenChange,
  nodeData
}) => {
  const { t } = useTranslation();

  if (!nodeData) return null;

  const incomingConnections = nodeData.connectedNodes.filter(n => n.relationDirection === 'incoming');
  const outgoingConnections = nodeData.connectedNodes.filter(n => n.relationDirection === 'outgoing');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getEntityColor(nodeData.type)}`}>
              {getEntityIcon(nodeData.type)}
            </div>
            <div>
              <SheetTitle className="text-lg">{nodeData.label}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {nodeData.type}
                </Badge>
                <span className="text-xs">
                  {nodeData.connections} {t('knowledgeGraph.nodeDetails.connections', 'connections')}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          <div className="space-y-6 pb-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{incomingConnections.length}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t('knowledgeGraph.nodeDetails.incomingRelations', 'Incoming')}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{outgoingConnections.length}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t('knowledgeGraph.nodeDetails.outgoingRelations', 'Outgoing')}
                </div>
              </div>
            </div>

            <Separator />

            {/* Outgoing Relations */}
            {outgoingConnections.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {t('knowledgeGraph.nodeDetails.outgoingTitle', 'Outgoing Relations')}
                  <Badge variant="secondary" className="text-[10px]">{outgoingConnections.length}</Badge>
                </h4>
                <div className="space-y-2">
                  {outgoingConnections.slice(0, 15).map((conn, idx) => (
                    <div 
                      key={`out-${idx}`} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {getRelationIcon(conn.relationLabel)}
                      <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                        {conn.relationLabel || 'RELATED'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className={`p-1 rounded ${getEntityColor(conn.type)}`}>
                        {getEntityIcon(conn.type)}
                      </div>
                      <span className="text-sm truncate flex-1">{conn.label}</span>
                      {conn.confidence !== undefined && (
                        <Badge variant="outline" className="text-[9px]">
                          {Math.round(conn.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                  {outgoingConnections.length > 15 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      +{outgoingConnections.length - 15} {t('knowledgeGraph.nodeDetails.more', 'more')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Incoming Relations */}
            {incomingConnections.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-180" />
                  {t('knowledgeGraph.nodeDetails.incomingTitle', 'Incoming Relations')}
                  <Badge variant="secondary" className="text-[10px]">{incomingConnections.length}</Badge>
                </h4>
                <div className="space-y-2">
                  {incomingConnections.slice(0, 15).map((conn, idx) => (
                    <div 
                      key={`in-${idx}`} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-1 rounded ${getEntityColor(conn.type)}`}>
                        {getEntityIcon(conn.type)}
                      </div>
                      <span className="text-sm truncate flex-1">{conn.label}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {getRelationIcon(conn.relationLabel)}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {conn.relationLabel || 'RELATED'}
                      </span>
                      {conn.confidence !== undefined && (
                        <Badge variant="outline" className="text-[9px]">
                          {Math.round(conn.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                  {incomingConnections.length > 15 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      +{incomingConnections.length - 15} {t('knowledgeGraph.nodeDetails.more', 'more')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No connections */}
            {nodeData.connectedNodes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('knowledgeGraph.nodeDetails.noConnections', 'No connections found')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
