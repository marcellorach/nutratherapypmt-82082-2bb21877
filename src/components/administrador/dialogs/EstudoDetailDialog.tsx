
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, MessageCircle, BarChart3 } from "lucide-react";
import ApprovalStagesList from '../pesquisa/components/ApprovalStagesList';
import EvidenceTag from '../tags/EvidenceTag';
import NutraceuticalTag from '../tags/NutraceuticalTag';
import EstudoDetailSections from '../estudos/detalhes/sections/EstudoDetailSections';
import VisaoGeralTab from '../estudos/detalhes/tabs/VisaoGeralTab';
import AnaliseTab from '../estudos/detalhes/tabs/AnaliseTab';
import DocumentChatInterface from '../estudos/chat/DocumentChatInterface';
import EnhancedStudyVisualization from '../estudos/visualization/EnhancedStudyVisualization';

interface EstudoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudo?: any;
  onAdvanceApproval?: (estudoId: string) => void;
}

const EstudoDetailDialog: React.FC<EstudoDetailDialogProps> = ({
  open,
  onOpenChange,
  estudo,
  onAdvanceApproval
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!estudo) return null;

  const handleAdvanceApproval = () => {
    if (onAdvanceApproval) {
      onAdvanceApproval(estudo.id);
    }
  };

  const studyScores = {
    qualityScore: 4.2,
    relevanceScore: 3.8,
    noveltyScore: 3.5,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {estudo.title}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {estudo.journal}, {estudo.year}
            </p>
            <div className="flex items-center gap-2">
              <EvidenceTag score={4.2} showLabel={false} />
              {estudo.nutraceuticals?.map((nutra: string, idx: number) => (
                <NutraceuticalTag 
                  key={idx} 
                  name={nutra} 
                  score={[4.2, 3.9, 3.7, 4.5][idx % 4]} 
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analysis">Análise IA</TabsTrigger>
            <TabsTrigger value="conditions">Condições</TabsTrigger>
            <TabsTrigger value="visualizations">
              <BarChart3 className="h-4 w-4 mr-1" />
              Visualizações
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="approval">Aprovação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <VisaoGeralTab estudo={estudo} studyScores={studyScores} />
          </TabsContent>

          <TabsContent value="analysis">
            <AnaliseTab estudo={estudo} />
          </TabsContent>

          <TabsContent value="conditions">
            <EstudoDetailSections estudo={estudo} />
          </TabsContent>

          <TabsContent value="visualizations">
            <EnhancedStudyVisualization 
              study={estudo}
              extractedData={estudo.analysis_data}
            />
          </TabsContent>

          <TabsContent value="chat">
            <DocumentChatInterface 
              studyId={estudo.id}
              studyTitle={estudo.title}
            />
          </TabsContent>

          <TabsContent value="approval">
            <ApprovalStagesList 
              stages={[
                { name: 'Análise Inicial', status: 'completed' },
                { name: 'Análise IA', status: 'completed' },
                { name: 'Revisão Técnica', status: 'in-progress' },
                { name: 'Aprovação Final', status: 'pending' }
              ]}
            />
            
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium">Histórico de Aprovação</h4>
              <ul className="space-y-2 mt-2">
                <li className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                  <span>Submetido para análise inicial</span>
                  <span className="text-gray-500">10/04/2024</span>
                </li>
                <li className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                  <span>Análise inicial concluída</span>
                  <span className="text-gray-500">12/04/2024</span>
                </li>
                <li className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                  <span>Análise de IA concluída</span>
                  <span className="text-gray-500">15/04/2024</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
          
          <div className="flex gap-2">
            {activeTab === "approval" && (
              <Button 
                onClick={() => handleAdvanceApproval()}
                size="sm"
                className="flex items-center"
              >
                <span>Avançar Estágio</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EstudoDetailDialog;
