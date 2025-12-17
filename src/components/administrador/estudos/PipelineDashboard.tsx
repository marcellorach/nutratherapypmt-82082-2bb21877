import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, GitBranch, Database, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface PipelineStats {
  totalStudies: number;
  approvedStudies: number;
  pendingStudies: number;
  totalTriplets: number;
  approvedTriplets: number;
  pendingTriplets: number;
  totalEdges: number;
}

const PipelineDashboard: React.FC = () => {
  const [stats, setStats] = useState<PipelineStats>({
    totalStudies: 0,
    approvedStudies: 0,
    pendingStudies: 0,
    totalTriplets: 0,
    approvedTriplets: 0,
    pendingTriplets: 0,
    totalEdges: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studiesRes, tripletsRes, edgesRes] = await Promise.all([
        supabase.from('processed_studies').select('kanban_status'),
        supabase.from('triplet_extractions').select('curation_status'),
        supabase.from('hierarchical_edges').select('id', { count: 'exact', head: true })
      ]);

      const studies = studiesRes.data || [];
      const triplets = tripletsRes.data || [];

      setStats({
        totalStudies: studies.length,
        approvedStudies: studies.filter(s => s.kanban_status === 'approved').length,
        pendingStudies: studies.filter(s => s.kanban_status !== 'approved').length,
        totalTriplets: triplets.length,
        approvedTriplets: triplets.filter(t => t.curation_status === 'approved').length,
        pendingTriplets: triplets.filter(t => t.curation_status === 'pending').length,
        totalEdges: edgesRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, color }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color || 'text-muted-foreground'}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipeline VetGraphRAG</h3>
        <Badge variant="outline">Atualizado automaticamente</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Estudos"
          value={stats.totalStudies}
          icon={FileText}
          subtitle={`${stats.approvedStudies} aprovados`}
          color="text-blue-500"
        />
        <StatCard
          title="Triplets"
          value={stats.totalTriplets}
          icon={GitBranch}
          subtitle={`${stats.approvedTriplets} aprovados, ${stats.pendingTriplets} pendentes`}
          color="text-purple-500"
        />
        <StatCard
          title="Edges"
          value={stats.totalEdges}
          icon={Database}
          subtitle="No Knowledge Graph"
          color="text-green-500"
        />
        <StatCard
          title="Taxa Aprovação"
          value={stats.totalTriplets > 0 ? `${Math.round((stats.approvedTriplets / stats.totalTriplets) * 100)}%` : '0%'}
          icon={CheckCircle}
          subtitle="Triplets aprovados"
          color="text-amber-500"
        />
      </div>
    </div>
  );
};

export default PipelineDashboard;
