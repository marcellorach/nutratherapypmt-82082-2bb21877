
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
import { EnhancedSankeyNode, EnhancedSankeyLink } from './types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

interface SankeyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLink: EnhancedSankeyLink | null;
  selectedNode: EnhancedSankeyNode | null;
}

const SankeyDetailsDialog: React.FC<SankeyDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedLink,
  selectedNode
}) => {
  // Se não houver link ou nó selecionado, não renderiza nada
  if (!selectedLink && !selectedNode) {
    return null;
  }

  // Se temos um link selecionado, mostramos detalhes do link
  if (selectedLink) {
    return <LinkDetailsDialog open={open} onOpenChange={onOpenChange} selectedLink={selectedLink} />;
  }

  // Caso contrário, mostramos detalhes do nó
  return <NodeDetailsDialog open={open} onOpenChange={onOpenChange} selectedNode={selectedNode!} />;
};

interface LinkDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLink: EnhancedSankeyLink;
}

const LinkDetailsDialog: React.FC<LinkDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedLink
}) => {
  const sourceName = selectedLink.sourceName || 'Origem';
  const targetName = selectedLink.targetName || 'Destino';
  const efficacyScore = selectedLink.efficacyScore || (selectedLink.value / 20); // 0-5 scale
  
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
    case 'study':
      relationshipType = 'Estudo';
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
  } else if (relationshipType === 'Suporte') {
    badgeClassName = "bg-orange-100 text-orange-700";
  } else if (relationshipType === 'Estudo') {
    badgeClassName = "bg-purple-100 text-purple-700";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalhes da Relação
          </DialogTitle>
          <DialogDescription className="text-base flex items-center gap-2">
            <span className="font-medium text-primary">{sourceName}</span> → 
            <span className="font-medium text-primary">{targetName}</span>
            <Badge className={badgeClassName}>{relationshipType}</Badge>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="studies">Estudos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
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
                <Card className="p-3 bg-blue-50 rounded-md border-blue-200">
                  <h3 className="text-sm font-medium mb-1 text-blue-700">Origem</h3>
                  <p className="font-medium text-blue-700">{sourceName}</p>
                  {selectedLink.description && (
                    <p className="text-sm text-blue-600 mt-1 line-clamp-2">{selectedLink.description}</p>
                  )}
                </Card>
                
                <Card className="p-3 bg-green-50 rounded-md border-green-200">
                  <h3 className="text-sm font-medium mb-1 text-green-700">Destino</h3>
                  <p className="font-medium text-green-700">{targetName}</p>
                </Card>
              </div>

              {selectedLink.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Notas</h3>
                  <p className="text-sm p-3 bg-gray-50 rounded-md border">{selectedLink.description}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-4">
              {selectedLink.treatabilityScore && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Tratabilidade</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-rose-500"
                        style={{
                          width: `${(selectedLink.treatabilityScore / 5) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="ml-3 font-medium">{selectedLink.treatabilityScore.toFixed(1)}/5</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Quão efetivo é o tratamento para esta condição</p>
                </div>
              )}
              
              {selectedLink.evidenceStrength && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Força da Evidência</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-purple-500"
                        style={{
                          width: `${(selectedLink.evidenceStrength / 5) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="ml-3 font-medium">{selectedLink.evidenceStrength.toFixed(1)}/5</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Qualidade e quantidade de evidências científicas</p>
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
            </TabsContent>
            
            <TabsContent value="studies">
              {selectedLink.studyCount && selectedLink.studyCount > 0 ? (
                <div>
                  <p className="mb-3">Encontramos {selectedLink.studyCount} estudo(s) que suportam esta relação.</p>
                  <ul className="space-y-2">
                    {[...Array(Math.min(selectedLink.studyCount, 3))].map((_, i) => (
                      <li key={i} className="p-2 border rounded-md">
                        <p className="font-medium">Estudo {i+1}</p>
                        <p className="text-sm text-gray-600">Autor et al., 2023</p>
                        <p className="text-xs text-gray-500 mt-1">Relevância: {(Math.random() * 2 + 3).toFixed(1)}/5</p>
                      </li>
                    ))}
                  </ul>
                  {selectedLink.studyCount > 3 && (
                    <p className="text-xs text-gray-500 mt-2">+ {selectedLink.studyCount - 3} outros estudos</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Nenhum estudo específico vinculado a esta relação</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {selectedLink.originalRelation?.id && (
            <Button variant="default">Ver Estudos Relacionados</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface NodeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNode: EnhancedSankeyNode;
}

const NodeDetailsDialog: React.FC<NodeDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedNode
}) => {
  let categoryLabel = selectedNode.category;
  let categoryColor = 'bg-gray-100 text-gray-700 border-gray-200';
  
  switch (selectedNode.category) {
    case 'nutraceutico':
      categoryLabel = 'Nutracêutico';
      categoryColor = 'bg-blue-100 text-blue-700 border-blue-200';
      break;
    case 'condicao':
      categoryLabel = 'Condição';
      categoryColor = 'bg-green-100 text-green-700 border-green-200';
      break;
    case 'outcome':
      categoryLabel = 'Outcome';
      categoryColor = 'bg-amber-100 text-amber-700 border-amber-200';
      break;
    case 'severidade':
      categoryLabel = 'Severidade';
      categoryColor = 'bg-purple-100 text-purple-700 border-purple-200';
      break;
    case 'tratabilidade':
      categoryLabel = 'Tratabilidade';
      categoryColor = 'bg-rose-100 text-rose-700 border-rose-200';
      break;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <span>{selectedNode.name}</span>
            <Badge className={categoryColor}>{categoryLabel}</Badge>
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas e conexões
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="connections">Conexões</TabsTrigger>
              <TabsTrigger value="studies">Estudos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              {selectedNode.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Descrição</h3>
                  <p className="text-sm p-3 bg-gray-50 rounded-md border">{selectedNode.description}</p>
                </div>
              )}
              
              {selectedNode.category === 'nutraceutico' && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Propriedades</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Substância ativa:</span>
                      <span className="font-medium">Exemplo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dosagem típica:</span>
                      <span className="font-medium">500mg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fonte:</span>
                      <span className="font-medium">Natural</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Biodisponibilidade:</span>
                      <span className="font-medium">Média</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Metadados</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedNode.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500">{key}:</span>
                        <span className="font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="connections">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Conexões Principais</h3>
                  <ul className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <li key={i} className="flex justify-between items-center p-2 border rounded-md">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span>Exemplo de conexão {i}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">Alta</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Ver todas as conexões
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="studies">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Estudos Relacionados</h3>
                  <ul className="space-y-2">
                    {[1, 2].map(i => (
                      <li key={i} className="p-2 border rounded-md">
                        <p className="font-medium">Estudo {i}</p>
                        <p className="text-sm text-gray-600">Autor et al., 2023</p>
                        <p className="text-xs text-gray-500 mt-1">Relevância: {(Math.random() * 2 + 3).toFixed(1)}/5</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">+ outros estudos</p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Ver todos os estudos
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button>Ver Detalhes Completos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SankeyDetailsDialog;
