import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TripletData {
  id: string;
  subject_name: string;
  subject_type: string;
  predicate: string;
  object_name: string;
  object_type: string;
  extraction_confidence: number | null;
  confidence_rationale?: string | null;
  evidence_level?: string | null;
  species_context?: string[] | null;
  study_id?: string | null;
}

interface TripletReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triplet: TripletData | null;
  onReviewed: (tripletId: string, newStatus: string) => void;
}

const TripletReviewDialog: React.FC<TripletReviewDialogProps> = ({
  open,
  onOpenChange,
  triplet,
  onReviewed,
}) => {
  const { t } = useTranslation();
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!triplet) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('triplet_extractions')
        .update({
          curation_status: status,
          review_notes: reviewNotes || null,
          review_date: new Date().toISOString(),
        })
        .eq('id', triplet.id);

      if (error) throw error;

      toast({
        title: status === 'approved'
          ? t('knowledgeGraph.tripletReview.approved', 'Triplet approved')
          : t('knowledgeGraph.tripletReview.rejected', 'Triplet rejected'),
      });

      onReviewed(triplet.id, status);
      setReviewNotes('');
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating triplet:', err);
      toast({
        title: t('common.error', 'Error'),
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!triplet) return null;

  const confidence = triplet.extraction_confidence;
  const confPercent = confidence ? Math.round(confidence * 100) : null;
  const confColor = confidence && confidence >= 0.8
    ? 'bg-green-100 text-green-700'
    : confidence && confidence >= 0.5
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('knowledgeGraph.tripletReview.title', 'Review Triplet')}
          </DialogTitle>
          <DialogDescription>
            {t('knowledgeGraph.tripletReview.description', 'Review and approve or reject this triplet extraction.')}
          </DialogDescription>
        </DialogHeader>

        {/* Triplet chain */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-center">
              <Badge variant="outline" className="text-[10px] mb-1">{triplet.subject_type}</Badge>
              <div className="font-semibold text-primary">{triplet.subject_name}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Badge className="bg-accent text-accent-foreground">{triplet.predicate}</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-center">
              <Badge variant="outline" className="text-[10px] mb-1">{triplet.object_type}</Badge>
              <div className="font-semibold">{triplet.object_name}</div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {confPercent !== null && (
              <Badge className={confColor}>{confPercent}% {t('knowledgeGraph.tripletReview.confidence', 'confidence')}</Badge>
            )}
            {triplet.evidence_level && (
              <Badge variant="outline">{triplet.evidence_level}</Badge>
            )}
            {triplet.species_context && triplet.species_context.length > 0 && (
              <Badge variant="secondary">{triplet.species_context.join(', ')}</Badge>
            )}
          </div>

          {/* Confidence rationale */}
          {triplet.confidence_rationale && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground italic">
                {triplet.confidence_rationale}
              </p>
            </div>
          )}
        </div>

        {/* Review notes */}
        <div className="space-y-2">
          <Label>{t('knowledgeGraph.tripletReview.notes', 'Review Notes (optional)')}</Label>
          <Textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder={t('knowledgeGraph.tripletReview.notesPlaceholder', 'Add notes about your decision...')}
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => handleAction('rejected')}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            {t('knowledgeGraph.tripletReview.reject', 'Reject')}
          </Button>
          <Button
            onClick={() => handleAction('approved')}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t('knowledgeGraph.tripletReview.approve', 'Approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripletReviewDialog;
