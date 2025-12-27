import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AlertTriangle, 
  RefreshCw, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConflictCard } from './ConflictCard';
import { ResolutionDialog } from './ResolutionDialog';
import { ConflictAlert } from './ConflictAlert';
import { 
  useEvidenceConflicts, 
  useConflictDetection,
  EvidenceConflict,
  EvidenceClaimDB 
} from '@/hooks/useEvidenceConflicts';
import { toast } from 'sonner';

type ConflictStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';
type ConflictLevel = 'none' | 'low' | 'moderate' | 'high';

export function ConflictReviewPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConflictStatus>('pending');
  const [levelFilter, setLevelFilter] = useState<ConflictLevel | 'all'>('all');
  const [selectedConflict, setSelectedConflict] = useState<EvidenceConflict | null>(null);
  const [selectedConflictClaims, setSelectedConflictClaims] = useState<EvidenceClaimDB[]>([]);
  const [loadingClaimsFor, setLoadingClaimsFor] = useState<string | null>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);

  const { 
    conflicts, 
    isLoading, 
    pendingCount,
    fetchClaimsForConflict,
    dismissConflict,
    refetch
  } = useEvidenceConflicts({ 
    status: activeTab,
    conflictLevel: levelFilter !== 'all' ? levelFilter : undefined
  });

  const { detectConflicts, isDetecting } = useConflictDetection();

  // Load claims when a conflict is expanded
  const loadClaimsForConflict = async (conflict: EvidenceConflict) => {
    if (conflict.claim_ids.length === 0) return;
    
    setLoadingClaimsFor(conflict.id);
    try {
      const claims = await fetchClaimsForConflict(conflict.claim_ids);
      setSelectedConflictClaims(claims);
    } catch (error) {
      console.error('Failed to load claims:', error);
      toast.error(t('conflicts.panel.loadClaimsError'));
    } finally {
      setLoadingClaimsFor(null);
    }
  };

  const handleResolve = (conflict: EvidenceConflict) => {
    setSelectedConflict(conflict);
    loadClaimsForConflict(conflict).then(() => {
      setShowResolutionDialog(true);
    });
  };

  const handleDismiss = async (conflict: EvidenceConflict) => {
    try {
      await dismissConflict.mutateAsync({
        conflictId: conflict.id,
        reason: 'Dismissed by admin',
      });
      toast.success(t('conflicts.panel.dismissed'));
    } catch (error) {
      console.error('Failed to dismiss conflict:', error);
      toast.error(t('conflicts.panel.dismissError'));
    }
  };

  const handleViewDetails = (conflict: EvidenceConflict) => {
    setSelectedConflict(conflict);
    loadClaimsForConflict(conflict);
  };

  const handleRunDetection = async () => {
    try {
      const results = await detectConflicts.mutateAsync();
      toast.success(t('conflicts.panel.detectionComplete', { count: results.length }));
      refetch();
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      toast.error(t('conflicts.panel.detectionError'));
    }
  };

  const getStatusIcon = (status: ConflictStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_review': return <AlertTriangle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4" />;
      case 'dismissed': return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredConflicts = conflicts.filter(c => 
    levelFilter === 'all' || c.conflict_level === levelFilter
  );

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <ConflictAlert />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {t('conflicts.panel.title')}
              </CardTitle>
              <CardDescription>
                {t('conflicts.panel.description')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunDetection}
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('conflicts.panel.runDetection')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConflictStatus)}>
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  {getStatusIcon('pending')}
                  {t('conflicts.status.pending')}
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="in_review" className="gap-2">
                  {getStatusIcon('in_review')}
                  {t('conflicts.status.inReview')}
                </TabsTrigger>
                <TabsTrigger value="resolved" className="gap-2">
                  {getStatusIcon('resolved')}
                  {t('conflicts.status.resolved')}
                </TabsTrigger>
                <TabsTrigger value="dismissed" className="gap-2">
                  {getStatusIcon('dismissed')}
                  {t('conflicts.status.dismissed')}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as ConflictLevel | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('conflicts.panel.filterByLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('conflicts.panel.allLevels')}</SelectItem>
                  <SelectItem value="high">{t('conflicts.level.high')}</SelectItem>
                  <SelectItem value="moderate">{t('conflicts.level.moderate')}</SelectItem>
                  <SelectItem value="low">{t('conflicts.level.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conflict List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConflicts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <p className="text-lg font-medium">
                {t('conflicts.panel.noConflicts')}
              </p>
              <p className="text-muted-foreground">
                {t('conflicts.panel.noConflictsDesc')}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredConflicts.map(conflict => (
                  <ConflictCard
                    key={conflict.id}
                    conflict={conflict}
                    claims={selectedConflict?.id === conflict.id ? selectedConflictClaims : []}
                    isLoadingClaims={loadingClaimsFor === conflict.id}
                    onResolve={() => handleResolve(conflict)}
                    onDismiss={() => handleDismiss(conflict)}
                    onViewDetails={() => handleViewDetails(conflict)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      {selectedConflict && (
        <ResolutionDialog
          open={showResolutionDialog}
          onOpenChange={setShowResolutionDialog}
          conflict={selectedConflict}
          claims={selectedConflictClaims}
          onResolved={() => {
            setSelectedConflict(null);
            setSelectedConflictClaims([]);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default ConflictReviewPanel;
