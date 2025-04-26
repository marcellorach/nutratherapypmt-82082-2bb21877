import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, BarChart2 } from 'lucide-react';
import { MatrixCell, MatrixItem } from './types';

interface EfficacyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCell: MatrixCell | null;
  selectedNutraceutico: MatrixItem | null;
  selectedCondicao: MatrixItem | null;
  getTrendIndicator: (score: number) => JSX.Element;
}

export const EfficacyDetailsDialog: React.FC<EfficacyDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedCell,
  selectedNutraceutico,
  selectedCondicao,
  getTrendIndicator
}) => {
  if (!selectedCell || !selectedNutraceutico || !selectedCondicao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Eficácia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-600">
                  {selectedNutraceutico.name}
                </h3>
                <Badge variant="outline" className="mt-1">
                  Nutracêutico
                </Badge>
              </div>
              <div className="text-2xl font-light text-gray-300">→</div>
              <div className="text-right">
                <h3 className="text-lg font-semibold text-green-600">
                  {selectedCondicao.name}
                </h3>
                <Badge variant="outline" className="mt-1">
                  Condição de Saúde
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-md">
            <h4 className="font-medium mb-3">Informações de Eficácia</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-500">Pontuação de Eficácia</p>
                <div className="flex items-baseline">
                  <p className="text-xl font-medium mr-2">{selectedCell.efficacyScore}/100</p>
                  {getTrendIndicator(selectedCell.efficacyScore)}
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-2 ${selectedCell.efficacyScore >= 80 ? 'bg-green-500' : selectedCell.efficacyScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${selectedCell.efficacyScore}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-500">Nível de Evidência</p>
                <p className="text-xl font-medium">{selectedCell.evidenceLevel || "Moderado"}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Baseado em {selectedCell.studyCount} {selectedCell.studyCount === 1 ? 'estudo' : 'estudos'}
                </div>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-gray-500">Confiabilidade</p>
                <p className="text-xl font-medium">
                  {selectedCell.studyCount >= 10 ? 'Alta' : selectedCell.studyCount >= 5 ? 'Média' : 'Limitada'}
                </p>
                <div className="flex mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-1 rounded-full mr-1 ${
                        i < (selectedCell.studyCount > 10 ? 5 : selectedCell.studyCount > 5 ? 3 : 1) 
                        ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <PieChart className="h-4 w-4 mr-2 text-blue-500" />
                Histórico de Eficácia
              </h4>
              <div className="h-[180px] bg-slate-50 border rounded-md flex items-center justify-center">
                <div className="text-sm text-gray-500">
                  Histórico de dados de eficácia ao longo do tempo
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <BarChart2 className="h-4 w-4 mr-2 text-green-500" />
                Comparativo com Alternativas
              </h4>
              <div className="h-[180px] bg-slate-50 border rounded-md flex items-center justify-center">
                <div className="text-sm text-gray-500">
                  Comparação com outros nutracêuticos para mesma condição
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Descrição da Relação</h4>
            <div className="bg-slate-50 p-4 rounded-md border">
              <p className="text-sm text-gray-600">
                {selectedCell.description || 
                  `A relação entre ${selectedNutraceutico.name} e ${selectedCondicao.name} 
                   tem sido estudada em diversos trabalhos científicos, mostrando 
                   ${selectedCell.efficacyScore >= 70 ? 'resultados bastante promissores' : 
                    selectedCell.efficacyScore >= 40 ? 'resultados moderadamente positivos' : 
                    'alguns resultados preliminares'}.`
                }
              </p>
              
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-medium mb-2 text-sm">Recomendações</h5>
                <p className="text-sm text-gray-600">
                  {selectedCell.efficacyScore >= 80 ? 
                    `O uso de ${selectedNutraceutico.name} é altamente recomendado para casos de ${selectedCondicao.name}, com fortes evidências científicas de eficácia.` :
                   selectedCell.efficacyScore >= 60 ?
                    `${selectedNutraceutico.name} apresenta bons resultados no tratamento de ${selectedCondicao.name}, sendo uma opção terapêutica com evidências consistentes.` :
                   selectedCell.efficacyScore >= 40 ?
                    `${selectedNutraceutico.name} pode ser considerado como terapia complementar para ${selectedCondicao.name}, embora as evidências sejam moderadas.` :
                    `O uso de ${selectedNutraceutico.name} para ${selectedCondicao.name} ainda requer mais estudos para confirmar sua eficácia.`
                  }
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4 flex justify-end space-x-2">
              <Button variant="outline">Ver Estudos Relacionados ({selectedCell.studyCount})</Button>
              <Button>Explorar Interações</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
