import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, GitBranch } from 'lucide-react';
import NetworkGraph from '@/components/administrador/visualizations/NetworkGraph';

interface PatientKnowledgeSubgraphProps {
  kgTriplets: any[];
  kgPathways: any[];
  conditions: string[];
  recommendedCompounds: string[];
}

// Color palette for node types
const NODE_COLORS: Record<string, { background: string; border: string }> = {
  compound: { background: '#22c55e', border: '#16a34a' },
  condition: { background: '#f97316', border: '#ea580c' },
  mechanism: { background: '#3b82f6', border: '#2563eb' },
  effect: { background: '#8b5cf6', border: '#7c3aed' },
  outcome: { background: '#06b6d4', border: '#0891b2' },
};

const PatientKnowledgeSubgraph: React.FC<PatientKnowledgeSubgraphProps> = ({
  kgTriplets,
  kgPathways,
  conditions,
  recommendedCompounds,
}) => {
  const { t } = useTranslation();

  const graphData = useMemo(() => {
    const nodeMap = new Map<string, any>();
    const links: any[] = [];

    // Helper to add node
    const addNode = (name: string, type: string) => {
      const key = name.toLowerCase().trim();
      if (!key || nodeMap.has(key)) return key;
      nodeMap.set(key, {
        id: key,
        label: name.length > 25 ? name.slice(0, 22) + '...' : name,
        title: name,
        group: type,
        shape: type === 'compound' ? 'dot' : type === 'condition' ? 'diamond' : type === 'mechanism' ? 'triangle' : 'dot',
        color: NODE_COLORS[type] || NODE_COLORS.effect,
        value: type === 'compound' ? 20 : type === 'condition' ? 18 : 12,
      });
      return key;
    };

    // Add conditions
    for (const c of conditions) {
      addNode(c, 'condition');
    }

    // Add compounds
    for (const c of recommendedCompounds) {
      addNode(c, 'compound');
    }

    // Add triplet edges
    const seenEdges = new Set<string>();
    for (const trip of kgTriplets) {
      const subjectKey = addNode(trip.subject, guessNodeType(trip.subject, conditions, recommendedCompounds));
      const objectKey = addNode(trip.object, guessNodeType(trip.object, conditions, recommendedCompounds));
      const edgeKey = `${subjectKey}-${trip.predicate}-${objectKey}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);

      const predLabel = trip.predicate?.replace(/_/g, ' ') || '';
      links.push({
        from: subjectKey,
        to: objectKey,
        label: predLabel.length > 15 ? predLabel.slice(0, 12) + '...' : predLabel,
        title: `${trip.subject} ${trip.predicate} ${trip.object}`,
        arrows: 'to',
        color: trip.predicate === 'TREATS' || trip.predicate === 'PREVENTS' ? '#22c55e' :
               trip.predicate === 'CONTRAINDICATES' || trip.predicate === 'AGGRAVATES' ? '#ef4444' :
               '#94a3b8',
        width: trip.confidence ? Math.max(1, trip.confidence * 3) : 2,
      });
    }

    // Add pathway steps as mechanism nodes
    for (const pathway of kgPathways) {
      const steps = pathway.steps || [];
      for (let i = 0; i < steps.length - 1; i++) {
        const fromKey = addNode(steps[i].label, steps[i].type || 'mechanism');
        const toKey = addNode(steps[i + 1].label, steps[i + 1].type || 'mechanism');
        const edgeKey = `${fromKey}-${steps[i + 1].predicate || 'connects'}-${toKey}`;
        if (seenEdges.has(edgeKey)) continue;
        seenEdges.add(edgeKey);
        links.push({
          from: fromKey,
          to: toKey,
          label: steps[i + 1].predicate || '',
          arrows: 'to',
          color: '#94a3b8',
          width: 1.5,
          dashes: true,
        });
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links,
    };
  }, [kgTriplets, kgPathways, conditions, recommendedCompounds]);

  if (graphData.nodes.length === 0) return null;

  const customOptions = {
    physics: {
      enabled: true,
      solver: 'barnesHut',
      stabilization: { enabled: true, iterations: 400, fit: true, updateInterval: 25 },
      barnesHut: {
        gravitationalConstant: -28000,
        centralGravity: 0.05,
        springLength: 220,
        springConstant: 0.02,
        damping: 0.3,
        avoidOverlap: 0.6,
      },
      maxVelocity: 40,
      minVelocity: 0.5,
    },
    edges: {
      font: { size: 9, color: '#64748b', strokeWidth: 2, strokeColor: '#ffffff' },
      smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 },
      length: 220,
    },
    nodes: {
      font: { size: 12, face: 'Inter, system-ui, sans-serif' },
      borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(0,0,0,0.15)', size: 4 },
    },
    interaction: {
      hover: true,
      zoomView: true,
      dragView: true,
      navigationButtons: false,
    },
    layout: {
      improvedLayout: true,
    },
    groups: {
      compound: { color: NODE_COLORS.compound, shape: 'dot', size: 18 },
      condition: { color: NODE_COLORS.condition, shape: 'diamond', size: 16 },
      mechanism: { color: NODE_COLORS.mechanism, shape: 'triangle', size: 14 },
      effect: { color: NODE_COLORS.effect, shape: 'dot', size: 12 },
      outcome: { color: NODE_COLORS.outcome, shape: 'dot', size: 14 },
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          {t('petProfile.subgraph.title', 'Subgrafo do Paciente')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('petProfile.subgraph.description', 'Fragmento do Knowledge Graph utilizado nas recomendações deste paciente')}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(NODE_COLORS).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.background }} />
              <span className="text-[10px] text-muted-foreground capitalize">
                {t(`petProfile.subgraph.nodeType.${type}`, type)}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <NetworkGraph
          data={graphData}
          height="400px"
          showControls={true}
          customOptions={customOptions}
        />
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>{graphData.nodes.length} {t('petProfile.subgraph.nodes', 'nós')}</span>
          <span>{graphData.links.length} {t('petProfile.subgraph.edges', 'conexões')}</span>
          <span>{kgTriplets.length} {t('petProfile.subgraph.triplets', 'triplets')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Guess node type based on name matching
function guessNodeType(name: string, conditions: string[], compounds: string[]): string {
  const lower = name.toLowerCase();
  if (conditions.some(c => c.toLowerCase() === lower)) return 'condition';
  if (compounds.some(c => c.toLowerCase() === lower)) return 'compound';
  const mechKeywords = ['pathway', 'nf-kb', 'cox', 'receptor', 'enzyme', 'kinase', 'inhibit', 'modula'];
  if (mechKeywords.some(k => lower.includes(k))) return 'mechanism';
  return 'effect';
}

export default PatientKnowledgeSubgraph;
