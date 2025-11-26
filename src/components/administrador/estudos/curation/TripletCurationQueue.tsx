import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Check, X, AlertCircle, Search, Filter, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface TripletExtraction {
  id: string;
  study_id: string;
  subject_type: string;
  subject_name: string;
  predicate: string;
  object_type: string;
  object_name: string;
  extraction_confidence: number;
  kg_match_score: number;
  llm_confidence: number;
  curation_status: string;
  auto_approved: boolean;
  created_at: string;
}

export const TripletCurationQueue: React.FC = () => {
  const { t } = useTranslation();
  const [triplets, setTriplets] = useState<TripletExtraction[]>([]);
  const [filteredTriplets, setFilteredTriplets] = useState<TripletExtraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTriplet, setSelectedTriplet] = useState<TripletExtraction | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  useEffect(() => {
    fetchTriplets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [triplets, searchTerm, statusFilter, minConfidence]);

  const fetchTriplets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('triplet_extractions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriplets(data || []);
    } catch (error: any) {
      toast.error(t('curation.triplets.fetchError') || 'Error fetching triplets');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = triplets;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.curation_status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject_name.toLowerCase().includes(term) ||
        t.object_name.toLowerCase().includes(term) ||
        t.predicate.toLowerCase().includes(term)
      );
    }

    // Confidence filter
    filtered = filtered.filter(t => t.extraction_confidence >= minConfidence);

    setFilteredTriplets(filtered);
  };

  const handleApprove = async (tripletId: string) => {
    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'approved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          review_date: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', tripletId);

      if (error) throw error;

      toast.success(t('curation.triplets.approved') || 'Triplet approved');
      setReviewNotes('');
      setSelectedTriplet(null);
      fetchTriplets();
    } catch (error: any) {
      toast.error(t('curation.triplets.approveError') || 'Error approving triplet');
      console.error('Error:', error);
    }
  };

  const handleReject = async (tripletId: string) => {
    if (!reviewNotes.trim()) {
      toast.error(t('curation.triplets.notesRequired') || 'Review notes required for rejection');
      return;
    }

    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          review_date: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', tripletId);

      if (error) throw error;

      toast.success(t('curation.triplets.rejected') || 'Triplet rejected');
      setReviewNotes('');
      setSelectedTriplet(null);
      fetchTriplets();
    } catch (error: any) {
      toast.error(t('curation.triplets.rejectError') || 'Error rejecting triplet');
      console.error('Error:', error);
    }
  };

  const handleRequestExpertReview = async (tripletId: string) => {
    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: 'needs_review',
          review_notes: reviewNotes
        })
        .eq('id', tripletId);

      if (error) throw error;

      toast.success(t('curation.triplets.expertRequested') || 'Expert review requested');
      setReviewNotes('');
      setSelectedTriplet(null);
      fetchTriplets();
    } catch (error: any) {
      toast.error(t('curation.triplets.requestError') || 'Error requesting review');
      console.error('Error:', error);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) return <Badge className="bg-green-500">High ({(confidence * 100).toFixed(0)}%)</Badge>;
    if (confidence >= 0.70) return <Badge className="bg-yellow-500">Medium ({(confidence * 100).toFixed(0)}%)</Badge>;
    return <Badge variant="destructive">Low ({(confidence * 100).toFixed(0)}%)</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('curation.triplets.title') || 'Triplet Curation Queue'}
          </CardTitle>
          <CardDescription>
            {t('curation.triplets.description') || 'Review and approve AI-extracted triplets from scientific studies'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('curation.triplets.search') || 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('curation.triplets.all') || 'All'}</SelectItem>
                <SelectItem value="pending">{t('curation.triplets.pending') || 'Pending'}</SelectItem>
                <SelectItem value="approved">{t('curation.triplets.approved') || 'Approved'}</SelectItem>
                <SelectItem value="rejected">{t('curation.triplets.rejected') || 'Rejected'}</SelectItem>
                <SelectItem value="needs_review">{t('curation.triplets.needsReview') || 'Needs Review'}</SelectItem>
              </SelectContent>
            </Select>

            {/* Confidence Filter */}
            <div>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                placeholder={t('curation.triplets.minConfidence') || 'Min Confidence'}
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              {filteredTriplets.length} {t('curation.triplets.results') || 'results'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triplet List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            {t('curation.triplets.loading') || 'Loading triplets...'}
          </div>
        ) : filteredTriplets.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            {t('curation.triplets.noResults') || 'No triplets found'}
          </div>
        ) : (
          filteredTriplets.map((triplet) => (
            <Card key={triplet.id} className={selectedTriplet?.id === triplet.id ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{triplet.subject_type}</Badge>
                      <span className="font-semibold">{triplet.subject_name}</span>
                    </div>
                    <div className="flex items-center gap-2 my-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge>{triplet.predicate}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{triplet.object_type}</Badge>
                      <span className="font-semibold">{triplet.object_name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getConfidenceBadge(triplet.extraction_confidence)}
                    {triplet.auto_approved && <Badge variant="secondary">Auto</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scores */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">KG Match</div>
                    <div className="font-semibold">{(triplet.kg_match_score * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">LLM Conf.</div>
                    <div className="font-semibold">{(triplet.llm_confidence * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Overall</div>
                    <div className="font-semibold">{(triplet.extraction_confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {/* Actions */}
                {triplet.curation_status === 'pending' && (
                  <>
                    {selectedTriplet?.id === triplet.id && (
                      <Textarea
                        placeholder={t('curation.triplets.notesPlaceholder') || 'Review notes (optional for approval, required for rejection)...'}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                      />
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTriplet(triplet);
                          handleApprove(triplet.id);
                        }}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('curation.triplets.approve') || 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedTriplet(triplet);
                          if (reviewNotes.trim()) {
                            handleReject(triplet.id);
                          } else {
                            toast.error(t('curation.triplets.notesRequired') || 'Review notes required');
                          }
                        }}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('curation.triplets.reject') || 'Reject'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTriplet(triplet);
                          handleRequestExpertReview(triplet.id);
                        }}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {t('curation.triplets.requestExpert') || 'Expert'}
                      </Button>
                    </div>
                  </>
                )}

                {triplet.curation_status !== 'pending' && (
                  <Badge className="w-full justify-center">
                    {triplet.curation_status.toUpperCase()}
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
