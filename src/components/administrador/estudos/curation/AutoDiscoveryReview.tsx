import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Check, X, TrendingUp, AlertTriangle, GitBranch, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface AutoDiscovery {
  id: string;
  head_entity_type: string;
  head_entity_name: string;
  predicted_relation: string;
  tail_entity_type: string;
  tail_entity_name: string;
  transe_score: number;
  evidence_multiplier: number;
  novelty_factor: number;
  discovery_score: number;
  supporting_paths: any;
  status: string;
  approval_chain: any;
  discovered_at: string;
}

export const AutoDiscoveryReview: React.FC = () => {
  const { t } = useTranslation();
  const [discoveries, setDiscoveries] = useState<AutoDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('suggested');
  const [selectedDiscovery, setSelectedDiscovery] = useState<AutoDiscovery | null>(null);
  const [validationNotes, setValidationNotes] = useState('');

  useEffect(() => {
    fetchDiscoveries();
  }, [statusFilter]);

  const fetchDiscoveries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('auto_discoveries')
        .select('*')
        .order('discovery_score', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDiscoveries(data || []);
    } catch (error: any) {
      toast.error(t('curation.discoveries.fetchError') || 'Error fetching discoveries');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (discoveryId: string) => {
    try {
      const { error } = await supabase
        .from('auto_discoveries')
        .update({
          status: 'validated',
          validated_by: (await supabase.auth.getUser()).data.user?.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes
        })
        .eq('id', discoveryId);

      if (error) throw error;

      toast.success(t('curation.discoveries.validated') || 'Discovery validated');
      setValidationNotes('');
      setSelectedDiscovery(null);
      fetchDiscoveries();
    } catch (error: any) {
      toast.error(t('curation.discoveries.validateError') || 'Error validating discovery');
      console.error('Error:', error);
    }
  };

  const handleReject = async (discoveryId: string) => {
    if (!validationNotes.trim()) {
      toast.error(t('curation.discoveries.notesRequired') || 'Validation notes required for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('auto_discoveries')
        .update({
          status: 'rejected',
          validated_by: (await supabase.auth.getUser()).data.user?.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes
        })
        .eq('id', discoveryId);

      if (error) throw error;

      toast.success(t('curation.discoveries.rejected') || 'Discovery rejected');
      setValidationNotes('');
      setSelectedDiscovery(null);
      fetchDiscoveries();
    } catch (error: any) {
      toast.error(t('curation.discoveries.rejectError') || 'Error rejecting discovery');
      console.error('Error:', error);
    }
  };

  const handleRequestReview = async (discoveryId: string) => {
    try {
      const { error } = await supabase
        .from('auto_discoveries')
        .update({
          status: 'under_review',
          validation_notes: validationNotes
        })
        .eq('id', discoveryId);

      if (error) throw error;

      toast.success(t('curation.discoveries.reviewRequested') || 'Review requested');
      setValidationNotes('');
      setSelectedDiscovery(null);
      fetchDiscoveries();
    } catch (error: any) {
      toast.error(t('curation.discoveries.requestError') || 'Error requesting review');
      console.error('Error:', error);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.85) return <Badge className="bg-green-500">Excellent ({(score * 100).toFixed(0)}%)</Badge>;
    if (score >= 0.70) return <Badge className="bg-blue-500">Good ({(score * 100).toFixed(0)}%)</Badge>;
    if (score >= 0.50) return <Badge className="bg-yellow-500">Fair ({(score * 100).toFixed(0)}%)</Badge>;
    return <Badge variant="destructive">Low ({(score * 100).toFixed(0)}%)</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('curation.discoveries.title') || 'Auto-Discovery Review'}
          </CardTitle>
          <CardDescription>
            {t('curation.discoveries.description') || 'Review TransE-predicted links requiring scientific validation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('curation.discoveries.all') || 'All'}</SelectItem>
                <SelectItem value="suggested">{t('curation.discoveries.suggested') || 'Suggested'}</SelectItem>
                <SelectItem value="under_review">{t('curation.discoveries.underReview') || 'Under Review'}</SelectItem>
                <SelectItem value="validated">{t('curation.discoveries.validated') || 'Validated'}</SelectItem>
                <SelectItem value="rejected">{t('curation.discoveries.rejected') || 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
              {discoveries.length} {t('curation.discoveries.results') || 'discoveries'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('curation.discoveries.loading') || 'Loading discoveries...'}
          </div>
        ) : discoveries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('curation.discoveries.noResults') || 'No discoveries found'}
          </div>
        ) : (
          discoveries.map((discovery) => (
            <Card key={discovery.id} className={selectedDiscovery?.id === discovery.id ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold text-primary">
                        {t('curation.discoveries.newDiscovery') || 'New Discovery'}
                      </span>
                      {discovery.novelty_factor === 1.0 && (
                        <Badge className="bg-purple-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {t('curation.discoveries.novel') || 'Novel'}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{discovery.head_entity_type}</Badge>
                        <span className="font-semibold text-lg">{discovery.head_entity_name}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-8">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <Badge className="text-base">{discovery.predicted_relation}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{discovery.tail_entity_type}</Badge>
                        <span className="font-semibold text-lg">{discovery.tail_entity_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {getScoreBadge(discovery.discovery_score)}
                    <Badge variant="secondary" className="text-xs">
                      TransE: {(discovery.transe_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">TransE Score</div>
                    <div className="text-sm font-semibold">{(discovery.transe_score * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Evidence Mult.</div>
                    <div className="text-sm font-semibold">{discovery.evidence_multiplier.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Novelty</div>
                    <div className="text-sm font-semibold">{(discovery.novelty_factor * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Supporting Paths */}
                {discovery.supporting_paths && discovery.supporting_paths.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <GitBranch className="h-4 w-4" />
                      {t('curation.discoveries.supportingPaths') || 'Supporting Paths in KG'}
                    </div>
                    <div className="space-y-1">
                      {discovery.supporting_paths.slice(0, 3).map((path: any, idx: number) => (
                        <div key={idx} className="text-xs bg-muted p-2 rounded">
                          {path.path || JSON.stringify(path)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {discovery.status === 'suggested' && (
                  <>
                    {selectedDiscovery?.id === discovery.id && (
                      <Textarea
                        placeholder={t('curation.discoveries.notesPlaceholder') || 'Validation notes (optional for validation, required for rejection)...'}
                        value={validationNotes}
                        onChange={(e) => setValidationNotes(e.target.value)}
                        rows={3}
                      />
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedDiscovery(discovery);
                          handleValidate(discovery.id);
                        }}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('curation.discoveries.validate') || 'Validate'}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedDiscovery(discovery);
                          if (validationNotes.trim()) {
                            handleReject(discovery.id);
                          } else {
                            toast.error(t('curation.discoveries.notesRequired') || 'Notes required');
                          }
                        }}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('curation.discoveries.reject') || 'Reject'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDiscovery(discovery);
                          handleRequestReview(discovery.id);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {t('curation.discoveries.requestReview') || 'Review'}
                      </Button>
                    </div>
                  </>
                )}

                {discovery.status !== 'suggested' && (
                  <Badge className="w-full justify-center">
                    {discovery.status.toUpperCase().replace('_', ' ')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
