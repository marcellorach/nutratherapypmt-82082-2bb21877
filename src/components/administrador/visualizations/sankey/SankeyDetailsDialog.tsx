
import React from 'react';
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
  if (!selectedLink && !selectedNode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedNode ? (
              <span>{selectedNode.name}</span>
            ) : selectedLink ? (
              <span>
                Relação: <span className="font-normal">{selectedLink.sourceName || 'Origem'}</span> → <span className="font-normal">{selectedLink.targetName || 'Destino'}</span>
              </span>
            ) : (
              'Detalhes'
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
                {selectedNode.category === 'nutraceutico' ? 'Nutracêutico' : 
                 selectedNode.category === 'condicao' ? 'Condição de Saúde' : 
                 selectedNode.category === 'outcome' ? 'Resultado' : 
                 selectedNode.category === 'severidade' ? 'Severidade' : 
                 selectedNode.category}
              </Badge>
            ) : selectedLink ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  Eficácia: {selectedLink.value}%
                </Badge>
                {selectedLink.studyCount && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    {selectedLink.studyCount} Estudos
                  </Badge>
                )}
                {selectedLink.evidenceLevel && (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    Evidência: {selectedLink.evidenceLevel}
                  </Badge>
                )}
              </div>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {selectedNode ? (
            <div>
              <h4 className="text-sm font-medium mb-1">Descrição</h4>
              <p className="text-sm text-gray-700 mb-4">
                {selectedNode.description || `${selectedNode.name} é um ${selectedNode.category}.`}
              </p>
            </div>
          ) : selectedLink ? (
            <div>
              {selectedLink.description ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">Detalhes</h4>
                  <p className="text-sm text-gray-700">{selectedLink.description}</p>
                </div>
              ) : null}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Origem</h4>
                  <div className="p-3 rounded-md bg-gray-50 text-sm">
                    {selectedLink.sourceName || 'Origem'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Destino</h4>
                  <div className="p-3 rounded-md bg-gray-50 text-sm">
                    {selectedLink.targetName || 'Destino'}
                  </div>
                </div>
              </div>
              
              {selectedLink.relationshipType && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">Tipo de Relação</h4>
                  <Badge variant="outline">
                    {selectedLink.relationshipType === 'prevention' ? 'Prevenção' : 
                     selectedLink.relationshipType === 'treatment' ? 'Tratamento' : 
                     selectedLink.relationshipType === 'support' ? 'Suporte' : 
                     selectedLink.relationshipType}
                  </Badge>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SankeyDetailsDialog;
