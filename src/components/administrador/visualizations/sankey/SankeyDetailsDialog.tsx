
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SankeyLink, SankeyNode } from './types';
import { EvidenceLegend } from '../EvidenceLegend';

interface SankeyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLink: SankeyLink | null;
  selectedSourceNode: SankeyNode | null;
  selectedTargetNode: SankeyNode | null;
}

const SankeyDetailsDialog: React.FC<SankeyDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedLink,
  selectedSourceNode,
  selectedTargetNode,
}) => {
  if (!selectedSourceNode || !selectedTargetNode || !selectedLink) return null;

  // Determinar o tipo de relacionamento
  let relationshipType = 'Relação';
  if (selectedLink.relationshipType) {
    switch(selectedLink.relationshipType) {
      case 'prevention':
        relationshipType = 'Prevenção';
        break;
      case 'treatment':
        relationshipType = 'Tratamento';
        break;
      case 'support':
        relationshipType = 'Suporte';
        break;
    }
  }

  // Calcular a eficácia real (de 0-5)
  const efficacyValue = selectedLink.value / 20;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Relação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">
                  {selectedSourceNode.name}
                </h3>
                <Badge variant="outline" className="mt-1">
                  {selectedSourceNode.category === 'nutraceutico' ? 'Nutracêutico' : 'Condição'}
                </Badge>
                {selectedSourceNode.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedSourceNode.description}</p>
                )}
              </div>
              <div className="text-2xl font-light text-gray-300">→</div>
              <div className="text-right">
                <h3 className="text-lg font-semibold text-green-600">
                  {selectedTargetNode.name}
                </h3>
                <Badge variant="outline" className="mt-1">
                  {selectedTargetNode.category === 'nutraceutico' ? 'Nutracêutico' : 'Condição'}
                </Badge>
                {selectedTargetNode.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedTargetNode.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Informações sobre a Relação</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-500">Tipo de Relação</p>
                <p className="text-xl font-medium">{relationshipType}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-500">Grau de Eficácia</p>
                <p className="text-xl font-medium">{efficacyValue}/5</p>
                <p className="text-sm text-gray-500">{selectedLink.labelText || 'Não categorizado'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Evidências Científicas</h4>
            <p className="text-sm text-gray-600">
              {selectedLink.description || 
                `A relação entre ${selectedSourceNode.name} e ${selectedTargetNode.name} 
                 tem sido estudada em diversos trabalhos científicos, mostrando 
                 ${efficacyValue >= 4 ? 'resultados bastante promissores' : 
                   efficacyValue >= 3 ? 'resultados moderadamente positivos' : 
                   'alguns resultados preliminares'}.`
              }
            </p>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Legenda de Eficácia</h4>
              <EvidenceLegend compact={true} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SankeyDetailsDialog;
