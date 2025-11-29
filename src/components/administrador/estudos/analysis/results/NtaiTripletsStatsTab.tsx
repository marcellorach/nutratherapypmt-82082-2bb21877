import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Network, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NtaiTripletsStatsTabProps {
  studyId: string;
}

const NtaiTripletsStatsTab: React.FC<NtaiTripletsStatsTabProps> = ({ studyId }) => {
  const { t } = useTranslation();

  const { data: triplets, isLoading } = useQuery({
    queryKey: ['study-triplets', studyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .eq('study_id', studyId);
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!triplets || triplets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Network className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('admin.ntai.triplets.noTriplets')}</p>
      </div>
    );
  }

  // Calcular estatísticas
  const totalTriplets = triplets.length;
  const pendingCount = triplets.filter(t => t.curation_status === 'pending').length;
  const approvedCount = triplets.filter(t => t.curation_status === 'approved').length;
  const rejectedCount = triplets.filter(t => t.curation_status === 'rejected').length;
  
  const avgConfidence = triplets.reduce((sum, t) => sum + (t.extraction_confidence || 0), 0) / totalTriplets;

  // Distribuição por predicate
  const predicateDistribution = triplets.reduce((acc, t) => {
    const pred = t.predicate;
    acc[pred] = (acc[pred] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(predicateDistribution).map(([name, value]) => ({
    name,
    value
  }));

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return <Badge variant="outline">N/A</Badge>;
    if (confidence >= 0.8) return <Badge className="bg-green-100 text-green-700">{(confidence * 100).toFixed(0)}%</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-700">{(confidence * 100).toFixed(0)}%</Badge>;
    return <Badge className="bg-red-100 text-red-700">{(confidence * 100).toFixed(0)}%</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.ntai.triplets.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTriplets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.ntai.triplets.pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.ntai.triplets.approved')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('admin.ntai.triplets.avgConfidence')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(avgConfidence * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.ntai.triplets.distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Triplets Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.ntai.triplets.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 font-medium">{t('admin.ntai.triplets.subject')}</th>
                  <th className="pb-2 font-medium text-center">→</th>
                  <th className="pb-2 font-medium">{t('admin.ntai.triplets.predicate')}</th>
                  <th className="pb-2 font-medium text-center">→</th>
                  <th className="pb-2 font-medium">{t('admin.ntai.triplets.object')}</th>
                  <th className="pb-2 font-medium text-center">{t('admin.ntai.triplets.confidence')}</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {triplets
                  .sort((a, b) => (b.extraction_confidence || 0) - (a.extraction_confidence || 0))
                  .map((triplet, idx) => (
                    <tr key={triplet.id} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{triplet.subject_name}</div>
                          <div className="text-xs text-muted-foreground">[{triplet.subject_type}]</div>
                        </div>
                      </td>
                      <td className="text-center text-muted-foreground">→</td>
                      <td className="py-3">
                        <Badge variant="outline">{triplet.predicate}</Badge>
                      </td>
                      <td className="text-center text-muted-foreground">→</td>
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{triplet.object_name}</div>
                          <div className="text-xs text-muted-foreground">[{triplet.object_type}]</div>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        {getConfidenceBadge(triplet.extraction_confidence)}
                      </td>
                      <td className="text-center py-3">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(triplet.curation_status || 'pending')}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NtaiTripletsStatsTab;
