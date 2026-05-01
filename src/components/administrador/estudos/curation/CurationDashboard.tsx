import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, AlertCircle, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { TripletCurationQueue } from './TripletCurationQueue';
import { AutoDiscoveryReview } from './AutoDiscoveryReview';
import { EnrichmentQAReview } from './EnrichmentQAReview';

interface CurationMetrics {
  triplets: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    needsReview: number;
    approvalRate: number;
  };
  discoveries: {
    total: number;
    suggested: number;
    underReview: number;
    validated: number;
    rejected: number;
    validationRate: number;
  };
}

export const CurationDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<CurationMetrics>({
    triplets: { total: 0, pending: 0, approved: 0, rejected: 0, needsReview: 0, approvalRate: 0 },
    discoveries: { total: 0, suggested: 0, underReview: 0, validated: 0, rejected: 0, validationRate: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch triplet metrics
      const { data: triplets } = await supabase
        .from('triplet_extractions')
        .select('curation_status');

      const tripletMetrics = {
        total: triplets?.length || 0,
        pending: triplets?.filter(t => t.curation_status === 'pending').length || 0,
        approved: triplets?.filter(t => t.curation_status === 'approved').length || 0,
        rejected: triplets?.filter(t => t.curation_status === 'rejected').length || 0,
        needsReview: triplets?.filter(t => t.curation_status === 'needs_review').length || 0,
        approvalRate: 0
      };

      const reviewed = tripletMetrics.approved + tripletMetrics.rejected;
      tripletMetrics.approvalRate = reviewed > 0 ? (tripletMetrics.approved / reviewed) * 100 : 0;

      // Fetch discovery metrics
      const { data: discoveries } = await supabase
        .from('auto_discoveries')
        .select('status');

      const discoveryMetrics = {
        total: discoveries?.length || 0,
        suggested: discoveries?.filter(d => d.status === 'suggested').length || 0,
        underReview: discoveries?.filter(d => d.status === 'under_review').length || 0,
        validated: discoveries?.filter(d => d.status === 'validated').length || 0,
        rejected: discoveries?.filter(d => d.status === 'rejected').length || 0,
        validationRate: 0
      };

      const reviewedDiscoveries = discoveryMetrics.validated + discoveryMetrics.rejected;
      discoveryMetrics.validationRate = reviewedDiscoveries > 0 ? (discoveryMetrics.validated / reviewedDiscoveries) * 100 : 0;

      setMetrics({
        triplets: tripletMetrics,
        discoveries: discoveryMetrics
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              {t('curation.dashboard.pending') || 'Pending Review'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.triplets.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('curation.dashboard.triplets') || 'Triplets awaiting curation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              {t('curation.dashboard.approved') || 'Approved'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.triplets.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.triplets.approvalRate.toFixed(1)}% {t('curation.dashboard.approvalRate') || 'approval rate'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              {t('curation.dashboard.discoveries') || 'New Discoveries'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.discoveries.suggested}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('curation.dashboard.awaitingValidation') || 'Awaiting validation'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              {t('curation.dashboard.validated') || 'Validated'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.discoveries.validated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.discoveries.validationRate.toFixed(1)}% {t('curation.dashboard.validationRate') || 'validation rate'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('curation.dashboard.tripletMetrics') || 'Triplet Curation Metrics'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="outline" className="w-20 justify-center">Total</Badge>
              </span>
              <span className="font-semibold">{metrics.triplets.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge className="bg-yellow-500 w-20 justify-center">Pending</Badge>
              </span>
              <span className="font-semibold">{metrics.triplets.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge className="bg-green-500 w-20 justify-center">Approved</Badge>
              </span>
              <span className="font-semibold">{metrics.triplets.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="destructive" className="w-20 justify-center">Rejected</Badge>
              </span>
              <span className="font-semibold">{metrics.triplets.rejected}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="secondary" className="w-20 justify-center">Review</Badge>
              </span>
              <span className="font-semibold">{metrics.triplets.needsReview}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('curation.dashboard.discoveryMetrics') || 'Auto-Discovery Metrics'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="outline" className="w-20 justify-center">Total</Badge>
              </span>
              <span className="font-semibold">{metrics.discoveries.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge className="bg-purple-500 w-20 justify-center">Suggested</Badge>
              </span>
              <span className="font-semibold">{metrics.discoveries.suggested}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge className="bg-yellow-500 w-20 justify-center">Review</Badge>
              </span>
              <span className="font-semibold">{metrics.discoveries.underReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge className="bg-green-500 w-20 justify-center">Validated</Badge>
              </span>
              <span className="font-semibold">{metrics.discoveries.validated}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <Badge variant="destructive" className="w-20 justify-center">Rejected</Badge>
              </span>
              <span className="font-semibold">{metrics.discoveries.rejected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Curation Queues */}
      <Card>
        <CardHeader>
          <CardTitle>{t('curation.dashboard.curationQueues') || 'Curation Queues'}</CardTitle>
          <CardDescription>
            {t('curation.dashboard.queuesDescription') || 'Review and validate AI-extracted knowledge'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="triplets">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="triplets" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('curation.dashboard.tripletsTab') || 'Triplets'}
                {metrics.triplets.pending > 0 && (
                  <Badge variant="destructive" className="ml-2">{metrics.triplets.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="discoveries" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('curation.dashboard.discoveriesTab') || 'Discoveries'}
                {metrics.discoveries.suggested > 0 && (
                  <Badge className="bg-purple-500 ml-2">{metrics.discoveries.suggested}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                QA Enriquecimento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="triplets" className="mt-6">
              <TripletCurationQueue />
            </TabsContent>

            <TabsContent value="discoveries" className="mt-6">
              <AutoDiscoveryReview />
            </TabsContent>

            <TabsContent value="qa" className="mt-6">
              <EnrichmentQAReview />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
