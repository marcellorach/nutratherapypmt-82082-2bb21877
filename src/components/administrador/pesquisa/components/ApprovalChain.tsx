
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';
import { ApprovalStage, ApprovalStep } from '../types/sugestoes';
import { approvalStages } from '../data/sugestoesData';

interface ApprovalChainProps {
  approvalChain: ApprovalStep[];
}

const ApprovalChain: React.FC<ApprovalChainProps> = ({ approvalChain }) => {
  const { t } = useTranslation();
  
  // Se não tiver cadeia de aprovação, retorna null
  if (!approvalChain || approvalChain.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{t('studyProposals.approvalChain.title')}</h4>
      <ul className="space-y-2">
        {approvalStages.map((stage) => {
          const approvalItem = approvalChain.find(item => item.stage === stage.id);
          let status: 'pending' | 'approved' | 'current' = 'pending';
          let statusText = t('studyProposals.approvalChain.statusLabels.pending');
          let date = '';
          
          if (approvalItem) {
            if (approvalItem.approved === true) {
              status = 'approved';
              statusText = t('studyProposals.approvalChain.statusLabels.approved');
              date = approvalItem.date || '';
            } else if (approvalItem.approved === null) {
              status = 'current';
              statusText = t('studyProposals.approvalChain.statusLabels.inAnalysis');
            }
          }
          
          const StageIcon = stage.icon;
          
          return (
            <li key={stage.id} className="flex items-center gap-2">
              <div className={`
                flex items-center justify-between w-full p-2 rounded-md
                ${status === 'approved' ? 'bg-green-50' : 
                  status === 'current' ? 'bg-amber-50' : 'bg-gray-50'}
              `}>
                <div className="flex items-center gap-2">
                  <StageIcon className={`h-4 w-4 
                    ${status === 'approved' ? 'text-green-500' : 
                      status === 'current' ? 'text-amber-500' : 'text-gray-400'}
                  `} />
                  <span className="text-sm font-medium">{t(`studyProposals.approvalChain.stages.${stage.id.replace(/_/g, '')}` as any)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`
                    ${status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                      status === 'current' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                      'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                  `}>
                    {statusText}
                  </Badge>
                  {date && <span className="text-xs text-muted-foreground">{date}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ApprovalChain;
