import React, { useEffect, useState } from 'react';
import { useStudyApprovalWorkflow } from '@/hooks/useStudyApprovalWorkflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface ApprovalTabProps {
  estudo: any;
  onAdvanceApproval?: (estudoId: string) => void;
}

interface Stage {
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  date?: string;
  count?: number;
  approved?: number;
  pending?: number;
}

const ApprovalTab: React.FC<ApprovalTabProps> = ({ estudo, onAdvanceApproval }) => {
  const { t } = useTranslation();
  const { getApprovalStages, isProcessing } = useStudyApprovalWorkflow();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripletStats, setTripletStats] = useState({ total: 0, approved: 0, pending: 0 });

  useEffect(() => {
    loadApprovalData();
  }, [estudo?.id]);

  const loadApprovalData = async () => {
    if (!estudo?.id) return;
    
    setLoading(true);
    try {
      const { stages: fetchedStages, triplets } = await getApprovalStages(estudo.id);
      setStages(fetchedStages);
      
      const approved = triplets?.filter(t => t.curation_status === 'approved').length || 0;
      const pending = triplets?.filter(t => t.curation_status === 'pending').length || 0;
      setTripletStats({
        total: triplets?.length || 0,
        approved,
        pending
      });
    } catch (error) {
      console.error('Error loading approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">{t('studies.approval.completed', 'Concluído')}</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">{t('studies.approval.inProgress', 'Em Progresso')}</Badge>;
      default:
        return <Badge variant="outline">{t('studies.approval.pending', 'Pendente')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Triplet Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t('studies.approval.tripletStats', 'Estatísticas de Triplets')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{tripletStats.total}</span>
              <span className="text-sm text-muted-foreground">{t('common.total', 'Total')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold text-green-600">{tripletStats.approved}</span>
              <span className="text-sm text-muted-foreground">{t('studies.approval.approved', 'Aprovados')}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-lg font-semibold text-amber-600">{tripletStats.pending}</span>
              <span className="text-sm text-muted-foreground">{t('studies.approval.pendingItems', 'Pendentes')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stages List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">{t('studies.approval.stagesTitle', 'Estágios de Aprovação')}</h4>
        {stages.map((stage, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(stage.status)}
              <div>
                <span className="font-medium">{stage.name}</span>
                {stage.count !== undefined && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({stage.count} {t('studies.approval.items', 'itens')})
                  </span>
                )}
                {stage.approved !== undefined && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({stage.approved} {t('studies.approval.approved', 'aprovados')}, {stage.pending} {t('studies.approval.pendingItems', 'pendentes')})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stage.date && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(stage.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              )}
              {getStatusBadge(stage.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {estudo?.kanban_status !== 'approved' && onAdvanceApproval && (
        <div className="pt-4 border-t">
          <Button 
            onClick={() => onAdvanceApproval(estudo.id)}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('studies.approval.processing', 'Processando...')}
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                {t('studies.approval.approveAndRun', 'Aprovar Estudo e Executar Workflow')}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t('studies.approval.workflowDescription', 'Isso irá auto-aprovar triplets de alta confiança, consolidar o knowledge graph e sincronizar com Neo4j.')}
          </p>
        </div>
      )}

      {estudo?.kanban_status === 'approved' && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{t('studies.approval.studyApproved', 'Estudo Aprovado')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalTab;
