import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SankeyData, SankeyNode, SankeyLink } from '@/components/administrador/visualizations/sankey/types';
import { toast } from 'sonner';

// KG entity type → color mapping (synced with KnowledgeGraph3D)
const TYPE_COLORS: Record<string, string> = {
  Nutraceutical: '#22c55e',     // green
  Compound: '#16a34a',          // darker green
  Condition: '#f97316',         // orange
  Disease: '#dc2626',           // dark red
  Mechanism: '#1e3a5f',         // dark blue
  Target: '#3b82f6',            // blue
  Pathway: '#6366f1',           // indigo
  BiologicalProcess: '#eab308', // yellow
  Effect: '#f59e0b',            // amber
  Symptom: '#ef4444',           // red
  Breed: '#8b5cf6',             // purple
  Species: '#a855f7',           // violet
};

// Evidence level → link color
const EVIDENCE_COLORS: Record<string, string> = {
  strong: 'rgba(22, 163, 74, 0.7)',      // green
  moderate: 'rgba(59, 130, 246, 0.7)',    // blue
  rct: 'rgba(59, 130, 246, 0.7)',         // blue
  cohort: 'rgba(99, 102, 241, 0.7)',      // indigo
  low: 'rgba(234, 179, 8, 0.7)',          // yellow
  preliminary: 'rgba(156, 163, 175, 0.6)', // gray
  in_vitro: 'rgba(168, 162, 158, 0.5)',   // stone
};

interface GraphRow {
  source_name: string;
  source_type: string;
  target_name: string;
  target_type: string;
  relationship: string;
  confidence: number;
  evidence_count: number;
  evidence_level: string;
}

export const useSankeyData = () => {
  const [sankeyData, setSankeyData] = useState<SankeyData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('useSankeyData: Fetching from hierarchical_edges via RPC...');

      const { data: rows, error: rpcError } = await supabase
        .rpc('get_relations_graph_data', { p_limit: 2000 });

      if (rpcError) throw rpcError;

      const graphRows = (rows || []) as GraphRow[];
      console.log(`useSankeyData: ${graphRows.length} edges from KG`);

      if (graphRows.length === 0) {
        setSankeyData({ nodes: [], links: [] });
        setIsLoading(false);
        return;
      }

      // Build unique nodes from source+target pairs
      const nodeKey = (name: string, type: string) => `${type}::${name}`;
      const nodeIndexMap = new Map<string, number>();
      const nodes: SankeyNode[] = [];

      const ensureNode = (name: string, type: string): number => {
        const key = nodeKey(name, type);
        if (nodeIndexMap.has(key)) return nodeIndexMap.get(key)!;
        const idx = nodes.length;
        nodeIndexMap.set(key, idx);
        nodes.push({
          name,
          category: type.toLowerCase(),
          color: TYPE_COLORS[type] || '#94a3b8',
          description: `${type}: ${name}`,
        });
        return idx;
      };

      // Collect unique relationship types and entity types
      const relTypesSet = new Set<string>();
      const entityTypesSet = new Set<string>();

      // Build links
      const links: SankeyLink[] = [];
      for (const row of graphRows) {
        const sourceIdx = ensureNode(row.source_name, row.source_type);
        const targetIdx = ensureNode(row.target_name, row.target_type);

        if (sourceIdx === targetIdx) continue; // skip self-loops

        relTypesSet.add(row.relationship);
        entityTypesSet.add(row.source_type);
        entityTypesSet.add(row.target_type);

        const value = Math.max(5, (row.confidence || 0.5) * (row.evidence_count || 1) * 20);

        links.push({
          source: sourceIdx,
          target: targetIdx,
          value,
          color: EVIDENCE_COLORS[row.evidence_level] || EVIDENCE_COLORS.preliminary,
          labelText: row.relationship,
          description: `${row.source_name} → ${row.relationship} → ${row.target_name} (conf: ${(row.confidence * 100).toFixed(0)}%, evidence: ${row.evidence_count})`,
          relationshipType: row.relationship,
          sourceName: row.source_name,
          targetName: row.target_name,
        });
      }

      console.log(`useSankeyData: ${nodes.length} nodes, ${links.length} links built`);

      setRelationshipTypes(Array.from(relTypesSet).sort());
      setEntityTypes(Array.from(entityTypesSet).sort());
      setSankeyData({ nodes, links });
    } catch (err: any) {
      console.error('Error fetching relations graph data:', err);
      setError(err.message);
      toast.error('Não foi possível carregar os dados de relações do Knowledge Graph');
      setSankeyData({ nodes: [], links: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    sankeyData,
    isLoading,
    error,
    refresh: fetchData,
    relationshipTypes,
    entityTypes,
  };
};
