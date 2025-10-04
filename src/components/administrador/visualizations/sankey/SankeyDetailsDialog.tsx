
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SankeyLink, SankeyNode } from './types';

interface SankeyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLink: SankeyLink | null;
  selectedNode: SankeyNode | null;
}

const SankeyDetailsDialog: React.FC<SankeyDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedLink,
  selectedNode,
}) => {
  const { t } = useTranslation();
  
  if (!selectedLink && !selectedNode) return null;

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'nutraceutico': return t('sankey.details.nutraceutical');
      case 'condicao': return t('sankey.details.condition');
      case 'outcome': return t('sankey.details.outcome');
      case 'severidade': return t('sankey.details.severity');
      default: return category;
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    switch(type) {
      case 'prevention': return t('sankey.details.prevention');
      case 'treatment': return t('sankey.details.treatment');
      case 'support': return t('sankey.details.support');
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedNode ? (
              <span>{selectedNode.name}</span>
            ) : selectedLink ? (
              <span>
                {t('sankey.details.relationTitle')}: <span className="font-normal">{selectedLink.sourceName || t('sankey.details.source')}</span> → <span className="font-normal">{selectedLink.targetName || t('sankey.details.target')}</span>
              </span>
            ) : (
              t('sankey.details.title')
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedNode ? (
              <Badge variant="outline" className={
                selectedNode.category === 'nutraceutico' ? 'bg-blue-100 text-blue-700' : 
                selectedNode.category === 'condicao' ? 'bg-green-100 text-green-700' : 
                selectedNode.category === 'outcome' ? 'bg-amber-100 text-amber-700' :
                selectedNode.category === 'severidade' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }>
                {getCategoryLabel(selectedNode.category)}
              </Badge>
            ) : selectedLink ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  {t('sankey.details.efficacy')}: {selectedLink.value}%
                </Badge>
                {selectedLink.studyCount && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    {selectedLink.studyCount} {t('sankey.details.studies')}
                  </Badge>
                )}
                {selectedLink.evidenceLevel && (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {t('sankey.details.evidence')}: {selectedLink.evidenceLevel}
                  </Badge>
                )}
              </div>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {selectedNode ? (
            <div>
              <h4 className="text-sm font-medium mb-1">{t('sankey.details.description')}</h4>
              <p className="text-sm text-gray-700 mb-4">
                {selectedNode.description || `${selectedNode.name} é um ${getCategoryLabel(selectedNode.category)}.`}
              </p>
            </div>
          ) : selectedLink ? (
            <div>
              {selectedLink.description ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">{t('sankey.details.description')}</h4>
                  <p className="text-sm text-gray-700">{selectedLink.description}</p>
                </div>
              ) : null}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">{t('sankey.details.source')}</h4>
                  <div className="p-3 rounded-md bg-gray-50 text-sm">
                    {selectedLink.sourceName || t('sankey.details.source')}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">{t('sankey.details.target')}</h4>
                  <div className="p-3 rounded-md bg-gray-50 text-sm">
                    {selectedLink.targetName || t('sankey.details.target')}
                  </div>
                </div>
              </div>
              
              {selectedLink.relationshipType && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">{t('sankey.details.relationshipType')}</h4>
                  <Badge variant="outline">
                    {getRelationshipTypeLabel(selectedLink.relationshipType)}
                  </Badge>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('sankey.details.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SankeyDetailsDialog;
