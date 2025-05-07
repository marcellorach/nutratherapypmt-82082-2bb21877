
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SankeyNode, SankeyLink } from './types';
import { Badge } from '@/components/ui/badge';
import EvidenceLegend from '../EvidenceLegend';

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
  selectedTargetNode
}) => {
  if (!selectedLink || !selectedSourceNode || !selectedTargetNode) {
    return null;
  }
  
  const efficacyScore = selectedLink.value / 20; // Convertendo de volta para escala 0-5
  
  // Determinar tipo de relação em português
  let relationshipType = '';
  switch (selectedLink.relationshipType) {
    case 'prevention':
      relationshipType = 'Prevenção';
      break;
    case 'treatment':
      relationshipType = 'Tratamento';
      break;
    case 'support':
      relationshipType = 'Suporte';
      break;
    default:
      relationshipType = 'Outro';
  }

  // Determinar classe CSS para a cor do badge
  let badgeClassName = "bg-amber-100 text-amber-700";
  if (relationshipType === 'Prevenção') {
    badgeClassName = "bg-green-100 text-green-700";
  } else if (relationshipType === 'Tratamento') {
    badgeClassName = "bg-blue-100 text-blue-700";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalhes da Relação
          </DialogTitle>
          <DialogDescription className="text-base flex items-center gap-2">
            <span className="font-medium text-primary">{selectedSourceNode.name}</span> → 
            <span className="font-medium text-primary">{selectedTargetNode.name}</span>
            <Badge className={badgeClassName}>{relationshipType}</Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Eficácia</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full"
                  style={{
                    width: `${efficacyScore * 20}%`,
                    backgroundColor: efficacyScore >= 4 ? '#10b981' : efficacyScore >= 3 ? '#3b82f6' : '#f59e0b'
                  }}
                ></div>
              </div>
              <span className="ml-3 font-medium">{efficacyScore.toFixed(1)}/5</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Nutracêutico</h3>
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="font-medium text-blue-700">{selectedSourceNode.name}</p>
                {selectedSourceNode.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedSourceNode.description}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Condição de Saúde</h3>
              <div className="p-3 bg-green-50 rounded-md">
                <p className="font-medium text-green-700">{selectedTargetNode.name}</p>
                {selectedTargetNode.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedTargetNode.description}</p>
                )}
              </div>
            </div>
          </div>

          {selectedLink.description && (
            <div>
              <h3 className="text-sm font-medium mb-1">Notas</h3>
              <p className="text-sm p-3 bg-gray-50 rounded-md border">{selectedLink.description}</p>
            </div>
          )}

          {selectedLink.studyCount && selectedLink.evidenceLevel && (
            <div>
              <h3 className="text-sm font-medium mb-1">Evidência Científica</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm">{selectedLink.studyCount} estudo(s) relacionado(s)</p>
                <p className="text-sm">Nível de evidência: <span className="font-medium">{Number(selectedLink.evidenceLevel).toFixed(1)}</span></p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-1">Escala de Evidência</h3>
            <EvidenceLegend compact />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {selectedLink.originalRelation?.id && (
            <Button>Ver Estudos Relacionados</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SankeyDetailsDialog;
