import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Check, X, Merge, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useBaseKnowledgeCandidates, 
  useCandidatesStats, 
  useUpdateCandidateStatus,
  useApproveCandidate,
  useDeleteCandidate,
  BaseKnowledgeCandidate 
} from '@/hooks/useBaseKnowledgeCandidates';

const CandidatesQueue: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedCandidate, setSelectedCandidate] = useState<BaseKnowledgeCandidate | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [targetTable, setTargetTable] = useState<'nutraceuticals' | 'health_conditions' | 'veterinary_ontology'>('nutraceuticals');

  const { data: candidates, isLoading } = useBaseKnowledgeCandidates(statusFilter === 'all' ? undefined : statusFilter);
  const { data: stats } = useCandidatesStats();
  const updateStatus = useUpdateCandidateStatus();
  const approveCandidate = useApproveCandidate();
  const deleteCandidate = useDeleteCandidate();

  const handleApprove = async () => {
    if (!selectedCandidate) return;
    
    await approveCandidate.mutateAsync({
      candidate: selectedCandidate,
      targetTable
    });
    
    setApprovalDialogOpen(false);
    setSelectedCandidate(null);
    setReviewNotes('');
  };

  const handleReject = async () => {
    if (!selectedCandidate) return;
    
    await updateStatus.mutateAsync({
      id: selectedCandidate.id,
      status: 'rejected',
      review_notes: reviewNotes
    });
    
    setRejectDialogOpen(false);
    setSelectedCandidate(null);
    setReviewNotes('');
  };

  const sourceColors: Record<string, string> = {
    'ChEBI': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'PubChem': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'KEGG': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'MeSH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'manual': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };

  const statusColors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'merged': 'bg-blue-100 text-blue-800'
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('admin.baseKnowledge.candidates.title', 'Fila de Curadoria')}
          </CardTitle>
          <CardDescription>
            {t('admin.baseKnowledge.candidates.description', 'Revise e aprove candidatos para a base de conhecimento')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">{t('admin.baseKnowledge.status.pending', 'Pendentes')}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">{t('admin.baseKnowledge.status.approved', 'Aprovados')}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">{t('admin.baseKnowledge.status.rejected', 'Rejeitados')}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.merged}</p>
                <p className="text-sm text-muted-foreground">{t('admin.baseKnowledge.status.merged', 'Mesclados')}</p>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="pending">
                {t('admin.baseKnowledge.status.pending', 'Pendentes')}
                {stats && stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-2">{stats.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">{t('admin.baseKnowledge.status.approved', 'Aprovados')}</TabsTrigger>
              <TabsTrigger value="rejected">{t('admin.baseKnowledge.status.rejected', 'Rejeitados')}</TabsTrigger>
              <TabsTrigger value="all">{t('common.all', 'Todos')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Candidates List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : candidates && candidates.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-medium">{candidate.entity_name}</span>
                        {candidate.entity_name_en && candidate.entity_name_en !== candidate.entity_name && (
                          <span className="text-sm text-muted-foreground">({candidate.entity_name_en})</span>
                        )}
                        <Badge className={sourceColors[candidate.external_source] || sourceColors.manual}>
                          {candidate.external_source}
                        </Badge>
                        <Badge variant="outline">{candidate.entity_type}</Badge>
                        <Badge className={statusColors[candidate.status]}>
                          {candidate.status}
                        </Badge>
                      </div>

                      {/* Harmonization Warning */}
                      {candidate.similarity_score && candidate.similarity_score > 0.7 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded mb-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-800 dark:text-yellow-200">
                            {candidate.harmonization_suggestion || 
                              `Similaridade ${Math.round((candidate.similarity_score || 0) * 100)}% com entidade existente`
                            }
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {candidate.external_id && <p>ID: {candidate.external_id}</p>}
                        {candidate.chemical_formula && <p>Fórmula: {candidate.chemical_formula}</p>}
                        {candidate.description && (
                          <p className="line-clamp-2">{candidate.description}</p>
                        )}
                        {candidate.synonyms && candidate.synonyms.length > 0 && (
                          <p className="truncate">Sinônimos: {candidate.synonyms.slice(0, 3).join(', ')}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {candidate.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setApprovalDialogOpen(true);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {candidate.external_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={candidate.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('admin.baseKnowledge.candidates.empty', 'Nenhum candidato nesta categoria')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.baseKnowledge.approval.title', 'Aprovar Candidato')}</DialogTitle>
            <DialogDescription>
              {t('admin.baseKnowledge.approval.description', 'Escolha a tabela de destino para criar a nova entidade')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedCandidate.entity_name}</p>
                <p className="text-sm text-muted-foreground">{selectedCandidate.entity_type}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('admin.baseKnowledge.approval.targetTable', 'Tabela de Destino')}
                </label>
                <Select value={targetTable} onValueChange={(v) => setTargetTable(v as typeof targetTable)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nutraceuticals">{t('admin.baseKnowledge.tables.nutraceuticals', 'Nutracêuticos')}</SelectItem>
                    <SelectItem value="health_conditions">{t('admin.baseKnowledge.tables.conditions', 'Condições de Saúde')}</SelectItem>
                    <SelectItem value="veterinary_ontology">{t('admin.baseKnowledge.tables.ontology', 'Ontologia Veterinária')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('admin.baseKnowledge.approval.notes', 'Notas (opcional)')}
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={t('admin.baseKnowledge.approval.notesPlaceholder', 'Adicione observações sobre esta aprovação...')}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={approveCandidate.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveCandidate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              {t('admin.baseKnowledge.approval.approve', 'Aprovar e Criar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.baseKnowledge.rejection.title', 'Rejeitar Candidato')}</DialogTitle>
            <DialogDescription>
              {t('admin.baseKnowledge.rejection.description', 'Informe o motivo da rejeição')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedCandidate.entity_name}</p>
                <p className="text-sm text-muted-foreground">{selectedCandidate.entity_type}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('admin.baseKnowledge.rejection.reason', 'Motivo da Rejeição')}
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={t('admin.baseKnowledge.rejection.reasonPlaceholder', 'Explique por que este candidato foi rejeitado...')}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button 
              onClick={handleReject}
              disabled={updateStatus.isPending || !reviewNotes.trim()}
              variant="destructive"
            >
              {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <X className="h-4 w-4 mr-2" />
              {t('admin.baseKnowledge.rejection.reject', 'Rejeitar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CandidatesQueue;
